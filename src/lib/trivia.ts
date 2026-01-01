import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from './supabase';

// Utility Interaces

export interface TriviaQuestion {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

export interface ProcessedQuestion {
    text: string;
    options: string[];
    correctAnswer: number;
}

interface RawQuestion {
    text: string;
    correct: string;
    incorrect: string[];
}

/**
 * Decodes HTML entities in a string.
 */
function decodeHtmlEntities(text: string): string {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

/**
 * Helper to wait for a period of time.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Global variables to handle API rate limits and state
 */
let isFetchingQuestions = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 10000; // 10 seconds
let geminiBroken = localStorage.getItem('gemini_broken') === 'true';

/**
 * CẤU HÌNH PROMPT MỚI THÔNG MINH HƠN
 */
const SYSTEM_PROMPT = `Bạn là một chuyên gia biên tập câu đố (Trivia Master) thông thái và am hiểu văn hóa.
Nhiệm vụ: Bản địa hóa (Localize) mảng dữ liệu JSON từ tiếng Anh sang tiếng Việt chuẩn xác nhất.

QUY TẮC "DỊCH THUẬT THÔNG MINH" (BẮT BUỘC):

1. NGUYÊN TẮC BẤT DI BẤT DỊCH VỀ TÊN RIÊNG:
   - TUYỆT ĐỐI GIỮ NGUYÊN TIẾNG ANH: Tên Bài hát, Tên Phim, Tên Game, Tên Show truyền hình, Tên Ban nhạc, Tên Thương hiệu, Tên Nhân vật hư cấu, Tên Phần mềm.
   - Ví dụ: Giữ nguyên "Breaking Bad", "The Beatles", "Mickey Mouse", "Windows XP", "League of Legends".
   - Tên người: Giữ nguyên (VD: "George Washington", không dịch là "Gióc Oa-sinh-tơn").

2. VĂN PHONG TỰ NHIÊN & GÃY GỌN:
   - Dịch theo lối văn nói của người Việt, lược bỏ các từ thừa.
   - "In which year did..." -> Dịch là "Năm nào..."
   - "Which of the following..." -> Dịch là "Đâu là..." hoặc "Cái nào sau đây..."
   - "Who is known as..." -> Dịch là "Ai được mệnh danh là..."

3. XỬ LÝ ĐƠN VỊ ĐO LƯỜNG THÔNG MINH:
   - Nếu gặp Miles, Feet, Inch, Fahrenheit -> Giữ nguyên số gốc và tự động thêm quy đổi ra Km, Mét, Cm, Celsius trong ngoặc đơn.
   - Ví dụ: "100 miles" -> "100 dặm (khoảng 160km)".

4. XỬ LÝ CÂU HỎI VỀ NGÔN NGỮ/CHÍNH TẢ:
   - Nếu câu hỏi đố về từ vựng tiếng Anh (VD: "Chữ cái bắt đầu của từ 'Knife'"), hãy giữ nguyên từ tiếng Anh đó trong câu hỏi để người chơi hiểu logic.

5. OUTPUT FORMAT:
   - CHỈ TRẢ VỀ MẢNG JSON. Không Markdown, không giải thích, không thừa lời.`;



/**
 * Fallback translation using Google Translate free API.
 */
async function translateBatchWithGoogle(texts: string[]): Promise<string[]> {
    // ... (Giữ nguyên code cũ)
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(texts.join('\n|||\n'))}`;
        const res = await fetch(url);
        const data = await res.json();
        const translatedResult = data[0].map((segment: [string, string, string, string]) => segment[0]).join('');
        return translatedResult.split('|||').map((s: string) => s.trim());
    } catch (error) {
        console.error("Google Translation fallback error:", error);
        return texts;
    }
}

/**
 * Translates a batch of strings using Gemini AI for high quality.
 */
async function translateBatchWithGemini(texts: string[]): Promise<string[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || geminiBroken || apiKey.length < 10) {
        return translateBatchWithGoogle(texts);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        }, { apiVersion: "v1" });

        // Cập nhật cách truyền prompt để đảm bảo Gemini hiểu rõ ngữ cảnh mảng
        const prompt = `${SYSTEM_PROMPT}\n\nINPUT DATA TO TRANSLATE:\n${JSON.stringify(texts)}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const translatedArray = JSON.parse(text);
        
        if (Array.isArray(translatedArray) && translatedArray.length === texts.length) {
            return translatedArray;
        }
        throw new Error("Mismatched length");
    } catch (error) {
        // ... (Logic xử lý lỗi giữ nguyên)
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("404") || msg.includes("not found")) {
            geminiBroken = true;
            localStorage.setItem('gemini_broken', 'true');
            console.warn("Gemini (v1) not available. Switching to Google Translate.");
        } else {
            console.error("Gemini Error, falling back to Google:", msg);
        }
        return translateBatchWithGoogle(texts);
    }
}

