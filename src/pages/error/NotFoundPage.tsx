import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Zap, ShieldAlert } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-fuchsia-500 overflow-hidden relative flex flex-col items-center justify-center p-6">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            
            {/* --- HUD DECORATIONS --- */}
            <div className="absolute top-10 left-10 w-32 h-32 border-t-2 border-l-2 border-fuchsia-500/20 pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 border-b-2 border-r-2 border-fuchsia-500/20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-10 -translate-y-1/2 hidden lg:flex flex-col gap-8 opacity-20">
                <div className="w-[1px] h-32 bg-gradient-to-t from-fuchsia-500 to-transparent"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.5em] vertical-text transform rotate-180" style={{ writingMode: 'vertical-rl' }}>System Error 404</div>
                <div className="w-[1px] h-32 bg-gradient-to-b from-fuchsia-500 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
                {/* Visual Glitch Element */}
                <div className="relative mb-8 group">
                    <div className="absolute -inset-4 bg-fuchsia-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative glass-panel-heavy p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-neutral-950 border border-fuchsia-500/50 text-fuchsia-400 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                            Out of bounds
                        </div>
                        <ShieldAlert size={80} className="text-fuchsia-500 mb-4 animate-bounce" />
                        <h1 className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(192,38,211,0.5)]">
                            404
                        </h1>
                    </div>
                </div>

                <div className="space-y-4 mb-12">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                        Đấu trường <span className="text-fuchsia-500">Bị mất dấu</span>
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent mx-auto"></div>
                    <p className="text-gray-400 font-bold leading-relaxed">
                        Tín hiệu đã bị ngắt. Trang bạn đang tìm kiếm đã bị phá hủy hoặc chưa bao giờ tồn tại trong hệ thống MillionMind.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => navigate(-1)}
                        className="tech-button-secondary py-4 group"
                        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Quay lại trang trước
                    </button>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="tech-button-primary py-4 group"
                        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                    >
                        <Home className="w-5 h-5" />
                        Trở về sảnh chính
                    </button>
                </div>

                {/* Footer Quote */}
                <div className="mt-10 flex flex-col items-center opacity-30">
                    <Zap size={20} className="text-fuchsia-500 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">"Vinh quang chỉ dành cho người kiên định"</p>
                </div>
            </div>

            {/* Ambient Scanline */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="w-full h-full bg-scanline animate-scanline"></div>
            </div>
        </div>
    );
};

export default NotFoundPage;
