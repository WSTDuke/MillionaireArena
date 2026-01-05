import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Search, Crown, Bookmark } from "lucide-react";
import { RankingPageSkeleton } from "../../components/LoadingSkeletons";
import { getRankFromMMR } from "../../lib/ranking";

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
}

const RankingView = () => {
  const { dashboardCache, setDashboardCache } = useOutletContext<any>();
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
        const enrichedData = (data || []).map((user) => {
          const rankInfo = getRankFromMMR(user.mmr);
          return {
            ...user,
            rank_score: user.mmr ?? 0,
            tier: rankInfo.tier === 'Unranked' ? 'Chưa hạng' : `${rankInfo.tier} ${rankInfo.division}`,
            rank_color: rankInfo.color
          };
        });

        setLeaderboard(enrichedData);
        setDashboardCache((prev: any) => ({ ...prev, rankingData: enrichedData }));
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
    <div className="animate-fade-in-up space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bookmark className="text-fuchsia-500" size={32} />
            Bảng Xếp Hạng
          </h1>
          <p className="text-gray-400 mt-2">
            Vinh danh những chiến binh mạnh mẽ nhất đấu trường
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
           </div>
           <input
             type="text"
             className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-neutral-900/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-neutral-900 focus:border-fuchsia-500/50 sm:text-sm transition-colors"
             placeholder="Tìm kiếm người chơi..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Leaderboard List */}
       <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-20 text-center">Hạng</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Người chơi</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center hidden md:table-cell">Rank</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Điểm MMR</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right hidden sm:table-cell">Ngày cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaderboard.map((user, index) => {
                 const actualRank = index + 1;
                 
                 return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-center">
                       <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                         actualRank <= 3 ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50" : "text-gray-500 bg-white/5"
                       }`}>
                         {actualRank}
                       </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 p-[1px] ring-offset-2 ring-offset-black group-hover:ring-2 ring-fuchsia-600/50 transition-all">
                           <img 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                              alt="Avatar" 
                              className="w-full h-full rounded-full object-cover" 
                           />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                             {user.display_name || user.full_name || "Unknown Warrior"}
                          </div>
                          <div className="text-xs text-gray-500">@{user.display_name?.toLowerCase().replace(/\s+/g, '') || "user"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center hidden md:table-cell">
                        <span className="px-2 py-1 rounded text-xs font-medium border" style={{ backgroundColor: `${user.rank_color}1a`, color: user.rank_color, borderColor: `${user.rank_color}33` }}>
                           {user.tier}
                        </span>
                    </td>
                    <td className="p-4 text-right font-mono text-fuchsia-400 font-bold">
                       {user.rank_score?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-gray-500 text-sm hidden sm:table-cell">
                       {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                 );
              })}
              
              {filteredLeaderboard.length === 0 && (
                 <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                       Không có chiến binh nào được xếp hạng.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RankingView;
