import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Shield, Zap, Swords, Trophy, X, Loader2, ChevronRight } from 'lucide-react';

const ArenaLobbyView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'Normal';
    const [searching, setSearching] = useState(true);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: any;
        if (searching) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [searching]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getModeDetails = () => {
        switch (mode.toLowerCase()) {
            case 'ranked':
                return {
                    title: 'Xếp hạng (Ranked)',
                    icon: Trophy,
                    color: 'text-fuchsia-400',
                    bg: 'from-fuchsia-600/20 to-purple-600/20',
                    border: 'border-fuchsia-500/30'
                };
            case 'deathmatch':
                return {
                    title: 'Tử chiến (Deathmatch)',
                    icon: Zap,
                    color: 'text-red-400',
                    bg: 'from-red-600/20 to-orange-600/20',
                    border: 'border-red-500/30'
                };
            default:
                return {
                    title: 'Đấu thường (Normal)',
                    icon: Swords,
                    color: 'text-blue-400',
                    bg: 'from-blue-600/20 to-cyan-600/20',
                    border: 'border-blue-500/30'
                };
        }
    };

    const details = getModeDetails();

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <button 
                    onClick={() => navigate('/dashboard/arena')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-wider">Hủy tìm trận</span>
                </button>

                <div className="flex items-center gap-4 bg-neutral-900 border border-white/5 px-6 py-2 rounded-full backdrop-blur-md">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Server: Southeast Asia</span>
                     </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                
                {/* Left Column: Mode Info */}
                <div className="space-y-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${details.bg} border ${details.border}`}>
                        <details.icon size={16} className={details.color} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${details.color}`}>
                            {mode} MODE
                        </span>
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight">
                        {details.title}
                    </h1>
                    
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Đang tìm kiếm đối thủ xứng tầm. Hệ thống đang quét qua 1,240 người chơi đang online để chọn ra những chiến binh phù hợp nhất.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                             <div className="text-gray-500 text-xs font-bold uppercase mb-1">Thời gian chờ dự kiến</div>
                             <div className="text-2xl font-bold text-white">0:45</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                             <div className="text-gray-500 text-xs font-bold uppercase mb-1">Thời gian đã trôi qua</div>
                             <div className={`text-2xl font-bold ${details.color} animate-pulse`}>
                                 {formatTime(timer)}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Visual Effect */}
                <div className="flex justify-center relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${details.bg} rounded-full blur-[120px] opacity-30 animate-pulse`}></div>
                    <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-white/5 flex items-center justify-center p-4">
                        <div className="absolute inset-0 border-4 border-dotted border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${details.bg} border-2 ${details.border} flex flex-col items-center justify-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
                             <div className="relative">
                                 <Loader2 size={64} className={`${details.color} animate-spin`} strokeWidth={1} />
                                 <details.icon size={32} className={`absolute inset-0 m-auto ${details.color}`} />
                             </div>
                             <div className="text-center">
                                 <div className="text-sm font-bold uppercase tracking-[0.2em] mb-1">Searching</div>
                                 <div className="flex justify-center gap-1">
                                     <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]"></div>
                                     <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]"></div>
                                     <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"></div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Player Slots */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} /> Trạng thái phòng chờ (1/2)
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Current Player */}
                        <div className="flex items-center gap-4 p-5 bg-white/10 border border-white/20 rounded-2xl shadow-xl shadow-blue-500/5">
                            <div className="w-16 h-16 rounded-full bg-blue-500 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="Avatar" />
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-bold flex items-center gap-2">
                                    You (Player 1) <Shield size={14} className="text-blue-400" />
                                </div>
                                <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">Ready</div>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
                        </div>

                        {/* VS Divider */}
                        <div className="flex justify-center py-2 relative">
                             <div className="absolute inset-0 flex items-center">
                                 <div className="w-full border-t border-white/5"></div>
                             </div>
                             <div className={`relative z-10 w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center font-black text-xs italic ${details.color}`}>
                                 VS
                             </div>
                        </div>

                        {/* Opponent Slot */}
                        <div className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl opacity-40 group hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center border border-white/5 overflow-hidden">
                                <Users size={24} className="text-gray-600 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <div className="h-5 w-32 bg-white/10 rounded-md mb-2"></div>
                                <div className="h-3 w-20 bg-white/5 rounded-sm"></div>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-white/10"></div>
                        </div>
                    </div>

                    <div className="pt-8 space-y-3">
                         <div className="p-4 rounded-xl bg-neutral-900/50 border border-white/5 text-xs text-gray-400 leading-relaxed italic">
                             Hệ thống đang ưu tiên tìm kiếm đối thủ có chỉ số MMR tương đương để đảm bảo tính công bằng cho trận đấu 1vs1.
                         </div>
                    </div>
                </div>

            </div>

            {/* Bottom Tip */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-gray-500 text-sm bg-neutral-900/50 backdrop-blur border border-white/5 px-6 py-2 rounded-full">
                <span className="font-bold text-gray-300">TIP:</span> Bạn có thể luyện tập kỹ năng ở phòng tập trong khi chờ đợi.
                <ChevronRight size={14} />
            </div>
        </div>
    );
};

export default ArenaLobbyView;
