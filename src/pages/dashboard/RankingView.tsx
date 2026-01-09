import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Search, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { RankingPageSkeleton } from "../../components/LoadingSkeletons";
import { getRankFromMMR } from "../../lib/ranking";
import RankBadge from "../../components/shared/RankBadge";

interface ProfileData {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at?: string;
  mmr: number | null;
  rank_score?: number;
  tier?: string;
  rank_color?: string;
  rank?: number;
}

interface DashboardContext {
  dashboardCache: {
    rankingData?: ProfileData[];
    [key: string]: unknown;
  };
  setDashboardCache: React.Dispatch<React.SetStateAction<DashboardContext['dashboardCache']>>;
}

const RankingView = () => {
  const { dashboardCache, setDashboardCache } = useOutletContext<DashboardContext>();
  const [leaderboard, setLeaderboard] = useState<ProfileData[]>(dashboardCache.rankingData || []);
  const [loading, setLoading] = useState(!dashboardCache.rankingData);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, display_name, avatar_url, updated_at, mmr")
          .order('mmr', { ascending: false, nullsFirst: false });

        if (error) throw error;

        // Process data with getRankFromMMR
        const enrichedData = (data || []).map((user, index) => {
          const rankInfo = getRankFromMMR(user.mmr);
          return {
            ...user,
            rank: index + 1,
            rank_score: user.mmr ?? 0,
            tier: rankInfo.tier === 'Unranked' ? 'Chưa hạng' : `${rankInfo.tier} ${rankInfo.division}`,
            rank_color: rankInfo.color
          };
        });

        setLeaderboard(enrichedData);
        setDashboardCache((prev) => ({ ...prev, rankingData: enrichedData }));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setDashboardCache]);

  const filteredLeaderboard = leaderboard.filter((user) => {
    const name = user.display_name || user.full_name || "User";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && user.mmr !== null; // Exclude unranked players
  });

  if (loading) {
    return <RankingPageSkeleton />;
  }

  return (
    <div className="animate-fade-in-up space-y-10 pb-10">
      {/* Header - Tech Sector Style */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 relative">
        <div className="relative z-10 w-full md:w-auto">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4 rounded-sm">
              <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">Competitive Sector // Rankings</span>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
             Bảng Xếp <span className="text-fuchsia-500">Hạng</span>
           </h1>
           <div className="h-0.5 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mt-2"></div>
           <p className="text-gray-500 mt-4 font-bold max-w-lg text-sm leading-relaxed">
             Vinh danh những <span className="text-gray-300">chiến binh mạnh mẽ nhất</span> trong hệ thống đấu trường.
           </p>
        </div>
        
        {/* Search - Tech Style */}
        <div className="relative w-full md:w-80">
           <div className="flex items-center bg-black border border-white/10 px-6 py-3 focus-within:border-fuchsia-500/50 transition-all relative">
              <Search size={20} className="text-fuchsia-500" />
              <input
                type="text"
                className="bg-transparent border-none outline-none text-[11px] font-black tracking-[0.2em] ml-4 w-full text-white placeholder-gray-700 uppercase"
                placeholder="QUÉT TÌM CHIẾN BINH [DATABASE]..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fuchsia-500/30" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fuchsia-500/30" />
           </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {!searchTerm && (
      <div className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        {/* Number 2 */}
        {filteredLeaderboard[1] && (
          <div className="md:col-start-1 md:col-end-2 order-2 md:order-1 h-[220px] glass-panel rounded-3xl tech-border p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-gray-500/10 rounded-full blur-2xl"></div>
            <div className="relative mb-4">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${filteredLeaderboard[1].display_name}`} className="w-20 h-20 rounded-2xl border-2 border-gray-400/50 shadow-xl grayscale group-hover:grayscale-0 transition-all" alt="" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center border-2 border-black font-black text-black">2</div>
            </div>
            <div className="text-center">
              <div className="font-black text-white uppercase tracking-tight truncate w-32">{filteredLeaderboard[1].display_name}</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{filteredLeaderboard[1].mmr} MMR</div>
            </div>
          </div>
        )}

        {/* Number 1 */}
        {filteredLeaderboard[0] && (
          <div className="md:col-start-2 md:col-end-4 order-1 md:order-2 h-[280px] glass-panel rounded-3xl tech-border p-8 flex flex-col items-center justify-center relative overflow-hidden group border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
            <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
            <Trophy className="absolute top-4 right-4 text-yellow-500/20 w-16 h-16 -rotate-12" />
            
            <div className="relative mb-6 scale-110">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${filteredLeaderboard[0].display_name}`} className="w-24 h-24 rounded-3xl border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-transform group-hover:scale-110" alt="" />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center border-2 border-black font-black text-black shadow-lg">1</div>
            </div>
            <div className="text-center">
              <div className="font-black text-xl text-white uppercase tracking-tight mb-1">{filteredLeaderboard[0].display_name}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                 <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">{filteredLeaderboard[0].mmr} MMR</span>
              </div>
            </div>
          </div>
        )}

        {/* Number 3 */}
        {filteredLeaderboard[2] && (
          <div className="md:col-start-4 md:col-end-5 order-3 h-[200px] glass-panel rounded-3xl tech-border p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-700/10 rounded-full blur-2xl"></div>
            <div className="relative mb-4">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${filteredLeaderboard[2].display_name}`} className="w-16 h-16 rounded-2xl border-2 border-amber-700/50 shadow-xl grayscale group-hover:grayscale-0 transition-all" alt="" />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-700 rounded-lg flex items-center justify-center border-2 border-black font-black text-black">3</div>
            </div>
            <div className="text-center">
              <div className="font-black text-white uppercase tracking-tight truncate w-32">{filteredLeaderboard[2].display_name}</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{filteredLeaderboard[2].mmr} MMR</div>
            </div>
          </div>
        )}
      </div>
      )}

      <div className="relative bg-neutral-950 border border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
        
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-5 border-b border-white/5 bg-neutral-900/40">
          <div className="col-span-1 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">RANK</div>
          <div className="col-span-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">WARRIOR</div>
          <div className="col-span-3 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">MMR / TIER</div>
          <div className="col-span-3 text-right text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">ACTIONS</div>
        </div>
        
        <div className="divide-y divide-white/5 relative">
          {filteredLeaderboard.map((user) => (
            <LeaderboardRow 
              key={user.id} 
              rank={user.rank || 0} 
              name={user.display_name} 
              mmr={user.mmr} 
              userId={user.id}
              tier={user.tier}
            />
          ))}
          {filteredLeaderboard.length === 0 && (
             <div className="p-12 text-center">
                <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">// NO RECORDS FOUND</div>
                <div className="text-sm font-bold text-gray-600 italic">Không tìm thấy chiến binh nào trong hệ thống.</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardRow = ({ rank, name, mmr, userId, tier }: { rank: number, name: string | null, mmr: number | null, userId: string, tier?: string }) => {
  return (
    <div className={`grid grid-cols-12 gap-6 px-8 py-6 items-center hover:bg-fuchsia-500/5 transition-all group relative overflow-hidden ${rank <= 3 ? 'bg-white/[0.02]' : ''}`}>
       {/* Left accent bar for top 3 */}
       {rank <= 3 && (
         <div className={`absolute left-0 top-0 bottom-0 w-1 ${rank === 1 ? 'bg-yellow-500' : (rank === 2 ? 'bg-gray-400' : 'bg-amber-700')}`}></div>
       )}
       
       {/* Rank */}
       <div className="col-span-12 md:col-span-1">
          <span className={`font-black tracking-tighter tabular-nums ${rank === 1 ? 'text-yellow-500 text-2xl' : rank === 2 ? 'text-gray-400 text-xl' : rank === 3 ? 'text-amber-700 text-xl' : 'text-gray-600 text-lg'}`}>
            {rank < 10 ? `0${rank}` : rank}
          </span>
       </div>

       {/* Warrior Info */}
       <div className="col-span-12 md:col-span-5 flex items-center gap-4">
          <div className="relative">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
              className="w-14 h-14 bg-black border border-white/10 grayscale group-hover:grayscale-0 transition-all" 
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              alt="" 
            />
            <div className="absolute -bottom-1 -right-1">
                 <RankBadge mmr={mmr} size="sm" showProgress={false} />
            </div>
          </div>
          <div>
            <div className="font-black text-white uppercase tracking-tight text-lg group-hover:text-fuchsia-400 transition-colors">{name || "Unknown"}</div>
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">CHIẾN BINH ARENA</div>
          </div>
       </div>

       {/* MMR / Tier */}
       <div className="col-span-12 md:col-span-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-black text-white tabular-nums text-xl tracking-tighter">{mmr ?? 0}</span>
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">MMR</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{tier}</span>
          </div>
       </div>

       {/* Actions */}
       <div className="col-span-12 md:col-span-3 text-right">
          <Link to={`/dashboard/profile?userId=${userId}`}>
            <button 
              className="w-full md:w-auto px-8 py-3 bg-white/5 border border-white/10 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10 hover:text-fuchsia-400 transition-all text-[10px] font-black uppercase tracking-[0.2em] active:scale-95"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
                XEM HỒ SƠ
            </button>
          </Link>
       </div>
    </div>
  );
};


export default RankingView;
