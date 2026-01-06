import { useState, useEffect, type ElementType } from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Trophy, Swords, Target, Zap, Medal, 
  Share2, Edit3,
  Bookmark,
  Users,
  Shield,
  Fingerprint,
  Mail,
  History
} from 'lucide-react';
import { ProfilePageSkeleton } from '../../components/LoadingSkeletons';
import { getRankFromMMR } from '../../lib/ranking';
import RankBadge from '../../components/shared/RankBadge';

// Premium entry animations
const fadeInUp = "animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both ease-out";
const slideInLeft = "animate-in fade-in slide-in-from-left-8 duration-1000 delay-300 fill-mode-both ease-out";
const slideInRight = "animate-in fade-in slide-in-from-right-8 duration-1000 delay-500 fill-mode-both ease-out";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  description?: string | null;
  display_name?: string | null;
  created_at?: string;
  mmr?: number | null;
}

interface ClanData {
  id: string;
  name: string;
  tag: string;
  icon: string;
  color: string;
}

const ProfileView = ({ onEditProfile }: { onEditProfile?: () => void }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [clanInfo, setClanInfo] = useState<ClanData | null>(null);
  const [loading, setLoading] = useState(true); // Always show loading on page visit
  const [searchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get('id');
  const [userStats, setUserStats] = useState({
      totalMatches: 0,
      totalWins: 0,
      recentMatches: [] as any[]
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const targetUserId = userIdFromQuery || (await supabase.auth.getUser()).data.user?.id;
        
        if (targetUserId) {
          // Fetch profile for targetUserId
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile fetch error:', profileError.message);
          }
          
          if (data) {
            setProfile(data);
            
            // Fetch Clan Info
            const { data: clanMember, error: cmError } = await supabase
              .from('clan_members')
              .select(`
                clan_id,
                clans (
                  id,
                  name,
                  tag,
                  icon,
                  color
                )
              `)
              .eq('user_id', targetUserId)
              .eq('status', 'approved')
              .maybeSingle();

            if (!cmError && clanMember && clanMember.clans) {
              const clanRaw = clanMember.clans as unknown as ClanData;
              setClanInfo(clanRaw);
            } else {
              setClanInfo(null);
            }
          }

          // If viewing our own profile, set user as well for email/etc
          const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser?.id === targetUserId) {
              setUser(currentUser);
            }

             // Fetch Stats (Matches & Wins) for the target user
             const [matchesRes, winsRes, historyRes] = await Promise.all([
                 supabase.from('game_history').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
                 supabase.from('game_history').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId).eq('result', 'Chiến thắng'),
                 supabase.from('game_history').select('*').eq('user_id', targetUserId).order('played_at', { ascending: false }).limit(10)
             ]);

             setUserStats({
                 totalMatches: matchesRes.count || 0,
                 totalWins: winsRes.count || 0,
                 recentMatches: historyRes.data || []
             });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userIdFromQuery]);

  if (loading) return <ProfilePageSkeleton />;
  
  const rankInfo = getRankFromMMR(profile?.mmr ?? null);
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const fullName = profile?.full_name || user?.user_metadata?.full_name;
  
  const avatarSrc = profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
  const userDescription = profile?.description || "Chưa có giới thiệu bản thân.";
  const joinDate = user?.created_at ? new Date(user.created_at).getFullYear() : '2025';

  return (
    <div className={`pb-10 ${fadeInUp}`}>
      {/* --- HERO SECTION --- */}
      <div className="relative mb-24">
        {/* Cover Image */}
        <div className="h-64 rounded-2xl overflow-hidden relative border border-white/5">
          <img 
            src={profile?.cover_url || "https://images.unsplash.com/photo-1550745165-9bc0b252723f?q=80&w=2070&auto=format&fit=crop"} 
            className="w-full h-full object-cover"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 left-4 md:left-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)]">
          {/* Avatar and Text Info Group */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 shrink-0">
            {/* Avatar Section */}
            <div className="relative mb-6 md:mb-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-neutral-950 shadow-2xl">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 p-[2px]">
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-neutral-950"
                  />
                </div>
              </div>
            </div>

            {/* Text Info */}
            <div className={`flex flex-col items-center md:items-start mb-2 ${fadeInUp}`}>
              <h1 className="text-3xl md:text-5xl font-black text-white flex items-end gap-3 flex-wrap drop-shadow-lg">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {displayName}
                </span>
                {fullName && fullName !== displayName && (
                  <span className="text-xl md:text-2xl font-medium text-gray-500 pb-1">({fullName})</span>
                )}
                <Medal className="text-fuchsia-500 mb-2 animate-bounce-slow" size={28} />
              </h1>
              
              <p className="text-gray-300 text-sm md:text-base font-medium leading-relaxed italic opacity-80 mt-1 mb-4">
                "{userDescription}"
              </p>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold text-gray-400">
                  <Users size={14} className="text-blue-400" /> Gia nhập {joinDate}
                </span>
                <span 
                  style={{ color: rankInfo.color, borderColor: `${rankInfo.color}33`, backgroundColor: `${rankInfo.color}11` }} 
                  className="font-black px-3 py-1.5 rounded-xl border text-[10px] md:text-xs uppercase tracking-widest shadow-lg"
                >
                  {rankInfo.tier} {rankInfo.division}
                </span>
                {clanInfo && (
                  <span className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black text-white">
                    <Shield size={14} style={{ color: clanInfo.color }} /> {clanInfo.tag}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex gap-3 mb-2">
            <button className="px-5 py-2.5 bg-neutral-950/50 hover:bg-neutral-900/80 border border-white/10 rounded-2xl text-white font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-md">
              <Share2 size={18} /> <span className="hidden sm:inline uppercase tracking-widest">Chia sẻ</span>
            </button>
            
            {(!userIdFromQuery || (user && user.id === userIdFromQuery)) && (
              <Link to={`/dashboard/settings?userId=${profile?.id || user?.id}`}>
                <button 
                  onClick={onEditProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                >
                  <Edit3 size={18} /> Chỉnh sửa
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6">
        
        {/* LEFT COLUMN (Detailed Stats) */}
        <div className={`xl:col-span-1 space-y-8 ${slideInLeft}`}>
          
          {/* Main Rank Card */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <Bookmark className="text-yellow-500" size={20} /> Xếp hạng (Rank)
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4">
              <RankBadge mmr={profile?.mmr ?? null} size="lg" />
              <div className="text-2xl font-bold text-white uppercase tracking-wider mt-4">
                {rankInfo.tier} {rankInfo.division}
              </div>
              <div className="text-sm font-black text-gray-400">
                {rankInfo.mmr} <span className="text-[10px] opacity-50">MMR</span>
              </div>
              {rankInfo.nextMMR && (
                <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Mốc tiếp theo: {rankInfo.nextMMR} MMR
                </div>
              )}
            </div>
          </div>


          {/* Information */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 text-white">Thông tin thêm</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 font-bold"><Fingerprint size={14} className="text-gray-500" /> ID</span>
                <span className="text-white font-mono text-[10px]">{user?.id?.slice(0,18)}...</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 font-bold"><Mail size={14} className="text-indigo-400" /> Email</span>
                <span className="text-white truncate max-w-[150px]">{user?.email}</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 font-bold"><Bookmark size={14} className="text-yellow-500" /> MMR</span>
                <span className="text-white font-black">{profile?.mmr ?? 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="flex items-center gap-2"><Shield size={14} className="text-green-400" /> Clan</span>
                {clanInfo ? (
                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/10">
                    <span className="text-white font-bold">{clanInfo.name}</span>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-500/20">{clanInfo.tag}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 italic">Chưa gia nhập Clan</span>
                )}
              </li>
            </ul>
          </div>
        </div>

       {/* CENTER & RIGHT COLUMN (History & Achievements) */}
        <div className={`xl:col-span-2 space-y-8 ${slideInRight}`}>
          
          {/* Overview Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MiniStatBox label="Tổng số trận đấu" value={`${userStats.totalMatches}`} icon={Swords} />
             <MiniStatBox 
                label="Tỉ lệ thắng" 
                value={`${userStats.totalMatches > 0 ? Math.round((userStats.totalWins / userStats.totalMatches) * 100) : 0}%`} 
                icon={Trophy} 
                color="text-green-400" 
             />
             <MiniStatBox 
                label="Số trận thắng" 
                value={`${userStats.totalWins}`} 
                icon={Target} 
                color="text-blue-400" 
             />
             <MiniStatBox 
                label="Số trận thua" 
                value={`${userStats.totalMatches - userStats.totalWins}`} 
                icon={Zap} 
                color="text-red-400" 
             />
          </div>


          {/* Match History */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
               <History className="text-fuchsia-500" size={20} /> Lịch sử đấu
            </h3>
            <div className="space-y-4">
              {userStats.recentMatches.length > 0 ? (
                  userStats.recentMatches.map((match) => (
                      <MatchRow 
                        key={match.id}
                        mode={match.mode || (match.mode === 'Ranked' ? 'Ranked Match' : 'Normal Match')} 
                        result={match.result || 'Hòa'} 
                        score={`${match.score_user} - ${match.score_opponent}`} 
                        time={new Date(match.played_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        date={new Date(match.played_at).toLocaleDateString()}
                        roundScores={match.round_scores}
                        mmrChange={match.mode === 'Ranked' ? match.mmr_change : undefined}
                      />
                  ))
              ) : (
                  <div className="text-center py-10 text-gray-500 italic text-sm">Chưa có lịch sử đấu...</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


const MatchRow = ({ mode, result, score, time, date, roundScores, mmrChange }: { 
    mode: string, 
    result: string, 
    score: string, 
    time: string, 
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

interface MiniStatBoxProps {
  label: string;
  value: string;
  icon: ElementType; // Lucide icon type
  color?: string;
}

const MiniStatBox = ({ label, value, icon: Icon, color = "text-white" }: MiniStatBoxProps) => (
  <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
    <div className={`p-3 rounded-lg bg-white/5 ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  </div>
);


export default ProfileView;
