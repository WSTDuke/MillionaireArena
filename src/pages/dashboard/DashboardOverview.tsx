import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Swords, TrendingUp, Clock, Bookmark, Trophy } from 'lucide-react';
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

interface MatchData {
  id: string;
  mode: string;
  result: string;
  score_user: number;
  score_opponent: number;
  played_at: string;
  round_scores?: number[];
  mmr_change?: number;
}

interface DashboardCacheType {
  overviewTopUsers?: Profile[];
  [key: string]: unknown;
}

interface DashboardContext {
  user: { id: string } | null;
  profile: Profile | null;
  dashboardCache: DashboardCacheType;
  setDashboardCache: React.Dispatch<React.SetStateAction<DashboardCacheType>>;
}

const DashboardOverview = () => {
  const { dashboardCache, setDashboardCache, user, profile } = useOutletContext<DashboardContext>();
  const [loading, setLoading] = useState(true); // Always show loading on page visit
  const [topUsers, setTopUsers] = useState<Profile[]>(dashboardCache.overviewTopUsers || []);
  const [userStats, setUserStats] = useState({
      totalMatches: 0,
      totalWins: 0,
      currentMMR: 0,
      recentMatches: [] as MatchData[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          setDashboardCache((prev) => ({ ...prev, overviewTopUsers: data }));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [setDashboardCache, user]);

  const winRate = userStats.totalMatches > 0 ? Math.round((userStats.totalWins / userStats.totalMatches) * 100) : 0;
  const rankInfo = getRankFromMMR(userStats.currentMMR);

  if (loading) return <OverviewPageSkeleton />;

  return (
    <>
      {/* Welcome Section - Tech Hero */}
      <div className="mb-10 relative group">
        {/* Outer Tech Frame */}
        <div className="absolute inset-0 bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent"></div>
          {/* Cyber Scanline Loop */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="w-full h-[200%] bg-[linear-gradient(to_bottom,transparent_0,rgba(217,70,239,0.3)_50%,transparent_100%)] animate-scanline-fast" />
          </div>
        </div>
        
        <div className="relative z-10 p-10 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden">
          {/* Corner HUD decorations */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-fuchsia-500 opacity-20"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-20"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-20"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-fuchsia-500 opacity-20"></div>

          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
               <div className="h-[1px] w-8 bg-fuchsia-500/50"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-fuchsia-500">System Online</span>
               <div className="h-[1px] w-8 bg-fuchsia-500/50"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">
               Bắt đầu <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-purple-400">hành trình</span>
            </h1>
            <p className="text-gray-400 font-bold max-w-lg leading-relaxed text-sm">
              Chào mừng trở lại, <span className="text-white">{profile?.display_name || "Chiến binh"}</span>. Dữ liệu hệ thống đã sẵn sàng cho cuộc chinh phục tiếp theo của bạn.
            </p>
          </div>
          
          <div className="flex flex-col items-center">
             <div className="relative p-1">
                <div className="absolute inset-0 bg-fuchsia-500 blur-2xl opacity-20 animate-pulse"></div>
                <RankBadge mmr={userStats.currentMMR} size="lg" />
             </div>
             <span className="mt-4 tech-label text-fuchsia-400">{rankInfo.tier} {rankInfo.division}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
            icon={Bookmark} 
            label="Xếp hạng hiện tại" 
            value={`${rankInfo.tier} ${rankInfo.division}`} 
            subValue={`${userStats.currentMMR} MMR`} 
            color="text-yellow-400" 
        />
        <StatCard 
            icon={TrendingUp} 
            label="Tổng số trận" 
            value={`${userStats.totalMatches}`} 
            subValue="Đã chơi" 
            color="text-fuchsia-400" 
        />
        <StatCard 
            icon={Clock} 
            label="Số trận thắng" 
            value={`${userStats.totalWins}`} 
            subValue="Chiến thắng" 
            color="text-blue-400" 
        />
          <StatCard 
            icon={Swords} 
            label="Tỉ lệ thắng" 
            value={`${winRate}%`} 
            subValue={`${userStats.totalWins} trận thắng`} 
            color="text-green-400" 
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
          <div className="glass-panel rounded-2xl p-6 tech-border relative overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight relative z-10">
              <Trophy className="text-yellow-500 w-5 h-5 shadow-[0_0_10px_rgba(234,179,8,0.5)]" /> 
              Bảng vàng Top 5
            </h3>
            <div className="space-y-4 relative z-10">
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
            <Link to="/dashboard/ranking" className="relative z-10 block">
              <button className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/5 rounded-xl hover:bg-white/5 hover:text-white transition-all">
                Xem bảng xếp hạng đầy đủ
              </button>
            </Link>
          </div>


        </div>
      </div>
    </>
  );
};

const StatCard = ({ icon: Icon, label, value, subValue, color }: { icon: React.ElementType, label: string, value: string, subValue: string, color: string }) => (
  <div className="tech-card p-6 group cursor-default transition-all duration-300 hover:border-fuchsia-500/30">
    {/* Tech Notch Clip */}
    <div className="absolute top-0 right-0 w-8 h-8 opacity-20">
       <div className="absolute top-0 right-0 w-full h-[1px] bg-fuchsia-500"></div>
       <div className="absolute top-0 right-0 w-[1px] h-full bg-fuchsia-500"></div>
    </div>

    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center mb-6 shadow-inner ${color}`}>
        <Icon size={22} className="group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="tech-label mb-2">{label}</div>
      <div className="tech-value text-3xl mb-1 italic uppercase tracking-tighter">{value}</div>
      <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${value.includes('-') || subValue.includes('0') ? 'text-gray-600' : 'text-fuchsia-400'}`}>
        <div className="w-1 h-1 rounded-full bg-current opacity-50"></div>
        {subValue}
      </div>
    </div>
    
    {/* Interactive Background Shimmer */}
    <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/0 via-fuchsia-500/0 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
    const isWin = result === 'Chiến thắng';
    const isDraw = result === 'Hòa';

    return (
        <div className="group relative">
            <div className={`flex items-center justify-between p-4 bg-neutral-900/40 border-l-2 transition-all hover:bg-neutral-800/60 overflow-hidden ${isWin ? 'border-green-500/50' : (isDraw ? 'border-yellow-500/50' : 'border-red-500/50')}`}>
                {/* HUD Ornaments */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-6 min-w-[200px] relative z-10">
                     <div className="flex flex-col">
                        <div className={`font-black text-xs uppercase tracking-[0.2em] ${isWin ? 'text-green-400' : (isDraw ? 'text-yellow-400' : 'text-red-400')}`}>
                            {result}
                        </div>
                        <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1 opacity-70">
                          {date} <span className="text-gray-800">/</span> {time}
                        </div>
                     </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className={`px-3 py-1 bg-black/40 border rounded text-[9px] font-black uppercase tracking-[0.2em] ${mode.includes('Ranked') ? 'border-fuchsia-500/30 text-fuchsia-400' : 'border-blue-500/30 text-blue-400'}`}>
                        {mode.replace(' Match', '')}
                    </div>
                </div>

                <div className="flex items-center gap-10 justify-end flex-1 relative z-10">
                     <div className="text-right">
                        <div className="font-black text-2xl text-white tracking-tighter tabular-nums italic">{score}</div>
                        {roundScores && roundScores.length > 0 && (
                            <div className="text-[8px] text-gray-600 font-black tracking-[0.3em] uppercase mt-1">
                                SEGMENTS: {roundScores.join(' ')}
                            </div>
                        )}
                     </div>

                     {mode.includes('Ranked') && mmrChange !== undefined && (
                        <div className={`w-14 h-14 flex flex-col items-center justify-center border font-black relative overflow-hidden ${mmrChange >= 0 ? 'border-green-500/20 text-green-400' : 'border-red-500/20 text-red-400'}`}>
                            <div className="absolute inset-0 bg-current opacity-5" />
                            <span className="text-[8px] opacity-40 mb-0.5">MMR</span>
                            <span className="text-sm">{mmrChange >= 0 ? '+' : ''}{mmrChange}</span>
                        </div>
                     )}
                </div>

                {/* Cyber Scanline Loop (Hover Only) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-5 transition-opacity">
                    <div className="w-full h-[200%] bg-[linear-gradient(to_bottom,transparent_0,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-scanline-fast" />
                </div>
            </div>
        </div>
    );
};

const LeaderboardRow = ({ rank, name, mmr, isTop }: { rank: number, name: string | null, mmr: number | null, isTop: boolean }) => (
  <div className={`flex items-center justify-between p-3 transition-all relative group ${isTop ? 'bg-fuchsia-500/5 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.05)]' : 'hover:bg-white/5 border border-transparent'}`}>
    {isTop && <div className="absolute left-0 top-0 w-1 h-full bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />}
    
    <div className="flex items-center gap-4 relative z-10">
      <span className={`w-6 text-center font-black text-[10px] tracking-tighter ${rank === 1 ? 'text-fuchsia-400 text-sm' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`}>
        #{rank}
      </span>
      <div className="flex items-center gap-3">
        <div className="relative group-hover:scale-110 transition-transform">
          <div className={`p-0.5 rounded-lg border shadow-lg ${isTop ? 'border-fuchsia-500/30 bg-fuchsia-500/10' : 'border-white/5 bg-neutral-800'}`}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} className="w-9 h-9 rounded-md object-cover" alt={name || ""} />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 grayscale group-hover:grayscale-0 transition-all">
             <RankBadge mmr={mmr} size="sm" showProgress={false} />
          </div>
        </div>
        <div>
          <div className="font-black text-[11px] text-white uppercase tracking-tight">{name || "Unknown"}</div>
          <div className="text-[9px] text-fuchsia-500/60 font-black uppercase tracking-widest">{mmr ?? 0} MMR</div>
        </div>
      </div>
    </div>
    
    <div className={`w-1.5 h-1.5 rounded-sm rotate-45 border ${isTop ? 'border-fuchsia-500 bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' : 'border-white/10'}`}></div>
  </div>
);


export default DashboardOverview;
