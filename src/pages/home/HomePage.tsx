import React from 'react';
import { Swords, Trophy, Users, Zap, ArrowRight, Shield, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const MillionArena = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <Swords className="w-8 h-8 text-fuchsia-500 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              MillionArena
            </span>
          </div>

          {/* Nav Links (Hidden on mobile for simplicity) */}
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
            <a href="#" className="hover:text-fuchsia-400 transition-colors">Giải đấu</a>
            <a href="#" className="hover:text-fuchsia-400 transition-colors">Bảng xếp hạng</a>
            <a href="#" className="hover:text-fuchsia-400 transition-colors">Cộng đồng</a>
            <a href="#" className="hover:text-fuchsia-400 transition-colors">Marketplace</a>
          </nav>

          {/* CTA Button */}
          <Link to='/login'>
          <button className="px-6 py-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold shadow-[0_0_15px_rgba(192,38,211,0.5)] hover:shadow-[0_0_25px_rgba(192,38,211,0.7)] transition-all transform hover:-translate-y-0.5">
            Tham chiến ngay
          </button>
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center px-4">
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-sm mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Season 5: Kỷ nguyên bóng tối đang diễn ra</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Nơi kỹ năng định đoạt <br />
            <span className="bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Vinh Quang & Tiền Thưởng
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Tham gia vào đấu trường e-sports khắc nghiệt nhất. Chiến đấu, leo hạng và giành lấy phần thưởng trị giá hàng triệu đô la. Bạn đã sẵn sàng chưa?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 fill-black" />
              Bắt đầu miễn phí
            </button>
            <button className="px-8 py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-lg backdrop-blur-sm transition-colors flex items-center justify-center gap-2">
              Xem trailer
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-10 border-y border-white/10 bg-white/5">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Người chơi", value: "1M+", icon: Users },
            { label: "Giải thưởng", value: "50K+", icon: Trophy },
            { label: "Trận đấu/ngày", value: "250K", icon: Swords },
            { label: "Clan hoạt động", value: "12K", icon: Shield },
          ].map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <stat.icon className="w-6 h-6 text-fuchsia-500 mb-2" />
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Chế độ chơi Đỉnh cao</h2>
            <p className="text-gray-400">Chọn đấu trường phù hợp với lối chơi của bạn.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-neutral-900 border border-white/10 hover:border-fuchsia-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(192,38,211,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Swords size={100} />
              </div>
              <div className="w-12 h-12 bg-fuchsia-500/20 rounded-lg flex items-center justify-center mb-6 text-fuchsia-400 group-hover:scale-110 transition-transform">
                <Swords />
              </div>
              <h3 className="text-xl font-bold mb-3">1v1 Deathmatch</h3>
              <p className="text-gray-400">Đối đầu trực diện. Kỹ năng cá nhân là tất cả. Người thắng lấy tất cả.</p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-neutral-900 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={100} />
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
                <Target />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Battle 5v5</h3>
              <p className="text-gray-400">Phối hợp chiến thuật cùng đồng đội. Đánh chiếm cứ điểm và leo hạng Clan.</p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-neutral-900 border border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={100} />
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform">
                <Trophy />
              </div>
              <h3 className="text-xl font-bold mb-3">Giải đấu Million</h3>
              <p className="text-gray-400">Sự kiện hàng tháng với tổng giải thưởng lên tới 1 triệu đô la.</p>
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
                <span className="text-xl font-bold text-white">MillionArena</span>
              </div>
              <p className="text-gray-500 text-sm">
                Nền tảng thi đấu e-sports thế hệ mới. Nơi vinh quang dành cho người xứng đáng.
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
            <p>&copy; 2024 MillionArena Inc. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MillionArena;