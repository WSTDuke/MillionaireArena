import React, { useState, useEffect } from 'react';
import { Users, Shield, Trophy, Target, Plus, Search, Crown, Star } from 'lucide-react';
import { ClanPageSkeleton } from '../../components/LoadingSkeletons';

const ClanView = () => {
  const [activeTab, setActiveTab] = useState('my-clan'); // 'my-clan' | 'find-clan'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <ClanPageSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-1">
            Clan / Đội
          </h1>
          <p className="text-gray-400">Quản lý đội ngũ, chiêu mộ thành viên và leo hạng Team.</p>
        </div>
        
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('my-clan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-clan' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Đội của tôi
          </button>
          <button 
            onClick={() => setActiveTab('find-clan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'find-clan' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Tìm Clan
          </button>
        </div>
      </div>

      {activeTab === 'my-clan' ? (
        <MyClanSection />
      ) : (
        <FindClanSection />
      )}

    </div>
  );
};

// --- Sections ---

const MyClanSection = () => {
  return (
    <div className="space-y-8">
      {/* Hero / Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 bg-neutral-900 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent"></div>
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Logo */}
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-[2px] shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
              <Shield size={64} className="text-blue-500" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">Phoenix Fire</h2>
              <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-xs font-bold">LVL 24</span>
            </div>
            <p className="text-gray-400 max-w-xl mb-6">Chúng tôi là những ngọn lửa không bao giờ tắt. Chơi hết mình, chiến thắng hết sức!</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
               <StatBadge icon={Users} label="Thành viên" value="24/30" />
               <StatBadge icon={Trophy} label="Rank" value="#42 Server" color="text-yellow-400" />
               <StatBadge icon={Target} label="Win Rate" value="72%" color="text-green-400" />
            </div>

            <div className="flex gap-4 justify-center md:justify-start">
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                Quản lý
              </button>
              <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10">
                Mời thành viên
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member List */}
        <div className="lg:col-span-2 bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold flex items-center gap-2">
               <Users className="text-blue-500" /> Thành viên (24)
             </h3>
             <button className="text-sm text-blue-400 hover:text-white">Xem tất cả</button>
           </div>
           
           <div className="space-y-4">
             <MemberRow name="ShadowHunter" role="Leader" kda="4.2" activity="Online" rank="Diamond I" />
             <MemberRow name="ViperStrike" role="Captain" kda="3.8" activity="In Game" rank="Diamond III" />
             <MemberRow name="SupportKing" role="Member" kda="5.1" activity="Offline 2h" rank="Platinum II" />
             <MemberRow name="NoobMaster" role="Member" kda="2.4" activity="Online" rank="Gold I" />
             <MemberRow name="LazyCat" role="Member" kda="1.9" activity="Offline 5d" rank="Silver IV" />
           </div>
        </div>

        {/* Clan Activities / Wars */}
        <div className="space-y-6">
           <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Trophy className="text-yellow-500" /> Clan Wars
             </h3>
             <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-sm text-gray-400 mb-2">Trận đấu kế tiếp</div>
                   <div className="flex justify-between items-center mb-3">
                     <span className="font-bold text-white">Phoenix Fire</span>
                     <span className="text-xs text-gray-500">vs</span>
                     <span className="font-bold text-red-400">Dark Legion</span>
                   </div>
                   <div className="text-xs text-center p-2 bg-black/40 rounded-lg text-blue-400 font-bold border border-blue-500/20">
                     20:00 Tối nay
                   </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 opacity-60">
                   <div className="text-sm text-gray-400 mb-2">Kết quả gần đây</div>
                   <div className="flex justify-between items-center">
                     <span className="font-bold text-gray-300">Phoenix Fire</span>
                     <span className="font-bold text-green-400">Win</span>
                     <span className="font-bold text-gray-300">Team Liquid</span>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const FindClanSection = () => {
    return (
        <div className="space-y-6">
             {/* Search Bar */}
            <div className="flex gap-4">
                <div className="flex-1 flex items-center bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                    <Search size={20} className="text-gray-500" />
                    <input type="text" placeholder="Tìm kiếm Clan bằng tên hoặc tag..." className="bg-transparent border-none outline-none text-base ml-3 w-full text-white placeholder-gray-600" />
                </div>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20">
                    <Plus size={20} /> Tạo Clan Mới
                </button>
            </div>

            {/* Recommendations Grid */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Crown className="text-yellow-500" /> Clan Nổi Bật
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ClanCard name="Immortal Kings" members={48} desc="Top 1 Server Clan. Only Challenger+." lvl={50} bg="from-yellow-700 to-orange-900" />
                    <ClanCard name="Night Owls" members={24} desc="Clan for night gamers. Chill & Fun." lvl={12} bg="from-purple-800 to-indigo-900" />
                    <ClanCard name="Vietnam Pros" members={42} desc="Cộng đồng game thủ chuyên nghiệp VN." lvl={35} bg="from-red-800 to-pink-900" />
                    <ClanCard name="Academy Team" members={15} desc="Nơi đào tạo tài năng trẻ." lvl={5} bg="from-green-800 to-teal-900" />
                    <ClanCard name="Solo Leveling" members={1} desc="Just me and my shadow." lvl={99} bg="from-gray-800 to-black" />
                    <ClanCard name="Cyber Punks" members={28} desc="Tech lovers & Gamers united." lvl={20} bg="from-blue-800 to-cyan-900" />
                </div>
            </div>
        </div>
    )
}

// --- Sub Components ---

const StatBadge = ({ icon: Icon, label, value, color = "text-white" }: any) => (
  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
    <Icon size={14} className="text-gray-500" />
    <span className="text-xs text-gray-400">{label}:</span>
    <span className={`text-sm font-bold ${color}`}>{value}</span>
  </div>
);

const MemberRow = ({ name, role, kda, activity, rank }: any) => (
  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3">
      <img src={`https://i.pravatar.cc/150?u=${name}`} alt={name} className="w-10 h-10 rounded-full border border-white/10" />
      <div>
        <div className="font-bold text-white flex items-center gap-2">
            {name} 
            {role === 'Leader' && <Crown size={12} className="text-yellow-500" fill="currentColor" />}
        </div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
    <div className="text-right hidden sm:block">
      <div className="text-sm font-bold text-gray-300">{rank}</div>
      <div className="text-xs text-gray-500">Rank</div>
    </div>
    <div className="text-right hidden md:block">
      <div className="text-sm font-bold text-gray-300">{kda}</div>
      <div className="text-xs text-gray-500">Avg KDA</div>
    </div>
    <div className="text-right">
       <span className={`text-xs font-bold px-2 py-1 rounded ${activity === 'Online' ? 'bg-green-500/10 text-green-400' : activity === 'In Game' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-500'}`}>
         {activity}
       </span>
    </div>
  </div>
);

const ClanCard = ({ name, members, desc, lvl, bg }: any) => (
    <div className={`rounded-xl overflow-hidden border border-white/10 relative group hover:border-white/30 transition-all cursor-pointer bg-gradient-to-br ${bg}`}>
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
        <div className="relative p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                     <Shield size={24} className="text-white" />
                </div>
                <div className="text-xs font-bold bg-black/60 backdrop-blur px-2 py-1 rounded text-white border border-white/10">
                    LVL {lvl}
                </div>
            </div>
            
            <h4 className="text-xl font-bold text-white mb-2">{name}</h4>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2 min-h-[40px]">{desc}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Users size={14} /> {members}/50
                </div>
                <button className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10">
                    Chi tiết
                </button>
            </div>
        </div>
    </div>
)

export default ClanView;
