import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, HelpCircle, Zap, Shield, MessageSquare, LogOut, Loader2, Flag, CheckCircle2, XCircle, Timer, Swords } from 'lucide-react';

import { supabase } from '../../lib/supabase';

const QUESTIONS = [
    {
        text: "Trong lập trình React, Hooks nào được sử dụng để quản lý Side effects?",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correctAnswer: 1
    },
    {
        text: "Thuộc tính nào dùng để căn giữa các item theo trục dọc trong Flexbox?",
        options: ["justify-content", "align-items", "flex-direction", "display"],
        correctAnswer: 1
    },
    {
        text: "Phương thức nào dùng để thêm phần tử vào cuối mảng trong JavaScript?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: 0
    },
    {
        text: "Tại sao nên sử dụng 'key' khi render list trong React?",
        options: ["Để làm đẹp code", "Để React định danh và tối ưu re-render", "Bắt buộc phải có", "Để truyền data"],
        correctAnswer: 1
    },
    {
        text: "Framework nào không phải là một thư viện/framework UI của JavaScript?",
        options: ["React", "Vue", "Django", "Angular"],
        correctAnswer: 2
    }
];

const GamePlayView = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [modalType, setModalType] = useState<'exit' | 'surrender' | null>(null);
    const [gameStage, setGameStage] = useState<'preparing' | 'starting' | 'playing'>('preparing');
    const [introTimer, setIntroTimer] = useState(5);

    // New Quiz States
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userScore, setUserScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [showTransition, setShowTransition] = useState(false);
    const [roundPoints, setRoundPoints] = useState({ user: 0, opponent: 0 });
    const [isGameOver, setIsGameOver] = useState(false);

    const question = QUESTIONS[currentQuestionIndex];

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            }
        };
        getData();
    }, []);

    const handleAnswerSelect = useCallback((index: number) => {
        if (isConfirmed || showTransition || isGameOver) return;

        setIsConfirmed(true);
        setSelectedAnswer(index);

        // Calculate Scores
        const uPoints = index === question.correctAnswer ? 1 : -1;
        // Mock opponent: 70% chance correct
        const oIsCorrect = Math.random() < 0.7;
        const oPoints = oIsCorrect ? 1 : -1;

        setRoundPoints({ user: uPoints, opponent: oPoints });

        // Update total scores after a delay
        setTimeout(() => {
            setUserScore(prev => prev + uPoints);
            setOpponentScore(prev => prev + oPoints);
            setShowTransition(true);

            // Hide transition and move next after 3 seconds
            setTimeout(() => {
                setShowTransition(false);
                if (currentQuestionIndex < QUESTIONS.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setTimeLeft(30);
                    setIsConfirmed(false);
                    setSelectedAnswer(null);
                } else {
                    setIsGameOver(true);
                }
            }, 3500);
        }, 2000);
    }, [isConfirmed, showTransition, isGameOver, question.correctAnswer, currentQuestionIndex]);

    useEffect(() => {
        let timer: any;
        if (gameStage === 'preparing') {
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
            timer = setTimeout(() => {
                setGameStage('playing');
            }, 1500);
        }
        return () => clearInterval(timer);
    }, [gameStage]);

    useEffect(() => {
        if (timeLeft > 0 && !isConfirmed && gameStage === 'playing' && !showTransition && !isGameOver) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !isConfirmed && gameStage === 'playing' && !showTransition) {
            // Timeout logic
            handleAnswerSelect(-1); // -1 signifies timeout
        }
    }, [timeLeft, isConfirmed, gameStage, showTransition, isGameOver, handleAnswerSelect]);

    return (
        <div className="h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col animate-fade-in relative overflow-hidden">
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
                        <div className="font-bold text-sm tracking-wide">{profile?.display_name || "You"}</div>
                        <div className="flex items-center gap-2">
                             <Trophy className="text-blue-400" size={12} />
                             <span className="text-xs font-black text-white">{1250 + userScore}</span>
                        </div>
                    </div>
                </div>

                {/* Center: Timer & Round */}
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                         <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Round {currentQuestionIndex + 1}</div>
                         <div className="text-2xl font-black italic text-white/20 tracking-tighter">VS</div>
                    </div>

                    <div className="relative group">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                <circle 
                                    cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" 
                                    strokeDasharray={176}
                                    strokeDashoffset={176 - (176 * timeLeft) / 30}
                                    className={`transition-all duration-1000 ${timeLeft < 10 ? 'text-red-500' : 'text-fuchsia-500'}`}
                                />
                            </svg>
                            <div className={`absolute text-xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {timeLeft}
                            </div>
                        </div>
                        
                        {isConfirmed && (
                             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-2 bg-neutral-900 border border-white/5 px-3 py-1 rounded-full animate-bounce">
                                 <Loader2 size={10} className="animate-spin text-blue-500" />
                                 <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Waiting for Opponent</span>
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
                        <div className="font-bold text-sm tracking-wide text-gray-400">CyberHunter_X</div>
                        <div className="flex items-center justify-end gap-2">
                             <span className="text-xs font-black text-gray-500">{980 + opponentScore}</span>
                             <Zap className="text-red-400" size={12} />
                        </div>
                    </div>
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-500 to-orange-600 p-[2px] shadow-lg shadow-red-500/20 opacity-80">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=opponent" className="w-full h-full rounded-full object-cover border-4 border-black" alt="Opponent" />
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                            <Zap size={8} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Quiz Area */}
            <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col justify-center gap-12 relative z-10 pb-12">
                
                {/* Question Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 md:p-16 text-center shadow-2xl relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            Question 0{currentQuestionIndex + 1}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold leading-tight text-white mb-2">
                            "{question.text}"
                        </h2>
                    </div>
                </div>

                {/* Answers Grid */}
                {gameStage === 'playing' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-10 duration-700">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={isConfirmed}
                                className={`
                                    group relative p-6 md:p-8 rounded-[25px] border-2 transition-all duration-300 text-left h-full
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
                                    onClick={() => navigate('/dashboard/arena')}
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
                                <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-blue-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg italic">YOU</div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{profile?.display_name || "HERO"}</h2>
                                <div className="flex justify-center gap-2 mt-2">
                                     <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-blue-400 border border-blue-500/20">MMR: 1,250</div>
                                </div>
                            </div>
                        </div>

                        {/* Center VS */}
                        <div className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse"></div>
                            {gameStage === 'preparing' ? (
                                <div className="flex flex-col items-center">
                                    <div className="text-6xl md:text-8xl font-black italic text-white/10 tracking-tighter animate-pulse">VS</div>
                                    <div className="absolute text-3xl md:text-5xl font-black text-blue-500 animate-bounce">{introTimer}</div>
                                </div>
                            ) : (
                                <div className="text-4xl md:text-6xl font-black text-green-500 uppercase tracking-widest animate-in zoom-in-150 text-center duration-500">Bắt đầu!</div>
                            )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-right-20 duration-1000">
                            <div className="relative">
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[40px] bg-gradient-to-tr from-red-500 to-orange-600 p-[3px] shadow-[0_0_50px_rgba(239,68,68,0.3)] -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[37px] bg-black p-1">
                                        <img 
                                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=opponent" 
                                            className="w-full h-full rounded-[34px] object-cover" 
                                            alt="Opponent" 
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-red-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg italic">OPPONENT</div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">CyberHunter_X</h2>
                                <div className="flex justify-center gap-2 mt-2">
                                     <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-red-400 border border-red-500/20">MMR: 980</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 flex flex-col items-center gap-4">
                        <div className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                            <p className="text-xl md:text-2xl font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">
                                {gameStage === 'preparing' ? 'Chuẩn bị trận đấu' : 'Trận đấu đang diễn ra'}
                            </p>
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
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="relative w-full max-w-4xl flex items-center justify-between px-12">
                        {/* Player 1 Change */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${roundPoints.user > 0 ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]'} p-1`}>
                                     <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} className="w-full h-full rounded-full object-cover" alt="Me" />
                                </div>
                                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black ${roundPoints.user > 0 ? 'text-green-500' : 'text-red-500'} animate-bounce`}>
                                    {roundPoints.user > 0 ? `+${roundPoints.user}` : roundPoints.user}
                                </div>
                            </div>
                            <div className="text-xl font-bold text-white uppercase">{profile?.display_name || "HERO"}</div>
                        </div>

                        {/* VS Divider */}
                        <div className="text-6xl font-black italic text-white/5 animate-pulse">NEXT ROUND</div>

                        {/* Player 2 Change */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${roundPoints.opponent > 0 ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]'} p-1`}>
                                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=opponent" className="w-full h-full rounded-full object-cover" alt="Opponent" />
                                </div>
                                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black ${roundPoints.opponent > 0 ? 'text-green-500' : 'text-red-500'} animate-bounce`}>
                                    {roundPoints.opponent > 0 ? `+${roundPoints.opponent}` : roundPoints.opponent}
                                </div>
                            </div>
                            <div className="text-xl font-bold text-white uppercase">Opponent</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over / Results Overlay */}
            {isGameOver && (
                <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-neutral-950 px-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] animate-pulse"></div>
                    
                    <div className="relative mb-8 text-center animate-in zoom-in-50 duration-700">
                        <Trophy size={80} className={`${userScore > opponentScore ? 'text-yellow-400' : 'text-gray-600'} mx-auto mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]`} />
                        <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic">
                            {userScore > opponentScore ? 'VICTORY' : userScore === opponentScore ? 'DRAW' : 'DEFEAT'}
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 italic">Trận đấu đã kết thúc</p>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
                         <div className={`p-8 rounded-[40px] border-2 ${userScore >= opponentScore ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl shadow-blue-500/10' : 'bg-white/5 border-white/10'} backdrop-blur-md flex flex-col items-center gap-4`}>
                             <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/20">
                                 <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} className="w-full h-full object-cover" alt="Me" />
                             </div>
                             <div className="text-center">
                                 <div className="text-gray-400 font-bold uppercase text-xs mb-1">Your Score</div>
                                 <div className="text-5xl font-black text-white">{1250 + userScore}</div>
                                 <div className={`mt-2 font-bold ${userScore >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                     {userScore >= 0 ? `+${userScore}` : userScore} Points
                                 </div>
                             </div>
                         </div>

                         <div className={`p-8 rounded-[40px] border-2 ${opponentScore > userScore ? 'bg-red-600/10 border-red-500/50 shadow-2xl shadow-red-500/10' : 'bg-white/5 border-white/10'} backdrop-blur-md flex flex-col items-center gap-4`}>
                             <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/20">
                                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=opponent" className="w-full h-full object-cover" alt="Opponent" />
                             </div>
                             <div className="text-center">
                                 <div className="text-gray-400 font-bold uppercase text-xs mb-1">Opponent Score</div>
                                 <div className="text-5xl font-black text-white">{980 + opponentScore}</div>
                                 <div className={`mt-2 font-bold ${opponentScore >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                     {opponentScore >= 0 ? `+${opponentScore}` : opponentScore} Points
                                 </div>
                             </div>
                         </div>
                    </div>

                    <button 
                        onClick={() => navigate('/dashboard/arena')}
                        className="relative px-12 py-5 rounded-[25px] bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                        Quay lại Arena
                    </button>
                </div>
            )}
        </div>
    );
};

export default GamePlayView;
