import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  Users, 
  ArrowLeft, 
  Share2, 
  Shield, 
  Clock, 
  Swords, 
  Award,
  ChevronRight,
  Coins
} from 'lucide-react';

const TournamentDetailView = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in a real app this would come from an API based on the ID
  const tournamentData = {
    id: 'community-weekly-cup-42',
    title: 'Community Weekly Cup #42',
    status: 'Đang diễn ra',
    prize: '10.000',
    participants: '16/16',
    date: '05 Jan, 2025',
    type: 'SOLO 5v5',
    entryFee: '500',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
    description: 'Giải đấu thường niên dành cho cộng đồng MillionMind. Nơi quy tụ những cao thủ hàng đầu để tranh tài và giành lấy vinh quang.',
    rules: [
      'Thi đấu theo thể thức loại trực tiếp (Single Elimination).',
      'Mỗi trận đấu diễn ra trong 30 phút.',
      'Người chơi phải có mặt trước 15 phút.',
      'Nghiêm cấm mọi hành vi gian lận.'
    ],
    prizes: [
      { rank: '1st', reward: '5.000 ',special:'Huy hiệu độc quyền' },
      { rank: '2nd', reward: '3.000 ' },
      { rank: '3rd-4th', reward: '1.000 ' }
    ]
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/dashboard/tournaments')}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <div className="p-2 bg-neutral-900 border border-white/10 rounded-lg group-hover:border-fuchsia-500/50 transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Quay lại</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/10 text-gray-400 hover:text-white hover:border-fuchsia-500/30 transition-all rounded-lg">
          <Share2 size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Chia sẻ</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[400px] border border-white/5 bg-neutral-950 overflow-hidden group">
        <div className="absolute inset-0">
          <img 
            src={tournamentData.image} 
            alt={tournamentData.title} 
            className="w-full h-full object-cover opacity-20 blur-sm group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        </div>

        <div className="absolute relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 bg-fuchsia-600/20 border border-fuchsia-500/50 text-fuchsia-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(192,38,211,0.2)]`}>
              {tournamentData.status}
            </span>
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">// {tournamentData.type}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase italic tracking-tighter max-w-4xl leading-none">
            {tournamentData.title}
          </h1>

          <div className="flex flex-wrap gap-8 md:gap-16 border-t border-white/10 pt-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/20">
                <Trophy size={24} className="text-fuchsia-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tổng giải thưởng</span>
                <span className="flex items-center gap-2 text-xl font-black text-white italic">{tournamentData.prize} <Coins size={20} className="text-yellow-500" /></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Users size={24} className="text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số đội tham gia</span>
                <span className="text-xl font-black text-white italic">{tournamentData.participants}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <Calendar size={24} className="text-green-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Khởi tranh</span>
                <span className="text-xl font-black text-white italic">{tournamentData.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {['overview', 'bracket', 'teams', 'matches'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] relative transition-all ${
                  activeTab === tab ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {tab === 'overview' ? 'Tổng quan' : tab === 'bracket' ? 'Nhánh đấu' : tab === 'teams' ? 'Đội tham gia' : 'Trận đấu'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-xl min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-fuchsia-500" /> Giới thiệu
                  </h3>
                  <p className="text-gray-400 leading-relaxed font-medium">
                    {tournamentData.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                    <Award size={18} className="text-fuchsia-500" /> Cơ cấu giải thưởng
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {tournamentData.prizes.map((item, index) => (
                      <div key={index} className="p-4 bg-black border border-white/5 rounded-lg flex flex-col items-center text-center gap-2">
                        <span className={`text-sm font-black uppercase ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`}>
                          {item.rank} Place
                        </span>
                        <span className="flex items-center gap-2 text-fuchsia-400 font-bold">{item.reward}<Coins size={20} className="text-yellow-500" /> </span>
                        <span className='text-fuchsia-400 font-bold'>{item.special}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                    <Swords size={18} className="text-fuchsia-500" /> Luật thi đấu
                  </h3>
                  <ul className="space-y-3">
                    {tournamentData.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-400 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'bracket' && (
              <div className="flex items-center justify-center h-48 text-gray-500 font-bold uppercase tracking-wider">
                Bracket Display Coming Soon
              </div>
            )}

             {activeTab === 'teams' && (
              <div className="flex items-center justify-center h-48 text-gray-500 font-bold uppercase tracking-wider">
                Teams List Coming Soon
              </div>
            )}

             {activeTab === 'matches' && (
              <div className="flex items-center justify-center h-48 text-gray-500 font-bold uppercase tracking-wider">
                Matches Schedule Coming Soon
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-fuchsia-500/30 pb-3">
              Thông tin đăng ký
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">Lệ phí</span>
                <span className="flex items-center gap-1 text-white font-black">{tournamentData.entryFee} <Coins size={14} className="text-yellow-500" /></span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">Ngày kết thúc đăng ký</span>
                <span className="text-white font-black text-right">04 Jan, 2025<br/><span className="text-[10px] text-fuchsia-500">23:59 GMT+7</span></span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">Chế độ</span>
                <span className="text-white font-black">{tournamentData.type} Clan</span>
              </div>
            </div>

            <button className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(192,38,211,0.4)]">
              Đăng ký ngay <ChevronRight size={16} />
            </button>
          </div>    

          <div className="p-6 bg-neutral-900 border border-white/5 rounded-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-3">
              Tin tức liên quan
            </h3>
            <div className="space-y-4">
               {[1, 2].map(i => (
                 <div key={i} className="group cursor-pointer">
                    <span className="text-[10px] text-fuchsia-500 font-bold uppercase mb-1 block">Tin tức</span>
                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors leading-tight mb-2">
                       Cập nhật thay đổi luật thi đấu mùa giải 2025
                    </h4>
                    <span className="text-[10px] text-gray-600 flex items-center gap-2">
                       <Clock size={10} /> 2 giờ trước
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailView;
