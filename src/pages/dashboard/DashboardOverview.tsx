import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Swords, TrendingUp, Clock, Users, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OverviewPageSkeleton } from '../../components/LoadingSkeletons';
import { supabase } from '../../lib/supabase';
import RankBadge from '../../components/shared/RankBadge';

import { getRankFromMMR } from '../../lib/ranking';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mmr: number | null;
}

const DashboardOverview = () => {
  const { dashboardCache, setDashboardCache } = useOutletContext<any>();
  const [loading, setLoading] = useState(true); // Always show loading on page visit
  const [topUsers, setTopUsers] = useState<Profile[]>(dashboardCache.overviewTopUsers || []);
  const [userStats, setUserStats] = useState({
      totalMatches: 0,
      totalWins: 0,
      currentMMR: 0,
      recentMatches: [] as any[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
             // 1. Fetch Profile for MMR
             const { data: profile } = await supabase.from('profiles').select('mmr').eq('id', user.id).single();
             const currentMMR = profile?.mmr || 0;

             // 2. Fetch Stats (Matches & Wins)
             // Used Promise.all for parallelism
             const [matchesRes, winsRes, historyRes] = await Promise.all([
                 supabase.from('game_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                 supabase.from('game_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('result', 'Chiến thắng'),
                 supabase.from('game_history').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5)
             ]);

             setUserStats({
                 totalMatches: matchesRes.count || 0,
                 totalWins: winsRes.count || 0,
                 currentMMR,
                 recentMatches: historyRes.data || []
             });
        }

        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, mmr')
          .not('mmr', 'is', null) // Only users with MMR
          .order('mmr', { ascending: false })
          .limit(5);

        if (data) {
          setTopUsers(data);
          setDashboardCache((prev: any) => ({ ...prev, overviewTopUsers: data }));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [setDashboardCache]);

  const winRate = userStats.totalMatches > 0 ? Math.round((userStats.totalWins / userStats.totalMatches) * 100) : 0;
  const rankInfo = getRankFromMMR(userStats.currentMMR);

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
        <StatCard 
            icon={Bookmark} 
            label="Xếp hạng hiện tại" 
            value={`${rankInfo.tier} ${rankInfo.division}`} 
            subValue={`${userStats.currentMMR} MMR`} 
            color="text-yellow-400" 
            gradient="from-yellow-500/20 to-orange-500/5" 
        />
        <StatCard 
            icon={TrendingUp} 
            label="Tổng số trận" 
            value={`${userStats.totalMatches}`} 
            subValue="Đã chơi" 
            color="text-fuchsia-400" 
            gradient="from-fuchsia-500/20 to-purple-500/5" 
        />
        <StatCard 
            icon={Clock} 
            label="Số trận thắng" 
            value={`${userStats.totalWins}`} 
            subValue="Chiến thắng" 
            color="text-blue-400" 
            gradient="from-blue-500/20 to-cyan-500/5" 
        />
          <StatCard 
            icon={Swords} 
            label="Tỉ lệ thắng" 
            value={`${winRate}%`} 
            subValue={`${userStats.totalWins} trận thắng`} 
            color="text-green-400" 
            gradient="from-green-500/20 to-emerald-500/5" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
        {/* Left Column (Main) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Recent Matches History */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Lịch sử đấu mới nhất</h3>
              <Link to="/dashboard/profile" className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Xem tất cả</Link>
            </div>
            <div className="space-y-4">
              {userStats.recentMatches.length > 0 ? (
                  userStats.recentMatches.map((match) => (
                      <MatchRow 
                        key={match.id}
                        mode={match.mode || (match.mode === 'Ranked' ? 'Ranked Match' : 'Normal Match')} 
                        result={match.result || 'Hòa'} 
                        score={`${match.score_user} - ${match.score_opponent}`} 
                        time={new Date(match.played_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        xp={match.result === 'Chiến thắng' ? '+XP' : '+0 XP'} 
                        date={new Date(match.played_at).toLocaleDateString()}
                        roundScores={match.round_scores}
                        mmrChange={match.mode === 'Ranked' ? match.mmr_change : undefined}
                      />
                  ))
              ) : (
                  <div className="text-center text-gray-500 italic py-4">Chưa có trận đấu nào được ghi lại.</div>
              )}
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
              {topUsers.map((user, index) => (
                <LeaderboardRow 
                  key={user.id} 
                  rank={index + 1} 
                  name={user.display_name} 
                  mmr={user.mmr} 
                  isTop={index === 0} 
                />
              ))}
              {topUsers.length === 0 && (
                <div className="text-center py-4 text-gray-500 italic text-sm">Chưa có dữ liệu xếp hạng</div>
              )}
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

const StatCard = ({ icon: Icon, label, value, subValue, color, gradient }: { icon: any, label: string, value: string, subValue: string, color: string, gradient: string }) => (
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

const MatchRow = ({ mode, result, score, time, date, roundScores, mmrChange }: { 
    mode: string, 
    result: string, 
    score: string, 
    time: string, 
    xp?: string, 
    date: string,
    roundScores?: number[],
    mmrChange?: number
}) => {
    // Calculate Average
    const avgScore = roundScores && roundScores.length > 0 
        ? (roundScores.reduce((a, b) => a + b, 0) / roundScores.length).toFixed(1)
        : null;

    return (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group relative overflow-hidden">
            {/* Left: Result & Time */}
            <div className="flex items-center gap-4 min-w-[180px]">
                 <div className={`w-1.5 h-12 rounded-full ${result === 'Chiến thắng' ? 'bg-green-500' : (result === 'Hòa' ? 'bg-yellow-500' : 'bg-red-500')}`}></div>
                 <div>
                    <div className={`font-bold text-lg ${result === 'Chiến thắng' ? 'text-green-500' : (result === 'Hòa' ? 'text-yellow-500' : 'text-red-500')}`}>
                        {result}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{date} • {time}</div>
                 </div>
            </div>

            {/* Center: Mode */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="font-bold text-white text-sm">{mode === 'Ranked Match' ? 'Ranked' : (mode === 'Normal Match' ? 'Normal' : mode)}</span>
            </div>

            {/* Right: Scores & MMR */}
            <div className="flex items-center gap-6 justify-end flex-1">
                 {/* Scores */}
                 <div className="text-right">
                    {roundScores && roundScores.length > 0 ? (
                        <>
                            <div className="font-black text-xl text-white tracking-widest">{roundScores.join(' / ')}</div>
                            <div className="text-xs text-gray-400 font-bold">{avgScore}</div>
                        </>
                    ) : (
                        <div className="text-xl font-black text-white">{score}</div>
                    )}
                 </div>

                 {/* MMR Badge */}
                 {mode.includes('Ranked') && mmrChange !== undefined && (
                    <div className={`px-2 py-1 rounded-md font-bold text-xs ${mmrChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {mmrChange >= 0 ? '+' : ''}{mmrChange} MMR
                    </div>
                 )}
            </div>
        </div>
    );
};

const LeaderboardRow = ({ rank, name, mmr, isTop }: { rank: number, name: string | null, mmr: number | null, isTop: boolean }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isTop ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-white/5 border border-transparent'}`}>
    <div className="flex items-center gap-3">
      <span className={`w-6 text-center font-bold ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-500'}`}>{rank}</span>
      <div className="flex items-center gap-2">
        <RankBadge mmr={mmr} size="sm" showProgress={false} />
        <div>
          <div className="font-bold text-sm text-white">{name || "Unknown"}</div>
        </div>
      </div>
    </div>
    <div className="text-right">
       <div className="text-sm font-bold text-white">{mmr ?? 0}</div>
       <div className="text-[10px] text-gray-500 font-medium">MMR</div>
    </div>
  </div>
);

const FriendRow = ({ name, status, avatar }: { name: string, status: string, avatar: string }) => (
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