/**
 * Fetches questions from Open Trivia DB.
 */
export async function fetchQuestions(
    amount: number = 30, 
    difficulty: string | null = null,
    userId?: string, 
    retries: number = 3
): Promise<ProcessedQuestion[]> {
    // ... (Code fetchQuestions giữ nguyên toàn bộ logic cũ)
    let token = '';

    if (userId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('opentdb_token, opentdb_token_expires_at')
            .eq('id', userId)
            .single();

        const now = new Date();
        if (profile?.opentdb_token && profile.opentdb_token_expires_at && new Date(profile.opentdb_token_expires_at) > now) {
            token = profile.opentdb_token;
        } else {
            const tokenRes = await fetch('https://opentdb.com/api_token.php?command=request');
            const tokenData = await tokenRes.json();
            if (tokenData.response_code === 0) {
                token = tokenData.token;
                const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
                await supabase
                    .from('profiles')
                    .update({
                        opentdb_token: token,
                        opentdb_token_expires_at: expiresAt.toISOString()
                    })
                    .eq('id', userId);
            }
        }
    }

    const url = `https://opentdb.com/api.php?amount=${amount}${token ? `&token=${token}` : ''}&type=multiple${difficulty ? `&difficulty=${difficulty}` : ''}`;
    
    const nowTime = Date.now();
    const timeSinceLastRequest = nowTime - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await sleep(waitTime);
    }

    while (isFetchingQuestions) {
        await sleep(500);
    }

    isFetchingQuestions = true;
    lastRequestTime = Date.now();

    try {
        const res = await fetch(url);
        
        if (res.status === 429) {
            if (retries > 0) {
                await sleep(MIN_REQUEST_INTERVAL);
                return fetchQuestions(amount, difficulty, userId, retries - 1);
            }
            isFetchingQuestions = false;
            throw new Error("Too many requests to Trivia API. Please wait a moment and try again.");
        }

        const data = await res.json();
        isFetchingQuestions = false;

        if (data.response_code === 0) {
            const rawQuestions = data.results.map((q: TriviaQuestion) => {
                const decodedQuestion = decodeHtmlEntities(q.question);
                const decodedCorrect = decodeHtmlEntities(q.correct_answer);
                const decodedIncorrect = q.incorrect_answers.map(decodeHtmlEntities);

                return {
                    text: decodedQuestion,
                    correct: decodedCorrect,
                    incorrect: decodedIncorrect
                };
            });

            const translatedQuestions: ProcessedQuestion[] = [];
            for (let i = 0; i < rawQuestions.length; i += 10) {
                const batch = rawQuestions.slice(i, i + 10);
                const stringsToTranslate: string[] = [];
                batch.forEach((q: RawQuestion) => {
                    stringsToTranslate.push(q.text, q.correct, ...q.incorrect);
                });

                const translatedStrings = await translateBatchWithGemini(stringsToTranslate);
                
                let stringIdx = 0;
                batch.forEach((q: RawQuestion) => {
                    const text = translatedStrings[stringIdx++] || q.text;
                    const correct = translatedStrings[stringIdx++] || q.correct;
                    const incorrect = [
                        translatedStrings[stringIdx++] || q.incorrect[0],
                        translatedStrings[stringIdx++] || q.incorrect[1],
                        translatedStrings[stringIdx++] || q.incorrect[2]
                    ];

                    const options = [...incorrect];
                    const randomIndex = Math.floor(Math.random() * (options.length + 1));
                    options.splice(randomIndex, 0, correct);

                    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

                    translatedQuestions.push({
                        text,
                        options: options.map(capitalize),
                        correctAnswer: randomIndex
                    });
                });
            }

            return translatedQuestions;
        } else if (data.response_code === 5 && retries > 0) {
            await sleep(MIN_REQUEST_INTERVAL);
            return fetchQuestions(amount, difficulty, userId, retries - 1);
        } else if (data.response_code === 4 && userId) {
            await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
            const result = await fetchQuestions(amount, difficulty, userId, retries); 
            isFetchingQuestions = false;
            return result;
        }

        isFetchingQuestions = false;
        throw new Error(`Failed to fetch questions: Response Code ${data.response_code}`);
    } catch (error) {
        isFetchingQuestions = false;
        throw error;
    }
}