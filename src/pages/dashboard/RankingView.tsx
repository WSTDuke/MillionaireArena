import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy, Medal, Search, Crown, Shield, Bookmark } from "lucide-react";
import { RankingPageSkeleton } from "../../components/LoadingSkeletons";

interface ProfileData {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  // Mock fields for UI demonstration since they don't exist in DB yet
  rank_score?: number;
  tier?: string;
}

const RankingView = () => {
  const [leaderboard, setLeaderboard] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, display_name, avatar_url, created_at")
          .limit(50); // Fetch top 50 users

        if (error) throw error;

        // Simulate ranking data since it's missing in DB
        // In a real app, we would order by 'rank_score' desc in the query
        const enrichedData = (data || []).map((user: any) => ({
          ...user,
          rank_score: Math.floor(Math.random() * 5000), // Random score for demo
          tier: "Challenger", // Placeholder
        })).sort((a: any, b: any) => b.rank_score - a.rank_score);

        setLeaderboard(enrichedData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter((user) => {
    const name = user.display_name || user.full_name || "User";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const TopThree = filteredLeaderboard.slice(0, 3);
  const RestList = filteredLeaderboard.slice(3);

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

      {/* Podium Section (Top 3) */}
      {TopThree.length > 0 && !searchTerm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center py-10 px-4 md:px-20 relative">
          {/* Rank 2 */}
          {TopThree[1] && <PodiumCard user={TopThree[1]} rank={2} />}
          
          {/* Rank 1 */}
          {TopThree[0] && <PodiumCard user={TopThree[0]} rank={1} />}
          
          {/* Rank 3 */}
          {TopThree[2] && <PodiumCard user={TopThree[2]} rank={3} />}
          
          {/* Background Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-fuchsia-600/20 blur-[100px] pointer-events-none"></div>
        </div>
      )}

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
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right hidden sm:table-cell">Clan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(searchTerm ? filteredLeaderboard : RestList).map((user, index) => {
                 const actualRank = searchTerm ? index + 1 : index + 4;
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
                          <div className="text-xs text-gray-500">@{user.display_name || "user"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-fuchsia-400 font-bold">
                       {user.rank_score?.toLocaleString()}
                    </td>
                    <td className="p-4 text-center hidden md:table-cell">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                           {user.tier}
                        </span>
                    </td>
                    <td className="p-4 text-right text-gray-500 text-sm hidden sm:table-cell">
                       {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                 );
              })}
              
              {filteredLeaderboard.length === 0 && (
                 <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                       Không tìm thấy người chơi nào.
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

// Sub-component for Top 3
const PodiumCard = ({ user, rank }: { user: ProfileData, rank: number }) => {
  const isFirst = rank === 1;
  
  return (
    <div className={`flex flex-col items-center ${isFirst ? "-mt-10 order-2 md:order-2" : "order-1 md:order-none"}`}>
       {/* Crown for #1 */}
       {isFirst && <Crown size={40} className="text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce" />}
       
       <div className="relative group">
          <div className={`
             rounded-full p-1 bg-gradient-to-tr 
             ${isFirst ? "from-yellow-400 to-orange-500 w-28 h-28" : 
               rank === 2 ? "from-gray-300 to-gray-500 w-24 h-24" : 
               "from-orange-700 to-amber-900 w-24 h-24"}
             shadow-xl relative z-10
          `}>
             <img 
               src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
               alt="Avatar" 
               className="w-full h-full rounded-full object-cover border-4 border-black" 
             />
             
             {/* Rank Badge */}
             <div className={`
               absolute -bottom-3 left-1/2 -translate-x-1/2 
               w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-black text-white
               ${isFirst ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : "bg-amber-700"}
             `}>
               {rank}
             </div>
          </div>
          
          {/* Decorative Ring for #1 */}
          {isFirst && (
             <div className="absolute inset-0 rounded-full border border-yellow-500/30 scale-125 animate-pulse"></div>
          )}
       </div>

       <div className={`mt-6 text-center ${isFirst ? "mb-6" : "mb-2"}`}>
          <h3 className="text-white font-bold truncate max-w-[150px]">
             {user.display_name || user.full_name || "User"}
          </h3>
          <div className="text-fuchsia-400 font-mono font-bold text-lg">
             {user.rank_score?.toLocaleString()} MMR
          </div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
             Challenger
          </div>
       </div>

       {/* Podium Base */}
       <div className={`
          w-full rounded-t-lg bg-gradient-to-b from-neutral-800 to-neutral-900/50 border-t border-x border-white/5
          flex flex-col items-center justify-end pb-4
          ${isFirst ? "h-40" : rank === 2 ? "h-28" : "h-20"}
       `}>
          <div className="text-4xl font-bold text-white/5 pointer-events-none select-none">{rank}</div>
       </div>
    </div>
  );
};

export default RankingView;