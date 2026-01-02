import { useState, useEffect } from 'react';
import { Trophy, Swords, TrendingUp, Clock, Users, Bookmark } from 'lucide-react';
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
        <StatCard icon={Trophy} label="Xếp hạng hiện tại" value="--" subValue="-- Server" color="text-yellow-400" gradient="from-yellow-500/20 to-orange-500/5" />
        <StatCard icon={Swords} label="Tỉ lệ thắng" value="0%" subValue="-- tuần này" color="text-green-400" gradient="from-green-500/20 to-emerald-500/5" />
        <StatCard icon={TrendingUp} label="Tổng thu nhập" value="$0" subValue="-- hôm qua" color="text-fuchsia-400" gradient="from-fuchsia-500/20 to-purple-500/5" />
        <StatCard icon={Clock} label="Giờ chơi" value="0h" subValue="New Player" color="text-blue-400" gradient="from-blue-500/20 to-cyan-500/5" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
        {/* Left Column (Main) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Recent Matches History */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Lịch sử đấu</h3>
              <button className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Xem tất cả</button>
            </div>
            <div className="space-y-4">
              <MatchRow mode="Solo Ranked" result="Victory" score="24/4/12" time="20m" xp="+340" date="2h ago" />
            </div>
          </div>
        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-8">
          
          {/* Leaderboard Widget */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bookmark className="text-yellow-500 w-5 h-5" /> 
              Bảng vàng Top 5
            </h3>
            <div className="space-y-4">
              <LeaderboardRow rank={1} name="CyberNinja" level={74} score="2,840" isTop />
              <LeaderboardRow rank={2} name="DragonSlayer" level={68} score="2,720" />
              <LeaderboardRow rank={3} name="MysticQueen" level={62} score="2,590" />
              <LeaderboardRow rank={4} name="ShadowHunter" level={59} score="2,450" />
              <LeaderboardRow rank={5} name="IronViking" level={55} score="2,310" />
            </div>
            <Link to="/dashboard/ranking">
            <button className="w-full mt-4 py-2 text-sm text-gray-400 border border-white/10 rounded hover:bg-white/5 hover:text-white transition-colors">
              Xem bảng xếp hạng đầy đủ
            </button></Link>
          </div>

          {/* Clan/Friends Active */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="text-blue-500 w-5 h-5" /> 
              Bạn bè Online (3)
            </h3>
            <div className="space-y-3">
              <FriendRow name="Alex Johnson" status="In Lobby" avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

const StatCard = ({ icon: Icon, label, value, subValue, color, gradient }: any) => (
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

const MatchRow = ({ mode, result, score, time, xp, date }: any) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-10 rounded-full ${result === 'Victory' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <div>
        <div className="font-bold text-white mb-0.5">{mode}</div>
        <div className="text-xs text-gray-500">{date} • {time}</div>
      </div>
    </div>
    <div className="flex items-center gap-8">
      <div className="text-center">
        <div className={`font-bold ${result === 'Victory' ? 'text-green-400' : 'text-red-400'}`}>{result}</div>
        <div className="text-xs text-gray-500">{score}</div>
      </div>
      <div className="text-right min-w-[60px]">
        <div className="text-fuchsia-400 font-bold">{xp} XP</div>
      </div>
    </div>
  </div>
);

const LeaderboardRow = ({ rank, name, level, score, isTop }: any) => (
  <div className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isTop ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-white/5 border border-transparent'}`}>
    <div className="flex items-center gap-3">
      <span className={`w-6 text-center font-bold ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-500'}`}>{rank}</span>
      <div>
        <div className="font-bold text-sm text-white">{name}</div>
        <div className="text-[10px] text-gray-500">LVL {level}</div>
      </div>
    </div>
    <div className="text-right">
       <div className="text-sm font-bold text-white">{score}</div>
       <div className="text-[10px] text-gray-500 font-medium">MMR</div>
    </div>
  </div>
);

const FriendRow = ({ name, status, avatar }: any) => (
  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="relative">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full bg-neutral-800" />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full"></div>
      </div>
      <div>
        <div className="text-sm font-bold text-white">{name}</div>
        <div className="text-xs text-green-500">{status}</div>
      </div>
    </div>
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
      <Clock size={14} />
    </div>
  </div>
);

export default DashboardOverview;
