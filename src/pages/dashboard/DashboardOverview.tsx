import React, { useState, useEffect } from 'react';
import { Trophy, Swords, TrendingUp, Clock, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OverviewPageSkeleton } from '../../components/LoadingSkeletons';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <OverviewPageSkeleton />;

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Bắt đầu hành trình của bạn!</h1>
          <p className="text-gray-400">Hôm nay là một ngày tuyệt vời để leo hạng.</p>
        </div>
       <Link to="/dashboard/arena">
        <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] transition-all flex items-center gap-2">
          <Swords size={20} />
          Tìm trận ngay
        </button>
       </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Trophy} label="Xếp hạng hiện tại" value="Diamond III" subValue="Top 2.5% Server" color="text-yellow-400" gradient="from-yellow-500/20 to-orange-500/5" />
        <StatCard icon={Swords} label="Tỉ lệ thắng" value="68.5%" subValue="+2.4% tuần này" color="text-green-400" gradient="from-green-500/20 to-emerald-500/5" />
        <StatCard icon={TrendingUp} label="Tổng thu nhập" value="$12,450" subValue="+$540 hôm qua" color="text-fuchsia-400" gradient="from-fuchsia-500/20 to-purple-500/5" />
        <StatCard icon={Clock} label="Giờ chơi" value="1,240h" subValue="Hardcore Player" color="text-blue-400" gradient="from-blue-500/20 to-cyan-500/5" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
        {/* Left Column (Main) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Live Tournament Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 group h-64">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
            <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded text-xs font-bold animate-pulse text-white">LIVE</div>
            
            <div className="relative z-10 h-full flex flex-col justify-end p-8">
              <h3 className="text-3xl font-bold mb-2">Million Major: Winter 2024</h3>
              <p className="text-gray-300 mb-6 max-w-lg">Giải đấu lớn nhất mùa đông đã khởi tranh. Xem trực tiếp hoặc tham gia vòng loại mở rộng ngay bây giờ.</p>
              <div className="flex gap-4">
                <button className="px-5 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors">Xem Stream</button>
                <button className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded hover:bg-white/20 transition-colors">Chi tiết giải</button>
              </div>
            </div>
          </div>

          {/* Recent Matches History */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Lịch sử đấu</h3>
              <button className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Xem tất cả</button>
            </div>
            <div className="space-y-4">
              <MatchRow result="Win" score="15 - 3" map="Cyber City" kda="18/4/5" date="2 giờ trước" money="+$50" />
              <MatchRow result="Loss" score="12 - 13" map="Desert Storm" kda="12/10/2" date="5 giờ trước" money="-$20" />
              <MatchRow result="Win" score="15 - 8" map="Neon Lab" kda="24/2/8" date="1 ngày trước" money="+$75" />
              <MatchRow result="Win" score="15 - 0" map="Cyber City" kda="15/0/4" date="1 ngày trước" money="+$40" />
            </div>
          </div>
        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-8">
          
          {/* Leaderboard Widget */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500 w-5 h-5" /> 
              Bảng vàng Top 5
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                  <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm rounded ${rank === 1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-gray-400 text-black' : rank === 3 ? 'bg-orange-700 text-white' : 'text-gray-500 bg-white/5'}`}>
                    {rank}
                  </div>
                  <img src={`https://i.pravatar.cc/150?img=${rank + 10}`} alt="Avt" className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="text-sm font-bold group-hover:text-fuchsia-400 transition-colors">Player_{rank}99</div>
                    <div className="text-xs text-gray-500">2,500 MMR</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-gray-400 border border-white/10 rounded hover:bg-white/5 hover:text-white transition-colors">
              Xem bảng xếp hạng đầy đủ
            </button>
          </div>

          {/* Clan/Friends Active */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="text-blue-500 w-5 h-5" /> 
              Bạn bè Online (3)
            </h3>
            <div className="space-y-3">
              <FriendRow name="DragonSlayer" status="In Match" statusColor="text-yellow-500" />
              <FriendRow name="NoobMaster69" status="Online" statusColor="text-green-500" />
              <FriendRow name="ProGamervn" status="Lobby" statusColor="text-blue-500" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

const StatCard = ({ icon: Icon, label, value, subValue, color, gradient }) => (
  <div className={`p-6 rounded-2xl bg-neutral-900/80 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-[40px] -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100`}></div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${color}`}>
        <Icon size={24} />
      </div>
      <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className={`text-xs ${value.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{subValue}</div>
    </div>
  </div>
);

const MatchRow = ({ result, score, map, kda, date, money }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group">
    <div className="flex items-center gap-4">
      <div className={`w-1 h-12 rounded-full ${result === 'Win' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
      <div>
        <div className={`font-bold text-lg ${result === 'Win' ? 'text-green-400' : 'text-gray-400'}`}>{result.toUpperCase()}</div>
        <div className="text-xs text-gray-500">{map}</div>
      </div>
    </div>
    <div className="text-center hidden sm:block">
      <div className="font-bold text-white tracking-wider">{score}</div>
      <div className="text-xs text-gray-500">Score</div>
    </div>
    <div className="text-center hidden sm:block">
      <div className="font-medium text-gray-300">{kda}</div>
      <div className="text-xs text-gray-500">K/D/A</div>
    </div>
    <div className="text-right">
      <div className={`font-bold ${money.includes('+') ? 'text-yellow-400' : 'text-gray-400'}`}>{money}</div>
      <div className="text-xs text-gray-500">{date}</div>
    </div>
  </div>
);

const FriendRow = ({ name, status, statusColor }) => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <img src={`https://i.pravatar.cc/150?u=${name}`} alt={name} className="w-8 h-8 rounded-full" />
      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${status === 'Online' ? 'bg-green-500' : status === 'In Match' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
    </div>
    <div className="flex-1">
      <div className="text-sm font-bold text-white hover:text-fuchsia-400 cursor-pointer transition-colors">{name}</div>
      <div className={`text-xs ${statusColor}`}>{status}</div>
    </div>
    <button className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
      <Plus size={14} />
    </button>
  </div>
);

export default DashboardOverview;
