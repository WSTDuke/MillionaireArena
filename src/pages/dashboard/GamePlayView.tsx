import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, HelpCircle, Zap, Shield, LogOut, Loader2, Flag } from 'lucide-react';

import { supabase } from '../../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { fetchQuestions } from '../../lib/trivia';
import type { ProcessedQuestion } from '../../lib/trivia';

import { leaveRoom as leaveRoomUtil } from '../../lib/roomManager';
import { calculateMMRChange, getRankFromMMR } from '../../lib/ranking';
import RankBadge from '../../components/shared/RankBadge';

interface Profile {
    display_name: string;
    avatar_url: string;
    rank_name?: string;
    mmr?: number | null;
}

interface Participant {
    id: string;
    display_name: string;
    avatar_url: string;
    is_ready: boolean;
    is_host: boolean;
    rank?: string;
}

const GamePlayView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'Normal';
    const isRanked = mode.toLowerCase() === 'ranked';
    const isBlitzmatch = mode.toLowerCase() === 'blitzmatch';
    const QUESTION_TIME = isBlitzmatch ? 10 : 15;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [modalType, setModalType] = useState<'exit' | 'surrender' | null>(null);
    const [gameStage, setGameStage] = useState<'preparing' | 'starting' | 'playing'>('preparing');
    const [introTimer, setIntroTimer] = useState(5);

    // Trivia Data States
    const [questions, setQuestions] = useState<ProcessedQuestion[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // New Quiz States
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userScore, setUserScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [showTransition, setShowTransition] = useState(false);
    const [roundPoints, setRoundPoints] = useState({ user: 0, opponent: 0 });
    const [isGameOver, setIsGameOver] = useState(false);

    // Cinematic & Set Scoring States
    const [setScores, setSetScores] = useState<{ user: number; opponent: number }>({ user: 0, opponent: 0 });
    const [roundPointsHistory, setRoundPointsHistory] = useState<{ user: number; opponent: number }>({ user: 0, opponent: 0 });
    const [roundScoresRecord, setRoundScoresRecord] = useState<{ user: number; opponent: number }[]>([]); // New State
    const [showRoundIntro, setShowRoundIntro] = useState(false);
    const [showSetResults, setShowSetResults] = useState(false);
    const [isMatchEnding, setIsMatchEnding] = useState(false);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const [showMMRSummary, setShowMMRSummary] = useState(false);
    const [mmrChange, setMmrChange] = useState<number>(0);
    const [userNewMMR, setUserNewMMR] = useState<number | null>(null);
    const mountTimeRef = useRef(0);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Refs for real-time score tracking in timeouts
    const pointsRef = useRef({ user: 0, opponent: 0 });
    const surrenderProcessedRef = useRef(false);
    const historySavedRef = useRef(false); // Prevent duplicate history saves
    const leaveRoomRef = useRef<(() => Promise<void>) | null>(null);
    const processedQuestionRef = useRef<number>(-1);
    const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bufferedOpponentAnswers = useRef<Map<number, { isCorrect: boolean; points: number; currentScore?: number }>>(new Map());
    const currIndexRef = useRef<number>(0);
    const isConfirmedRef = useRef<boolean>(false);
    const winsNeededRef = useRef<number>(1);

    const roomId = searchParams.get('roomId');
    const [roomSettings, setRoomSettings] = useState<{ questions_per_round?: number; format?: string; max_rounds?: number } | null>(null);
    const [opponent, setOpponent] = useState<Participant | null>(null);
    const [opponentAnswered, setOpponentAnswered] = useState<{ isCorrect: boolean, points: number } | null>(null);

    const questionsPerRound = roomSettings?.questions_per_round || 10;
    const matchFormat = roomSettings?.format || (isRanked ? 'Bo5' : 'Bo3');
    
    // Dynamic BoX Parsing
    const getRoundsFromFormat = (f: string) => {
        if (f.startsWith('Bo')) {
            return parseInt(f.substring(2)) || 1;
        }
        // The original logic for Bo5/Bo3 was redundant as parseInt handles it.
        // This simplified version correctly handles any BoX format.
        return 1; // Default if not BoX
    };
    
    const maxRounds = getRoundsFromFormat(matchFormat);
    const winsNeeded = Math.ceil(maxRounds / 2);

    const currentRound = Math.floor(currentQuestionIndex / questionsPerRound) + 1;
    const questionNumberInRound = (currentQuestionIndex % questionsPerRound) + 1;
    const isEndOfRound = questionNumberInRound === questionsPerRound;
    const question = questions[currentQuestionIndex];
    const hasFetched = useRef(false);


    useEffect(() => {
        // Redirect if state is lost (e.g., page reload)
        if (!roomId && !isBlitzmatch) {
            navigate('/dashboard/arena');
            return;
        }

        const getData = async () => {
            try {
                // 1. Get User Session
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoadingQuestions(false);
                    return;
                }
                setUserId(user.id);

                // 2. Fetch Profile and Room Data parallelly
                const [profileRes, roomRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', user.id).single(),
                    roomId 
                        ? supabase.from('rooms').select('*').eq('id', roomId).single() 
                        : Promise.resolve({ data: null, error: null })
                ]);

                if (profileRes.data) setProfile(profileRes.data);

                if (roomRes.data) {
                    const roomData = roomRes.data;
                    if (roomData.settings) setRoomSettings(roomData.settings);

                    // Sync questions
                    if (roomData.questions && Array.isArray(roomData.questions)) {
                        setQuestions(roomData.questions);
                    } else if (isBlitzmatch || isRanked) {
                        // If no questions in initial fetch, try a quick secondary fetch
                        console.warn("Retrying question fetch...");
                    }

                    // Sync opponent
                    const opp = roomData.participants?.find((p: Participant) => p.id !== user.id);
                    if (opp) setOpponent(opp);
                    
                    setIsLoadingQuestions(false);
                } else if (!isRanked && !isBlitzmatch) {
                    // For solo/testing
                    const r1 = await fetchQuestions(10, 'easy', user.id);
                    setQuestions(r1);
                    setIsLoadingQuestions(false);
                } else {
                     setIsLoadingQuestions(false);
                }
            } catch (error: unknown) {
                console.error("Error initializing game:", error);
                const message = error instanceof Error ? error.message : "Failed to load questions";
                setFetchError(message);
                setIsLoadingQuestions(false);
            }
        };
        getData();
    }, [roomId, isRanked, isBlitzmatch, navigate]);

    const leaveRoom = useCallback(async () => {
        if (!roomId) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await leaveRoomUtil(roomId, user.id);
        }
    }, [roomId]);

    const handleSurrender = useCallback(async () => {
        if (!userId) return;
        
        // 1. Broadcast surrender to opponent
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'player_surrendered',
                payload: { userId }
            });
        }

        if (surrenderProcessedRef.current) return;
        surrenderProcessedRef.current = true;

        // 2. Calculate final scores (opponent wins)
        const finalScores = {
            user: setScores.user,
            opponent: setScores.opponent + 1
        };

        // 3. Save game history IMMEDIATELY for both players
        const mode = isRanked ? 'Ranked' : (isBlitzmatch ? 'Blitz' : ((location as any).state?.isCustom ? 'Custom' : 'Normal'));
        const userRoundScores = roundScoresRecord.map(r => r.user);
        const opponentRoundScores = roundScoresRecord.map(r => r.opponent);
        
        // Pad scores
        let maxRounds = 3;
        if (isRanked) maxRounds = 5;
        else if (roomSettings?.format?.startsWith('Bo')) {
            maxRounds = parseInt(roomSettings.format.replace('Bo', '')) || 3;
        }
        
        while (userRoundScores.length < maxRounds) userRoundScores.push(0);
        while (opponentRoundScores.length < maxRounds) opponentRoundScores.push(0);

        try {
            // Save history for current user only (surrendered = lost)
            if (!historySavedRef.current) {
                historySavedRef.current = true;
                await supabase.from('game_history').insert({
                    user_id: userId,
                    opponent_id: opponent?.id,
                    room_id: roomId,
                    result: 'Thất bại',
                    score_user: finalScores.user,
                    score_opponent: finalScores.opponent,
                    mode: mode,
                    mmr_change: 0, // No MMR change on surrender
                    round_scores: userRoundScores
                });
            }
        } catch (err) {
            console.error("Failed to save surrender history:", err);
        }

        // 4. Update UI scores
        setSetScores(finalScores);

        // 5. Trigger Game Over sequence
        setIsMatchEnding(true);
        setTimeout(() => {
            setIsGameOver(true);
            setIsMatchEnding(false);
            setModalType(null);
        }, 2000);
    }, [userId, setScores, opponent, roomId, isRanked, isBlitzmatch, location, roundScoresRecord, roomSettings]);

    useEffect(() => {
        leaveRoomRef.current = leaveRoom;
    }, [leaveRoom]);

    // Keep refs in sync with state
    useEffect(() => {
        currIndexRef.current = currentQuestionIndex;
        isConfirmedRef.current = isConfirmed;
        winsNeededRef.current = winsNeeded;
        
        // Broadcast a "heartbeat" to let opponent know we are on this question
        if (channelRef.current && channelRef.current.state === 'joined') {
            channelRef.current.send({
                type: 'broadcast',
                event: 'q_sync',
                payload: { userId, qIndex: currentQuestionIndex }
            });
        }
    }, [currentQuestionIndex, userId, isConfirmed, winsNeeded]);

    // --- REALTIME ANSWER SYNC ---
    useEffect(() => {
        if (!roomId) return;

        let channel: RealtimeChannel | null = null;
        let retryTimeout: ReturnType<typeof setTimeout>;
        let isMounted = true;

        const cleanup = () => {
             if (channel) {
                console.log("Cleaning up Realtime channel...");
                supabase.removeChannel(channel);
                channel = null;
                channelRef.current = null;
            }
            if (retryTimeout) clearTimeout(retryTimeout);
        };

        const initializeChannel = async () => {
            if (!isMounted) return;
            
            // Clean up existing before creating new (just in case)
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isMounted) return;

            const channelId = `game_${roomId}`;
            channel = supabase.channel(channelId, {
                config: {
                    broadcast: { self: false },
                    presence: { key: user.id }
                }
            });
            channelRef.current = channel;

            channel
                .on('broadcast', { event: 'player_answer' }, ({ payload }: { payload: { userId: string; qIndex: number; isCorrect: boolean; points: number; currentScore?: number } }) => {
                    const { userId: senderId, qIndex, isCorrect, points, currentScore } = payload;
                    
                    if (senderId !== user.id) {
                        console.log(`Realtime: Received answer for Q${qIndex} from opponent. Score: ${currentScore}`);
                        bufferedOpponentAnswers.current.set(qIndex, { isCorrect, points, currentScore });
                        
                        if (qIndex === currIndexRef.current) {
                            setOpponentAnswered({ isCorrect, points });
                            // DELAY UPDATE: Score will be updated in the transition phase
                        }
                    }
                })
                .on('broadcast', { event: 'q_sync' }, ({ payload }: { payload: { userId: string; qIndex: number } }) => {
                    const { userId: senderId, qIndex } = payload;
                    if (senderId !== user.id) {
                        console.log(`Realtime: Opponent is at Q${qIndex}`);
                        
                        // CATCH-UP LOGIC: If opponent is ahead and we have already answered,
                        // it means we missed their answer broadcast. Treat it as received.
                        if (qIndex > currIndexRef.current && isConfirmedRef.current) {
                            console.warn("Sync: Opponent is ahead. Forcing catch-up.");
                            const buff = bufferedOpponentAnswers.current.get(currIndexRef.current);
                            if (buff) {
                                setOpponentAnswered(buff);
                            } else {
                                // If no buffer, just show as answered to unblock transition
                                setOpponentAnswered({ isCorrect: false, points: 0 });
                            }
                        }
                    }
                })
                .on('broadcast', { event: 'player_surrendered' }, async ({ payload }: { payload: { userId: string } }) => {
                    const { userId: surrenderingId } = payload;
                    if (surrenderingId !== user.id) {
                        if (surrenderProcessedRef.current) return;
                        surrenderProcessedRef.current = true;
                        
                        console.log("Realtime: Opponent surrendered! You win.");
                        
                        // Calculate final scores (current player wins)
                        const finalScores = {
                            user: setScores.user + 1,
                            opponent: setScores.opponent
                        };

                        // Save history IMMEDIATELY for winner
                        const mode = isRanked ? 'Ranked' : (isBlitzmatch ? 'Blitz' : ((location as any).state?.isCustom ? 'Custom' : 'Normal'));
                        const userRoundScores = roundScoresRecord.map(r => r.user);
                        
                        // Pad scores
                        let maxRounds = 3;
                        if (isRanked) maxRounds = 5;
                        else if (roomSettings?.format?.startsWith('Bo')) {
                            maxRounds = parseInt(roomSettings.format.replace('Bo', '')) || 3;
                        }
                        
                        while (userRoundScores.length < maxRounds) userRoundScores.push(0);

                        try {
                            if (!historySavedRef.current) {
                                historySavedRef.current = true;
                                await supabase.from('game_history').insert({
                                    user_id: user.id,
                                    opponent_id: opponent?.id,
                                    room_id: roomId,
                                    result: 'Chiến thắng',
                                    score_user: finalScores.user,
                                    score_opponent: finalScores.opponent,
                                    mode: mode,
                                    mmr_change: 0, // No MMR on opponent surrender
                                    round_scores: userRoundScores
                                });
                            }
                        } catch (err) {
                            console.error("Failed to save winner history on surrender:", err);
                        }

                        // Update UI scores
                        setSetScores(finalScores);

                        // Trigger Game Over sequence
                        setIsMatchEnding(true);
                        setTimeout(() => {
                            if (isMounted) {
                                setIsGameOver(true);
                                setIsMatchEnding(false);
                            }
                        }, 2000);
                    }
                })
                .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {

                     if (key !== user.id && !isGameOver && !surrenderProcessedRef.current) {
                        console.log("Opponent disconnected (Presence)! Auto-win.");
                         surrenderProcessedRef.current = true;
                         setSetScores(prev => ({
                            ...prev,
                            user: winsNeededRef.current 
                        }));
                        setIsMatchEnding(true);
                        setTimeout(() => {
                            if (isMounted) {
                                setIsGameOver(true);
                                setIsMatchEnding(false);
                            }
                        }, 2000);
                     }
                })
                .subscribe(async (status) => {
                    if (!isMounted) return;
                    
                    if (status === 'SUBSCRIBED') {
                        console.log("Realtime: WebSocket connected");
                        await channel?.track({
                             online_at: new Date().toISOString(),
                             user_id: user.id
                        });
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                         console.warn(`Realtime: Subscription ${status}. Attempting reconnect...`);
                         retryTimeout = setTimeout(initializeChannel, 3000);
                    }
                });
        };

        initializeChannel();

        return () => {
            isMounted = false;
            cleanup();
        };
    }, [roomId]);

    useEffect(() => {
        mountTimeRef.current = Date.now();
        const handleBeforeUnload = () => {
            if (!isNavigatingAway && leaveRoomRef.current) {
                leaveRoomRef.current();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        const mountTimeAtStart = mountTimeRef.current;

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            
            const duration = Date.now() - mountTimeAtStart;
            if (duration < 2000) return;

            if (!isNavigatingAway && leaveRoomRef.current) {
                leaveRoomRef.current();
            }
        };
    }, [isNavigatingAway]);

    const handleAnswerSelect = useCallback((index: number) => {
        if (isConfirmed || showTransition || isGameOver || !questions[currentQuestionIndex]) return;

        setIsConfirmed(true);
        setSelectedAnswer(index);

        const currentQ = questions[currentQuestionIndex];
        const uPoints = index === currentQ.correctAnswer ? 1 : 0;

        // Broadcast answer via persistent channel
        if (channelRef.current) {
            // Check if status is joined/subscribed to avoid REST fallback
            const status = channelRef.current.state;
            if (status === 'joined') {
                const newScore = userScore + uPoints;
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'player_answer',
                    payload: {
                        userId: userId,
                        qIndex: currentQuestionIndex,
                        isCorrect: index === currentQ.correctAnswer,
                        points: uPoints,
                        currentScore: newScore
                    }
                });
            } else {
                console.warn("Realtime: Channel not fully joined yet (status: " + status + "). Attempting send anyway...");
                const newScore = userScore + uPoints;
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'player_answer',
                    payload: {
                        userId: userId,
                        qIndex: currentQuestionIndex,
                        isCorrect: index === currentQ.correctAnswer,
                        points: uPoints,
                        currentScore: newScore
                    }
                });
            }
        }

        setRoundPoints((prev: { user: number; opponent: number }) => ({ ...prev, user: uPoints }));
    }, [isConfirmed, showTransition, isGameOver, questions, currentQuestionIndex, userId, userScore]);

    // --- SYNCHRONIZED TRANSITION LOGIC ---
    useEffect(() => {
        // Check if we have a buffered answer for the current question index
        const bufferedAnswer = bufferedOpponentAnswers.current.get(currentQuestionIndex);
        if (bufferedAnswer && opponentAnswered === null) {
            console.log(`Sync: Applying buffered answer for Q${currentQuestionIndex}`);
            setOpponentAnswered(bufferedAnswer);
            // Score update is deferred to transition block
        }

        // Condition: Both have answered OR (I have answered and timer is 0)
        const bothReady = isConfirmed && (opponentAnswered !== null || timeLeft === 0);
        
        if (bothReady && !showTransition && !showSetResults && !isGameOver && !isLoadingQuestions && questions.length > 0 && processedQuestionRef.current !== currentQuestionIndex) {
            
            // Start the timer ONLY if it hasn't started yet for THIS question
            if (!transitionTimerRef.current) {
                console.log("Both players ready. Starting transition timer for index:", currentQuestionIndex);
                
                transitionTimerRef.current = setTimeout(() => {
                    // Critical: Mark as processed INSIDE the timer
                    processedQuestionRef.current = currentQuestionIndex;
                    
                    // Final update of local scores before showing transition
                    const uPoints = selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 1 : 0;
                    
                    setUserScore(prev => prev + uPoints);
                    pointsRef.current.user += uPoints;
                    setRoundPointsHistory(prev => ({ ...prev, user: prev.user + uPoints }));
                    
                    // UPDATE OPPONENT SCORE (Delayed Reveal)
                    const buff = bufferedOpponentAnswers.current.get(currentQuestionIndex);
                    if (buff) {
                         if (buff.currentScore !== undefined) {
                            setOpponentScore(buff.currentScore);
                            pointsRef.current.opponent = buff.currentScore;
                            setRoundPointsHistory(prev => ({ ...prev, opponent: buff.currentScore! }));
                        } else {
                            setOpponentScore(prev => prev + buff.points);
                            pointsRef.current.opponent += buff.points;
                            setRoundPointsHistory(prev => ({ ...prev, opponent: prev.opponent + buff.points }));
                        }
                        setRoundPoints(prev => ({ ...prev, opponent: buff.points }));
                    }

                    setShowTransition(true);

                    // Hide transition and move next after 4 seconds
                    setTimeout(() => {
                        setShowTransition(false);

                        if (isEndOfRound) {
                            // SAVE ROUND SCORES TO HISTORY
                            const currentRoundScores = { ...pointsRef.current };
                            setRoundScoresRecord(prev => [...prev, currentRoundScores]);

                            const finalUserRoundPoints = pointsRef.current.user;
                            const finalOpponentRoundPoints = pointsRef.current.opponent;
                            const userWonSet = finalUserRoundPoints > finalOpponentRoundPoints;
                            const isRoundDraw = finalUserRoundPoints === finalOpponentRoundPoints;
                            
                            let newSetScores = { ...setScores };

                            if (!isRoundDraw) {
                                newSetScores = {
                                    user: userWonSet ? setScores.user + 1 : setScores.user,
                                    opponent: userWonSet ? setScores.opponent : setScores.opponent + 1
                                };
                                setSetScores(newSetScores);
                            }
                            
                            setShowSetResults(true);
                            const hasWinner = newSetScores.user >= winsNeeded || newSetScores.opponent >= winsNeeded;

                            setTimeout(() => {
                                setShowSetResults(false);
                                pointsRef.current = { user: 0, opponent: 0 };
                                setRoundPointsHistory({ user: 0, opponent: 0 });
                                setUserScore(0);
                                setOpponentScore(0);

                                if (!hasWinner && currentRound < maxRounds) {
                                    setCurrentQuestionIndex(prev => prev + 1);
                                    setOpponentAnswered(null);
                                    setShowRoundIntro(true);
                                    setTimeout(() => setShowRoundIntro(false), 2000);
                                    setTimeLeft(QUESTION_TIME);
                                    setIsConfirmed(false);
                                    setSelectedAnswer(null);
                                } else {
                                    setIsMatchEnding(true);
                                    setTimeout(() => {
                                        setIsGameOver(true);
                                        setIsMatchEnding(false);
                                    }, 2000);
                                }
                            }, 4000);
                        } else {
                            // Standard Next Question
                            setCurrentQuestionIndex(prev => prev + 1);
                            setOpponentAnswered(null);
                            setTimeLeft(QUESTION_TIME);
                            setIsConfirmed(false);
                            setSelectedAnswer(null);
                        }
                        
                        // Reset timer ref so next question can start its own timer
                        transitionTimerRef.current = null;
                    }, 4000);
                }, 1000);
            }
        }

        return () => {
             // Logic intentionally kept outside status effects to prevent interruption
        };
    }, [isConfirmed, opponentAnswered, timeLeft, showTransition, isGameOver, isLoadingQuestions, questions, currentQuestionIndex, isEndOfRound, setScores, winsNeeded, currentRound, maxRounds, QUESTION_TIME, selectedAnswer, showSetResults]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;
        if (gameStage === 'preparing') {
            // Only start counting down once everything is loaded
            if (isLoadingQuestions) return;

            timer = setInterval(() => {
                setIntroTimer(prev => {
                    if (prev <= 1) {
                        setGameStage('starting');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (gameStage === 'starting') {
            // Snappier transition to playing state
            timer = setTimeout(() => {
                setGameStage('playing');
                setShowRoundIntro(true);
                setTimeout(() => setShowRoundIntro(false), 2000);
            }, 500);
        }
        return () => {
            if (timer) {
                if (gameStage === 'preparing') clearInterval(timer as any);
                else clearTimeout(timer as any);
            }
        };
    }, [gameStage, isLoadingQuestions]);

    useEffect(() => {
        // TIMER DECOUPLING: Timer keeps ticking even after confirmation
        // This ensures the round ALWAYS ends when time is up, regardless of sync status.
        if (timeLeft > 0 && gameStage === 'playing' && !showTransition && !isGameOver) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && gameStage === 'playing' && !showTransition && !isGameOver) {
            // Timeout reached
            if (!isConfirmed) {
                // Defer to avoid cascading render lint error
                const timeoutId = setTimeout(() => {
                     handleAnswerSelect(-1);
                }, 0);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [timeLeft, gameStage, showTransition, isGameOver, isConfirmed, handleAnswerSelect]);

    // Cleanup buffered answers on unmount
    useEffect(() => {
        const answersRef = bufferedOpponentAnswers.current;
        return () => {
            answersRef.clear();
        };
    }, []);


    if (fetchError || (!isLoadingQuestions && questions.length === 0)) {
        return (
            <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center gap-6 p-4">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center max-w-md">
                    <HelpCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Không thể tải câu hỏi</h2>
                    <p className="text-gray-400 text-sm mb-6">{fetchError || "Đã xảy ra lỗi không xác định khi tải dữ liệu trận đấu."}</p>
                    <button 
                        onClick={() => navigate('/dashboard/arena')}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider rounded-2xl transition-all"
                    >
                        Quay lại Arena
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col animate-fade-in relative overflow-y-auto">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 blur-[120px] pointer-events-none"></div>

            {/* Top Bar - Combined */}
            <div className="flex justify-between items-center mb-12 relative z-10 bg-neutral-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-[30px]">
                {/* Me */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px] shadow-lg shadow-blue-500/20">
                            <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} className="w-full h-full rounded-full object-cover border-4 border-black" alt="Me" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center">
                            <Shield size={8} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-wide mb-1">{profile?.display_name || "BẠN"}</div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Trophy className="text-blue-400" size={12} />
                                <span className="text-xs font-black text-white">{setScores.user} ( hiệp ) / {userScore} ( điểm )</span>
                            </div>
                            <div className="flex gap-1">
                                {Array.from({ length: winsNeeded }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 w-6 rounded-full transition-all duration-500 skew-x-[-20deg] ${i < setScores.user ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Timer & Round */}
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                         <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Hiệp {currentRound} - Câu {questionNumberInRound}/{questionsPerRound}</div>
                         <div className="text-2xl font-black italic text-white/10 tracking-tighter">VS</div>
                    </div>

                    <div className="relative group">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                <circle 
                                    cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" 
                                    strokeDasharray={176}
                                    strokeDashoffset={176 - (176 * timeLeft) / QUESTION_TIME}
                                    className={`transition-all duration-1000 ${timeLeft < 5 ? 'text-red-500' : 'text-fuchsia-500'}`}
                                />
                            </svg>
                            <div className={`absolute text-xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {timeLeft}
                            </div>
                        </div>
                        
                        {(isConfirmed || opponentAnswered) && (
                             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-2 bg-neutral-900 border border-white/5 px-3 py-1 rounded-full animate-bounce">
                                 <Loader2 size={10} className="animate-spin text-blue-500" />
                                 <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                     {isConfirmed && opponentAnswered ? 'Cả hai đã trả lời!' : isConfirmed ? 'Đang chờ đối thủ...' : 'Đối thủ đã trả lời!'}
                                 </span>
                             </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setModalType('surrender')}
                            className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group"
                        >
                            <Flag size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                            onClick={() => setModalType('exit')}
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors group"
                        >
                            <LogOut size={16} className="text-red-400" />
                        </button>
                    </div>
                </div>

                {/* Opponent */}
                <div className="flex items-center gap-4 text-right">
                    <div>
                        <div className="font-bold text-sm tracking-wide mb-1 text-gray-400">
                            {opponent?.display_name || "ĐỐI THỦ"}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center justify-end gap-2 text-right">
                                <Zap className="text-red-400" size={12} />
                                <span className="text-xs font-black text-white">{setScores.opponent} ( hiệp ) / {opponentScore} ( điểm )</span>
                            </div>
                            <div className="flex gap-1">
                                {Array.from({ length: winsNeeded }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 w-6 rounded-full transition-all duration-500 skew-x-[-20deg] ${i < setScores.opponent ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-500 to-orange-600 p-[2px] shadow-lg shadow-red-500/20 opacity-80">
                            <img 
                                src={opponent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.id || 'opponent'}`} 
                                className="w-full h-full rounded-full object-cover border-4 border-black" 
                                alt="Opponent" 
                            />
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                            <Zap size={8} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Quiz Area */}
            <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col justify-center gap-6 md:gap-10 relative z-10 pb-12">
                
                {/* Question Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-6 md:p-12 text-center shadow-2xl relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            Câu 0{currentQuestionIndex + 1}
                        </div>
                        <h2 className="text-xl md:text-3xl font-bold leading-tight text-white mb-2">
                            {question?.text || "..."}
                        </h2>
                    </div>
                </div>

                {/* Answers Grid */}
                {gameStage === 'playing' && question ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-bottom-10 duration-700">
                        {question.options.map((option: string, index: number) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={isConfirmed}
                                className={`
                                    group relative p-4 md:p-6 rounded-[25px] border-2 transition-all duration-300 text-left h-full
                                    ${selectedAnswer === index 
                                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                                        : 'bg-neutral-900/40 border-white/5 hover:border-white/20 hover:bg-white/5'}
                                    ${isConfirmed && selectedAnswer === index ? (index === question.correctAnswer ? 'bg-green-600/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-red-600/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]') : ''}
                                `}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition-colors
                                        ${selectedAnswer === index ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-500 group-hover:bg-white/20'}
                                        ${isConfirmed && selectedAnswer === index ? (index === question.correctAnswer ? 'bg-green-500' : 'bg-red-500') : ''}
                                    `}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <span className={`text-xl font-bold ${selectedAnswer === index ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                        {option}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="h-[200px]"></div>
                )}

                {/* Action Button - Removed for instant selection */}
            </div>

            {/* Floating Help Circle Decoration */}
            <div className="absolute overflow-hidden pointer-events-none inset-0">
                <HelpCircle size={300} className="absolute -bottom-20 -left-20 text-white/5 rotate-12" strokeWidth={0.5} />
                <Zap size={250} className="absolute top-0 -right-20 text-white/5 rotate-[-20deg]" strokeWidth={0.5} />
            </div>

            {/* Confirmation Modal */}
            {modalType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    {/* Overlay */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setModalType(null)}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className={`relative bg-neutral-900 border ${modalType === 'exit' ? 'border-red-500/20' : 'border-purple-500/20'} rounded-[32px] p-8 md:p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300`}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-3xl ${modalType === 'exit' ? 'bg-red-500/10 border-red-500/20' : 'bg-purple-500/10 border-purple-500/20'} flex items-center justify-center mb-6 border`}>
                                {modalType === 'exit' ? <LogOut size={40} className="text-red-500" /> : <Flag size={40} className="text-purple-500" />}
                            </div>
                            
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
                                {modalType === 'exit' ? 'Rời khỏi trận đấu?' : 'Xác nhận đầu hàng?'}
                            </h3>
                            
                            <div className={`${modalType === 'exit' ? 'bg-red-500/5 border-red-500/10' : 'bg-purple-500/5 border-purple-500/10'} border rounded-2xl p-4 mb-8 text-center w-full`}>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {modalType === 'exit' 
                                        ? 'Bạn có chắc chắn muốn rời khỏi trận đấu này không? Nếu thoát bây giờ, hệ thống sẽ tính '
                                        : 'Bạn có chắc chắn muốn đầu hàng không? Nếu đầu hàng ngay bây giờ, hệ thống sẽ tính '}
                                    <span className={`${modalType === 'exit' ? 'text-red-500' : 'text-purple-500'} font-bold underline underline-offset-4 decoration-2`}>1 trận thua</span> cho bạn.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button 
                                    onClick={() => setModalType(null)}
                                    className="px-6 py-4 rounded-2xl bg-neutral-800 border border-white/5 text-gray-400 font-bold hover:bg-neutral-700 transition-colors"
                                >
                                    Tiếp tục đấu
                                </button>
                                <button 
                                    onClick={handleSurrender}
                                    className={`px-6 py-4 rounded-2xl ${modalType === 'exit' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'} text-white font-black uppercase tracking-wider shadow-lg transition-all active:scale-95`}
                                >
                                    {modalType === 'exit' ? 'Thoát' : 'Đầu hàng'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Match Intro Overlay */}
            {(gameStage === 'preparing' || gameStage === 'starting') && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 px-4 md:px-0">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    </div>

                    <div className="relative w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0">
                        {/* Player 1 */}
                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-left-20 duration-1000">
                            <div className="relative">
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[40px] bg-gradient-to-tr from-blue-500 to-purple-600 p-[3px] shadow-[0_0_50px_rgba(59,130,246,0.3)] rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[37px] bg-black p-1">
                                        <img 
                                            src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
                                            className="w-full h-full rounded-[34px] object-cover" 
                                            alt="Me" 
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-blue-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg italic">BẠN</div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{profile?.display_name || "BẠN"}</h2>
                                 <div className="flex justify-center gap-2 mt-2">
                                     <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-blue-400 border border-blue-500/20">Điểm: {userScore}</div>
                                </div>
                            </div>
                        </div>

                        {/* Center VS / Countdown */}
                        <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64">
                            {/* Dynamic Mode-Aware Background Glow */}
                            <div className={`absolute inset-0 blur-[100px] rounded-full opacity-30 animate-pulse ${
                                isRanked ? 'bg-fuchsia-600' : isBlitzmatch ? 'bg-red-600' : 'bg-blue-600'
                            }`}></div>

                            {gameStage === 'preparing' ? (
                                <div className="relative flex items-center justify-center w-full h-full">
                                    {/* Large VS Background */}
                                    <div className="absolute text-8xl md:text-[10rem] font-black italic text-white/5 tracking-tighter select-none">
                                        VS
                                    </div>
                                    
                                    {/* Progress Ring */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                        <circle 
                                            cx="50%" cy="50%" r="45%" 
                                            className="stroke-white/5 fill-none" 
                                            strokeWidth="2" 
                                        />
                                        <circle 
                                            cx="50%" cy="50%" r="45%" 
                                            className={`fill-none transition-all duration-1000 ease-linear ${
                                                isRanked ? 'stroke-fuchsia-500' : isBlitzmatch ? 'stroke-red-500' : 'stroke-blue-500'
                                            }`} 
                                            strokeWidth="6" 
                                            strokeDasharray="100 100"
                                            strokeDashoffset={100 - (100 * introTimer / 5)}
                                            pathLength="100"
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    {/* Counting Number */}
                                    <div key={introTimer} className="relative z-10 text-7xl md:text-9xl font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-in zoom-in-150 fade-in duration-300 italic">
                                        {introTimer}
                                    </div>

                                    {/* Outer Scanning Ornament */}
                                    <div className={`absolute inset-[-20px] border-t-2 border-r-2 rounded-full opacity-20 animate-[spin_6s_linear_infinite] ${
                                        isRanked ? 'border-fuchsia-400' : isBlitzmatch ? 'border-red-400' : 'border-blue-400'
                                    }`}></div>
                                </div>
                            ) : (
                                <div className="relative flex flex-col items-center animate-in zoom-in-150 duration-700">
                                    <div className={`text-6xl md:text-8xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b ${
                                        isRanked ? 'from-fuchsia-400 to-fuchsia-700' : isBlitzmatch ? 'from-red-400 to-red-700' : 'from-blue-400 to-blue-700 text-center'
                                    } drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]`}>
                                        Bắt đầu!
                                    </div>
                                    <div className="absolute -inset-10 bg-white/10 blur-3xl -z-10 rounded-full animate-ping"></div>
                                </div>
                            )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-right-20 duration-1000">
                            <div className="relative">
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[40px] bg-gradient-to-tr from-red-500 to-orange-600 p-[3px] shadow-[0_0_50px_rgba(239,68,68,0.3)] -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[37px] bg-black p-1">
                                        <img 
                                            src={opponent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.id || 'opponent'}`} 
                                            className="w-full h-full rounded-[34px] object-cover" 
                                            alt={opponent?.display_name || "ĐỐI THỦ"} 
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-red-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg italic">ĐỐI THỦ</div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{opponent?.display_name || "ĐỐI THỦ"}</h2>
                                 <div className="flex justify-center gap-2 mt-2">
                                     <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-red-400 border border-red-500/20">Điểm: {opponentScore}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 flex flex-col items-center gap-4">
                        <div className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex items-center gap-3">
                            <p className="text-xl md:text-2xl font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">
                                {gameStage === 'preparing' ? 'Chuẩn bị trận đấu' : 'Trận đấu đang diễn ra'}
                            </p>
                            {isLoadingQuestions && (
                                <Loader2 size={20} className="animate-spin text-blue-500" />
                            )}
                        </div>
                        <div className="flex gap-2">
                             {[1,2,3].map(i => (
                                 <div key={i} className={`w-2 h-2 rounded-full ${gameStage === 'preparing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500 animate-bounce'} `} style={{ animationDelay: `${i * 0.2}s` }}></div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Round Transition Overlay */}
            {showTransition && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/90 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
                    {/* Background Text - Dead Centered */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                        <div className="text-7xl md:text-[12rem] font-black italic text-white/[0.03] animate-pulse text-center leading-[0.8]">
                            {isEndOfRound ? (
                                <div className="flex flex-col items-center">
                                    <span>HIỆP {currentRound}</span>
                                    <span className="text-4xl md:text-6xl mt-6 opacity-30 tracking-[0.3em]">HOÀN THÀNH</span>
                                </div>
                            ) : (
                                'CÂU TIẾP THEO'
                            )}
                        </div>
                    </div>

                    <div className="relative w-full max-w-5xl flex items-center justify-between px-8 md:px-20 z-10">
                        {/* Player 1 Change */}
                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-left-20 duration-700">
                             <div className="relative">
                                 <div className={`w-36 h-36 md:w-56 md:h-56 rounded-full border-4 ${roundPoints.user > 0 ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]'} p-1.5 bg-black`}>
                                      <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} className="w-full h-full rounded-full object-cover" alt="Me" />
                                 </div>
                                 <div className={`absolute -top-12 left-1/2 -translate-x-1/2 text-5xl font-black ${roundPoints.user > 0 ? 'text-green-500' : 'text-red-500'} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-bounce`}>
                                     {roundPoints.user > 0 ? `+${roundPoints.user}` : roundPoints.user}
                                 </div>
                             </div>
                             <div className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{profile?.display_name || "BẠN"}</div>
                        </div>

                        {/* Center Spacer for Continue Button */}
                        <div className="flex flex-col items-center justify-center min-w-[100px] md:min-w-[200px]">
                            {isEndOfRound && currentRound < maxRounds && (
                                <div className="px-8 py-3 rounded-full bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-black tracking-widest uppercase animate-bounce shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    Tiếp tục Round {currentRound + 1}
                                </div>
                            )}
                        </div>

                        {/* Player 2 Change */}
                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-right-20 duration-700">
                             <div className="relative">
                                  <div className={`w-36 h-36 md:w-56 md:h-56 rounded-full border-4 ${roundPoints.opponent > 0 ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]'} p-1.5 bg-black`}>
                                       <img src={opponent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.id || 'opponent'}`} className="w-full h-full rounded-full object-cover" alt={opponent?.display_name || "ĐỐI THỦ"} />
                                  </div>
                                 <div className={`absolute -top-12 left-1/2 -translate-x-1/2 text-5xl font-black ${roundPoints.opponent > 0 ? 'text-green-500' : 'text-red-500'} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-bounce`}>
                                     {roundPoints.opponent > 0 ? `+${roundPoints.opponent}` : roundPoints.opponent}
                                 </div>
                             </div>
                             <div className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{opponent?.display_name || "ĐỐI THỦ"}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over / Results Overlay */}
            {isGameOver && (
                <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-neutral-950 px-4">
                    <div className={`absolute inset-0 ${setScores.user > setScores.opponent ? 'bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]' : setScores.user < setScores.opponent ? 'bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)]' : 'bg-transparent'} animate-pulse`}></div>
                    
                    <div className="relative mb-8 text-center animate-in zoom-in-50 duration-700">
                        <Trophy size={80} className={`${setScores.user > setScores.opponent ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]' : setScores.user < setScores.opponent ? 'text-gray-400 drop-shadow-none' : 'text-gray-600'} mx-auto mb-4`} />
                        <h1 className={`text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none ${
                            setScores.user > setScores.opponent ? 'text-blue-500' : 
                            setScores.user < setScores.opponent ? 'text-red-500' : 'text-white'
                        }`}>
                            {setScores.user > setScores.opponent ? 'CHIẾN THẮNG' : setScores.user === setScores.opponent ? 'HÒA' : 'THẤT BẠI'}
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest mt-4 italic text-sm">Trận đấu đã kết thúc</p>
                    </div>

                    <div className="relative grid grid-cols-2 gap-4 md:gap-8 w-full max-w-5xl mb-12">
                         {/* My Score Card */}
                         <div className={`relative p-6 md:p-10 rounded-[35px] md:rounded-[45px] border-2 ${setScores.user >= setScores.opponent ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5'} backdrop-blur-xl overflow-hidden animate-in slide-in-from-left-20 duration-1000`}>
                             {/* Set Score Indicator (Right Inner) */}
                             <div className="absolute top-1/2 -right-4 mx-8 -translate-y-1/2 text-[100px] md:text-[180px] font-black text-blue-500/10 italic leading-none select-none pointer-events-none">
                                 {setScores.user}
                             </div>

                             <div className="relative z-10 flex flex-col items-center">
                                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-[25px] md:rounded-[30px] overflow-hidden border-2 border-white/10 mb-4 shadow-2xl">
                                     <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} className="w-full h-full object-cover" alt="Me" />
                                 </div>
                                 <div className="text-gray-400 font-black uppercase text-[8px] md:text-[10px] tracking-[0.4em] mb-2 text-center">Điểm của bạn</div>
                                 <div className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">{userScore}</div>
                                 <div className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${userScore >= 10 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-100'}`}>
                                     Điểm chi tiết: {roundScoresRecord.map(r => r.user).join('/')}
                                 </div>
                                 <div className="mt-1 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                     Hiệu suất: {(roundScoresRecord.reduce((a, b) => a + b.user, 0) / (roundScoresRecord.length || 1)).toFixed(1)}
                                 </div>
                             </div>
                         </div>

                         {/* Opponent Score Card */}
                         <div className={`relative p-6 md:p-10 rounded-[35px] md:rounded-[45px] border-2 ${setScores.opponent > setScores.user ? 'bg-red-600/10 border-red-500/30' : 'bg-white/5 border-white/5'} backdrop-blur-xl overflow-hidden animate-in slide-in-from-right-20 duration-1000`}>
                             {/* Set Score Indicator (Left Inner) */}
                             <div className="absolute top-1/2 -left-4 mx-8 -translate-y-1/2 text-[100px] md:text-[180px] font-black text-red-500/10 italic leading-none select-none pointer-events-none">
                                 {setScores.opponent}
                             </div>

                             <div className="relative z-10 flex flex-col items-center">
                                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-[25px] md:rounded-[30px] overflow-hidden border-2 border-white/10 mb-4 shadow-2xl">
                                     <img src={opponent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.id || 'opponent'}`} className="w-full h-full object-cover" alt={opponent?.display_name || "ĐỐI THỦ"} />
                                 </div>
                                 <div className="text-gray-400 font-black uppercase text-[8px] md:text-[10px] tracking-[0.4em] mb-2 text-center">Điểm đối thủ</div>
                                 <div className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">{opponentScore}</div>
                                 <div className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${opponentScore >= 10 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-100'}`}>
                                     Điểm chi tiết: {roundScoresRecord.map(r => r.opponent).join('/')}
                                 </div>
                                 <div className="mt-1 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                     Hiệu suất: {(roundScoresRecord.reduce((a, b) => a + b.opponent, 0) / (roundScoresRecord.length || 1)).toFixed(1)}
                                 </div>
                             </div>
                         </div>
                    </div>

                    {isRanked && showMMRSummary ? (
                        <div className="absolute inset-0 z-[120] bg-neutral-950 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                             {/* Background Glows */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                             <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                             <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

                             <MMRSummaryOverlay 
                                mmr={userNewMMR} 
                                change={mmrChange} 
                                avatarUrl={profile?.avatar_url || undefined}
                                onDone={async () => {
                                    setIsNavigatingAway(true);
                                    await leaveRoom();
                                    navigate('/dashboard/arena');
                                }}
                             />
                        </div>
                    ) : (
                        <button 
                            onClick={async () => {
                                // SAVE GAME HISTORY
                                const isWin = setScores.user > setScores.opponent;
                                const isDraw = setScores.user === setScores.opponent;
                                const result = isWin ? 'Chiến thắng' : (isDraw ? 'Hòa' : 'Thất bại');

                                // Determine Mode
                                let mode = 'Normal';
                                if (isRanked) mode = 'Ranked';
                                else if (isBlitzmatch) mode = 'Blitz';
                                // Assuming Custom matches might set a specific flag or we default to Normal if unranked & not blitz
                                // If you have an isCustom flag, use it here. For now:
                                else if ((location as any).state?.isCustom) mode = 'Custom';

                                // Prepare Round Scores (User's scores per round) - PAD WITH 0s
                                const userRoundScores = roundScoresRecord.map(r => r.user);
                                
                                // Calculate max rounds based on format
                                let maxRounds = 3; // Default Bo3
                                if (isRanked) maxRounds = 5; // Ranked is Bo5
                                else if (roomSettings?.format?.startsWith('Bo')) {
                                    maxRounds = parseInt(roomSettings.format.replace('Bo', '')) || 3;
                                }

                                // Pad with 0s for unplayed rounds
                                while (userRoundScores.length < maxRounds) {
                                    userRoundScores.push(0);
                                }
                                
                                try {
                                    // Save history for CURRENT USER only (if not already saved)
                                    if (!historySavedRef.current) {
                                        historySavedRef.current = true;
                                        await supabase.from('game_history').insert({
                                            user_id: userId,
                                            opponent_id: opponent?.id,
                                            room_id: roomId,
                                            result: result,
                                            score_user: setScores.user,
                                            score_opponent: setScores.opponent,
                                            mode: mode,
                                            mmr_change: isRanked ? (mmrChange || 0) : 0,
                                            round_scores: userRoundScores
                                        });
                                    }
                                } catch (err) {
                                    console.error("Failed to save game history:", err);
                                }

                                if (isRanked) {
                                    // 1. Calculate & Save MMR if not already done
                                    if (userId && profile) {
                                        if (!isDraw) {
                                            const currentMMR = profile.mmr ?? null;
                                            const calculatedNewMMR = calculateMMRChange(currentMMR, isWin);
                                            const change = calculatedNewMMR - (currentMMR || 0);
                                            
                                            setMmrChange(change);
                                            setUserNewMMR(calculatedNewMMR);

                                            await supabase
                                                .from('profiles')
                                                .update({ mmr: calculatedNewMMR })
                                                .eq('id', userId);
                                        } else {
                                            setMmrChange(0);
                                            setUserNewMMR(profile.mmr ?? 0);
                                        }
                                    }
                                    // 2. Show Summary Screen
                                    setShowMMRSummary(true);
                                    return;
                                }

                                setIsNavigatingAway(true);
                                await leaveRoom();
                                navigate('/dashboard/arena');
                            }}
                            className="relative px-12 py-5 rounded-[25px] bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)] z-[75]"
                        >
                            {isRanked ? 'Tiếp theo' : 'Quay lại Arena'}
                        </button>
                    )}
                </div>
            )}
            {/* Round Intro Overlay (Black Screen) */}
            {showRoundIntro && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-700">
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
                         <div className="w-20 h-1 bg-white/20 rounded-full mb-4"></div>
                         <h1 className="text-6xl md:text-9xl font-black text-white tracking-[0.2em] italic">HIỆP {currentRound}</h1>
                         <div className="w-20 h-1 bg-white/20 rounded-full mt-4"></div>
                    </div>
                </div>
            )}

            {/* Set Result (Face-off Style) Overlay */}
            {showSetResults && (
                <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-neutral-950 px-4 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-red-600/10"></div>
                    
                    <div className="relative mb-8 text-center">
                        <h2 className="text-3xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 animate-in slide-in-from-top-10 duration-700">HIỆP {currentRound} KẾT THÚC</h2>
                        <div className="inline-flex flex-col items-center gap-2">
                            <div className="px-10 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-1 block">Tỉ số trận đấu</span>
                                <div className="text-4xl md:text-6xl font-black text-white tracking-widest">
                                    <span className="text-blue-500">{setScores.user}</span>
                                    <span className="mx-4 text-white/20">-</span>
                                    <span className="text-red-500">{setScores.opponent}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full max-w-5xl grid grid-cols-2 items-center gap-4 md:gap-12 px-2 md:px-0">
                        <div className="flex flex-col items-center gap-4 md:gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 md:w-56 md:h-56 rounded-[30px] md:rounded-[40px] border-4 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] p-1 animate-in slide-in-from-left-20 duration-1000 rotate-[-4deg]">
                                    <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} className="w-full h-full rounded-[24px] md:rounded-[34px] object-cover" alt="Me" />
                                </div>
                                <div className="absolute -top-3 -right-3 px-3 py-1 bg-blue-600 rounded-lg text-[10px] md:text-sm font-black italic shadow-xl">+{roundPointsHistory.user}</div>
                            </div>
                            <div className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter text-center">{profile?.display_name || "BẠN"}</div>
                        </div>

                        <div className="flex flex-col items-center gap-4 md:gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 md:w-56 md:h-56 rounded-[30px] md:rounded-[40px] border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] p-1 animate-in slide-in-from-right-20 duration-1000 rotate-[4deg]">
                                    <img src={opponent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.id || 'opponent'}`} className="w-full h-full rounded-[24px] md:rounded-[34px] object-cover" alt={opponent?.display_name || "ĐỐI THỦ"} />
                                </div>
                                <div className="absolute -top-3 -left-3 px-3 py-1 bg-red-600 rounded-lg text-[10px] md:text-sm font-black italic shadow-xl">+{roundPointsHistory.opponent}</div>
                            </div>
                            <div className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter text-center">{opponent?.display_name || "ĐỐI THỦ"}</div>
                        </div>
                        
                        {/* Overlay VS Text absolute centered */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl md:text-8xl font-black italic text-white/5 tracking-tighter select-none pointer-events-none">VS</div>
                    </div>
                </div>
            )}

            {/* Match End Overlay (Black Screen) */}
            {isMatchEnding && (
                <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center animate-in fade-in duration-700">
                    <div className="text-center animate-in zoom-in-150 duration-700">
                         <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-widest italic leading-none">TRẬN ĐẤU<br/>KẾT THÚC</h1>
                         <div className="mt-8 flex justify-center gap-1">
                             <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce delay-0"></div>
                             <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce delay-150"></div>
                             <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce delay-300"></div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MMRSummaryOverlay = ({ mmr, change, onDone, avatarUrl }: { mmr: number | null, change: number, onDone: () => void, avatarUrl?: string }) => {
    const rank = getRankFromMMR(mmr);
    
    return (
        <div className="relative flex flex-col items-center text-center max-w-4xl w-full px-4 z-10 animate-in fade-in slide-in-from-bottom-10 duration-700 h-full max-h-screen overflow-y-auto py-8 no-scrollbar">
            <h2 className="text-[10px] md:text-sm font-black text-gray-500 uppercase tracking-[0.5em] mb-6 shrink-0">Chi tiết hạng</h2>
            
            <div className="flex flex-col items-center justify-center w-full mb-6 shrink-0">
                {/* Rank Circle Column */}
                <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                        <RankBadge mmr={mmr} size="xl" />
                        
                        {change !== 0 && (
                            <div className={`absolute top-0 -right-2 px-3 py-1.5 rounded-xl font-black text-base shadow-2xl border-2 animate-in slide-in-from-left-4 duration-500 delay-700 fill-mode-both flex items-center gap-1 ${
                                change > 0 ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
                            }`}>
                                {change > 0 ? `+${change}` : change}
                            </div>
                        )}
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-2 italic drop-shadow-2xl">
                        {rank.tier} {rank.division}
                    </h3>
                    
                    <div className="bg-red-500/10 border-2 border-red-500/30 px-5 py-1.5 rounded-xl animate-in zoom-in-75 duration-500 delay-300 fill-mode-both">
                        <span className="text-xl font-black text-white italic tracking-tighter">
                            {mmr} <span className="text-[10px] opacity-40 font-black uppercase tracking-widest text-gray-400 ml-1">MMR</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Progress Bar and Avatar Button in a row */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-4xl bg-white/5 border border-white/10 rounded-[30px] p-6 backdrop-blur-md shrink-0 mb-4">
                {/* Progress Bar Side */}
                <div className="flex-1 w-full space-y-3">
                    <div className="flex justify-between items-center text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                        <span className="text-blue-400">Tiến trình thăng hạng</span>
                        <span className="text-white/40">{rank.nextMMR && (rank.nextMMR - (mmr || 0))} MMR CÒN LẠI</span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-[2px]">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-[2s] delay-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                            style={{ width: `${rank.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest text-left opacity-60">Tiếp tục hành trình để đạt mốc rank cao hơn</p>
                </div>

                {/* Vertical Divider for desktop */}
                <div className="hidden md:block w-px h-20 bg-white/10"></div>

                {/* Avatar Exit Button - Reduced size to match lower profile */}
                <div className="flex flex-col items-center gap-3">
                    <button 
                        onClick={onDone}
                        className="group relative w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-full p-1.5 bg-neutral-950 border-4 border-white/10 hover:border-fuchsia-500 transition-all duration-500 active:scale-95 shadow-2xl"
                    >
                        <div className="w-full h-full rounded-full overflow-hidden relative border border-white/5">
                            <img 
                                src={avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                alt="Exit" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                <LogOut size={20} className="text-white mb-1" />
                                <div className="text-[10px] font-black text-white uppercase tracking-[0.1em]">QUAY LẠI</div>
                            </div>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-fuchsia-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </button>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Bấm Avatar để tiếp tục</p>
                </div>
            </div>
        </div>
    );
};

export default GamePlayView;
