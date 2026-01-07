import React from 'react';
import { Swords, Trophy, Users, Zap, ArrowRight, Shield, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginRequiredModal from '../../components/LoginRequiredModal';

const MillionArena = () => {
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white overflow-x-hidden relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-dot-pattern opacity-5 pointer-events-none"></div>
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 relative">
        {/* Scanline */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent"></div>
        
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group relative">
            {/* HUD Accent */}
            <div className="absolute -left-2 -top-2 w-8 h-8 border-t border-l border-fuchsia-500/30 pointer-events-none"></div>
            <Swords className="w-8 h-8 text-fuchsia-500 group-hover:rotate-12 transition-transform duration-300" />
            <div className="text-2xl font-black uppercase italic tracking-tighter">
              <span className="text-white">MillionMind</span>
              <span className="text-fuchsia-500">Arena</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex gap-8 text-xs font-black text-gray-500 uppercase tracking-wider">
            <button onClick={() => setShowLoginModal(true)} className="hover:text-fuchsia-400 transition-colors">Giải đấu</button>
            <button onClick={() => setShowLoginModal(true)} className="hover:text-fuchsia-400 transition-colors">Bảng xếp hạng</button>
            <button onClick={() => setShowLoginModal(true)} className="hover:text-fuchsia-400 transition-colors">Cộng đồng</button>
          </nav>

          {/* CTA Button */}
          <Link to='/login'>
          <button 
            className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(192,38,211,0.5)] hover:shadow-[0_0_30px_rgba(192,38,211,0.7)] transition-all hover:translate-y-[-2px] relative overflow-hidden group"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            Tham chiến ngay
          </button>
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center px-4">
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        
        {/* HUD Frame Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border-t-2 border-l-2 border-fuchsia-500/20 pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 border-b-2 border-r-2 border-fuchsia-500/20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Tech Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/30 mb-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-300">Season 5: Kỷ nguyên bóng tối đang diễn ra</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight uppercase italic">
            Nơi kỹ năng <br />
            <span className="bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(192,38,211,0.5)]">
              Lên Ngôi
            </span>
          </h1>
          
          <div className="h-1 w-48 bg-gradient-to-r from-fuchsia-600 via-purple-500 to-transparent mx-auto mb-8"></div>
          
          <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-bold leading-relaxed">
            Tham gia vào đấu trường solo khắc nghiệt nhất. <span className="text-gray-300">Chiến đấu, leo hạng</span> và giành lấy phần thưởng danh giá.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to='/login'>
            <button 
              className="px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.3em] hover:bg-gray-200 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-3 group relative overflow-hidden"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Zap className="w-5 h-5 fill-black" />
              Bắt đầu miễn phí
            </button></Link>
            <button 
              className="px-10 py-5 border-2 border-white/20 bg-black/40 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.3em] backdrop-blur-sm transition-all hover:border-fuchsia-500/50 flex items-center justify-center gap-3"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              Xem trailer
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-16 border-y border-white/10 bg-neutral-950/50 backdrop-blur-sm relative overflow-hidden">
        {/* Scanline */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent"></div>
        
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Người chơi", value: "1M+", icon: Users },
            { label: "Giải thưởng", value: "50K+", icon: Trophy },
            { label: "Trận đấu/ngày", value: "250K", icon: Swords },
            { label: "Clan hoạt động", value: "12K", icon: Shield },
          ].map((stat, index) => (
            <div key={index} className="flex flex-col items-center group relative">
              {/* HUD Corner */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="w-16 h-16 bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-4 group-hover:bg-fuchsia-500/20 transition-all relative overflow-hidden"
                   style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <stat.icon className="w-7 h-7 text-fuchsia-500" />
              </div>
              <div className="text-4xl font-black text-white tabular-nums tracking-tighter mb-1">{stat.value}</div>
              <div className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 relative">
            {/* Tech Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4">
              <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">// Game Modes</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase italic tracking-tighter">Chế độ chơi <span className="text-fuchsia-500">Đỉnh cao</span></h2>
            <div className="h-1 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Chọn đấu trường phù hợp với lối chơi của bạn.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-neutral-950 border border-white/10 hover:border-fuchsia-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(192,38,211,0.15)] relative overflow-hidden"
                 style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
              {/* HUD Corners */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-fuchsia-500/20 group-hover:border-fuchsia-500/40 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-fuchsia-500/20 group-hover:border-fuchsia-500/40 transition-colors"></div>
              
              {/* Background Icon */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Swords size={120} />
              </div>
              
              <div className="w-14 h-14 bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center mb-6 text-fuchsia-400 group-hover:scale-110 transition-transform"
                   style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <Swords size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase italic tracking-tight">Leo hạng BO5</h3>
              <p className="text-gray-500 font-bold text-sm">Sử dụng tư duy chiến lược để giành chiến thắng.</p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-neutral-950 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden"
                 style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
              {/* HUD Corners */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors"></div>
              
              {/* Background Icon */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target size={120} />
              </div>
              
              <div className="w-14 h-14 bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform"
                   style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase italic tracking-tight">Chế độ Clan</h3>
              <p className="text-gray-500 font-bold text-sm">Phối hợp chiến thuật cùng đồng đội, leo hạng Clan.</p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-neutral-950 border border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] relative overflow-hidden"
                 style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
              {/* HUD Corners */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-orange-500/20 group-hover:border-orange-500/40 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-orange-500/20 group-hover:border-orange-500/40 transition-colors"></div>
              
              {/* Background Icon */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={120} />
              </div>
              
              <div className="w-14 h-14 bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform"
                   style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <Trophy size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase italic tracking-tight">Giải đấu Million</h3>
              <p className="text-gray-500 font-bold text-sm">Sự kiện hàng tháng với giải thưởng hấp dẫn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-4">
                <Swords className="w-6 h-6 text-fuchsia-500" />
                <span className="text-xl font-bold text-white"><span className="text-white">MillionMind</span>
              <span className="text-purple-500">Arena</span></span>
              </div>
              <p className="text-gray-500 text-sm">
                Nền tảng thi đấu câu hỏi thế hệ mới. Nơi vinh quang dành cho người xứng đáng.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Nền tảng</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-fuchsia-400">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-fuchsia-400">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-fuchsia-400">Đối tác</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-fuchsia-400">Luật thi đấu</a></li>
                <li><a href="#" className="hover:text-fuchsia-400">Báo lỗi</a></li>
                <li><a href="#" className="hover:text-fuchsia-400">Trung tâm trợ giúp</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Đăng ký nhận tin</h4>
              <div className="flex gap-2">
                <input type="email" placeholder="Email của bạn" className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 w-full" />
                <button className="bg-fuchsia-600 hover:bg-fuchsia-500 p-2 rounded-lg text-white">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
            <p>&copy; 2025 MillionMindArena Inc. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default MillionArena;