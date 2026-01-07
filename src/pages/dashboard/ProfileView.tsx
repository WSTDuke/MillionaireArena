import { useState, useEffect, type ElementType } from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Trophy, Swords, Target, Zap,
  Share2, Edit3,
  Bookmark,
  Shield,
  Fingerprint,
  Mail,
  History,
  Copy,
  Check
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
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  mmr: number | null;
  description: string | null;
  email?: string;
}

interface ClanData {
  id: string;
  name: string;
  tag: string;
  icon: string;
  color: string;
}

interface MatchHistory {
  id: string;
  played_at: string;
  mode: string;
  result: string;
  score_user: number;
  score_opponent: number;
  round_scores?: number[];
  mmr_change?: number;
}

const ProfileView = ({ onEditProfile }: { onEditProfile?: () => void }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [clanInfo, setClanInfo] = useState<ClanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get('id');
  const [userStats, setUserStats] = useState({
      totalMatches: 0,
      totalWins: 0,
      recentMatches: [] as MatchHistory[]
  });
  const [copiedId, setCopiedId] = useState(false);

  const copyId = () => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Chiến binh';
  const fullName = profile?.full_name || user?.user_metadata?.full_name;
  
  const avatarSrc = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'fallback'}`;
  const userDescription = profile?.description || "Hệ thống: Chưa cập nhật tiểu sử quân đoàn.";
  const joinDate = user?.created_at ? new Date(user.created_at).getFullYear() : '2026';

  return (
    <div className={`pb-10 space-y-8 ${fadeInUp}`}>
      {/* --- HERO SECTION --- */}
      <div className="relative mb-24 lg:mb-32">
        {/* Cover Image */}
        <div className="h-64 lg:h-80 rounded-3xl overflow-hidden relative border border-white/5 scanline shadow-2xl">
          <img 
            src={profile?.cover_url || "https://images.unsplash.com/photo-1550745165-9bc0b252723f?q=80&w=2070&auto=format&fit=crop"} 
            className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-105 opacity-50 grayscale hover:grayscale-0"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>
          <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
          
          {/* Tech Ornaments */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20"></div>
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20"></div>
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 lg:-bottom-20 left-4 md:left-12 flex flex-col md:flex-row items-center md:items-end gap-8 w-[calc(100%-2rem)] md:w-[calc(100%-6rem)]">
          {/* Avatar Section */}
          <div className="relative group shrink-0">
             <div className="absolute -inset-4 bg-fuchsia-500/20 rounded-full blur-2xl group-hover:bg-fuchsia-500/40 transition-all"></div>
             <div className="w-36 h-36 lg:w-48 lg:h-48 rounded-full p-1.5 bg-neutral-950 shadow-2xl relative z-10">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 p-[3px]">
                   <img
                     src={avatarSrc}
                     alt="Avatar"
                     className="w-full h-full rounded-full object-cover border-8 border-neutral-950 shadow-inner"
                   />
                </div>
                {/* Tech Status Circle */}
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-neutral-950 p-1">
                   <div className="w-full h-full rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-2 border-neutral-950"></div>
                </div>
             </div>
          </div>

          {/* Text Info */}
          <div className="flex-1 flex flex-col items-center md:items-start pb-4">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                   {displayName}
                </h1>
                {fullName && fullName !== displayName && (
                  <span className="text-lg lg:text-2xl font-bold text-gray-500 opacity-60">
                     / {fullName}
                  </span>
                )}
             </div>

             <p className="text-gray-400 text-sm lg:text-base font-medium max-w-xl text-center md:text-left mb-6 leading-relaxed italic opacity-80">
                "{userDescription}"
             </p>

             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <Target size={14} className="text-cyan-400" /> Tham chiến: {joinDate}
                </div>
                <div 
                   style={{ color: rankInfo.color, borderColor: `${rankInfo.color}33`, backgroundColor: `${rankInfo.color}11` }}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-xl"
                >
                   <Bookmark size={14} /> {rankInfo.tier} {rankInfo.division}
                </div>
                {clanInfo && (
                  <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black text-white hover:border-fuchsia-500/30 transition-colors cursor-pointer">
                     <Shield size={14} style={{ color: clanInfo.color }} /> {clanInfo.tag}
                  </div>
                )}
             </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-4">
             <button className="w-12 h-12 lg:w-14 lg:h-13 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10  text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl">
                <Share2 size={20} />
             </button>
             
             {(!userIdFromQuery || (user && user.id === userIdFromQuery)) && (
               <Link to={`/dashboard/settings?userId=${profile?.id || user?.id}`}>
                 <button 
                   onClick={onEditProfile}
                   className="px-8 py-3 lg:py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-xs lg:text-sm  shadow-[0_0_30px_rgba(192,38,211,0.4)] hover:shadow-[0_0_50px_rgba(192,38,211,0.6)] flex items-center gap-3 transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em]"
                 >
                   <Edit3 size={20} /> Thiết lập
                 </button>
               </Link>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 px-4 md:px-0">
        
        {/* LEFT COLUMN: IDENTIFICATION & RANK */}
        <div className={`space-y-8 ${slideInLeft}`}>
           {/* Rank Terminal */}
           <div className="glass-panel border-white/5 rounded-3xl p-8 relative overflow-hidden tech-border">
              <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                 <Trophy size={120} />
              </div>
              
              <h3 className="text-xs font-black text-fuchsia-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <Zap size={14} /> Chỉ số đấu hạng
              </h3>
              
              <div className="flex flex-col items-center py-6 relative z-10">
                 <div className="relative group">
                    <div className="absolute -inset-8 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all"></div>
                    <RankBadge mmr={profile?.mmr ?? null} size="lg" />
                 </div>
                 
                 <div className="mt-8 text-center">
                    <div className="text-3xl font-black text-white uppercase tracking-tighter mb-1">
                       {rankInfo.tier === 'Unranked' ? 'CHƯA HẠNG' : `${rankInfo.tier} ${rankInfo.division}`}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                       <span className="text-fuchsia-400 font-black text-lg tabular-nums tracking-widest">{profile?.mmr ?? 0}</span>
                       <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest p-1 bg-white/5 rounded border border-white/5">MMR POINT</span>
                    </div>
                 </div>

                 {rankInfo.nextMMR && (
                    <div className="w-full mt-10 space-y-3">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <span>Tiến trình</span>
                          <span>{rankInfo.nextMMR} MMR</span>
                       </div>
                       <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <div 
                             className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 shadow-[0_0_10px_rgba(192,38,211,0.5)] transition-all duration-1000"
                             style={{ width: `${Math.min(100, ((profile?.mmr || 0) / rankInfo.nextMMR) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="glass-panel border-white/5 rounded-3xl p-8 tech-border relative overflow-hidden">
              <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
              <h3 className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Fingerprint size={14} /> Cơ sở dữ liệu
              </h3>
              
              <div className="space-y-5">
                 <DataField icon={Fingerprint} label="Mã định danh" value={profile?.id?.slice(0, 12).toUpperCase() + '...'} onCopy={copyId} copied={copiedId} />
                 <DataField icon={Mail} label="Địa chỉ Email" value={profile?.email || 'N/A'} color="text-indigo-400" />
                 <DataField icon={Shield} label="Quân đoàn" value={clanInfo ? `[${clanInfo.tag}] ${clanInfo.name}` : 'LANG THANG'} color={clanInfo ? 'text-fuchsia-400' : 'text-gray-600'} />
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: RECAP & HISTORY */}
        <div className={`xl:col-span-2 space-y-8 ${slideInRight}`}>
           {/* Performance Hub */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <HubStat icon={Swords} label="TỔNG SỐ TRẬN" value={userStats.totalMatches.toString()} color="cyan" />
              <HubStat 
                 icon={Trophy} 
                 label="TỶ LỆ THẮNG" 
                 value={`${userStats.totalMatches > 0 ? Math.round((userStats.totalWins / userStats.totalMatches) * 100) : 0}%`} 
                 color="green" 
              />
              <HubStat icon={Target} label="CHIẾN THẮNG" value={userStats.totalWins.toString()} color="fuchsia" />
              <HubStat 
                 icon={Zap} 
                 label="THẤT BẠI" 
                 value={(userStats.totalMatches - userStats.totalWins).toString()} 
                 color="red" 
              />
           </div>

           {/* Tactical History */}
           <div className="glass-panel border-white/5 rounded-3xl p-8 tech-border relative overflow-hidden flex-1 min-h-[500px]">
              <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <History size={14} className="text-fuchsia-500" /> Nhật ký tham chiến
              </h3>
              
              <div className="space-y-4">
                 {userStats.recentMatches.length > 0 ? (
                    userStats.recentMatches.map((match) => (
                       <EnhancedMatchRow 
                          key={match.id}
                          match={match}
                       />
                    ))
                 ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-600 space-y-4">
                       <History size={48} className="opacity-20 translate-y-2 mb-2" />
                       <div className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Chưa ghi nhận dữ liệu chiến đấu</div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

/* --- SUB COMPONENTS --- */

const DataField = ({ icon: Icon, label, value, color = "text-white", onCopy, copied }: { icon: ElementType, label: string, value: string, color?: string, onCopy?: () => void, copied?: boolean }) => (
   <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-cyan-400 transition-colors">
            <Icon size={14} />
         </div>
         <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</div>
      </div>
      <div className="flex items-center gap-2">
         <div className={`text-xs font-bold ${color} font-mono tracking-tight`}>{value}</div>
         {onCopy && (
            <button onClick={onCopy} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white transition-all">
               {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
         )}
      </div>
   </div>
);

const HubStat = ({ icon: Icon, label, value, color }: { icon: ElementType, label: string, value: string, color: string }) => {
   const colors: Record<string, string> = {
      cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]",
      green: "text-green-400 border-green-500/20 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
      fuchsia: "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5 shadow-[0_0_20px_rgba(192,38,211,0.1)]",
      red: "text-red-400 border-red-500/20 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
   };

   return (
      <div className={`glass-panel p-6 rounded-2xl tech-border relative overflow-hidden group hover:scale-105 transition-transform ${colors[color]}`}>
         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon size={40} />
         </div>
         <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</div>
         <div className="text-2xl lg:text-3xl font-black tracking-tighter">{value}</div>
      </div>
   );
};

const EnhancedMatchRow = ({ match }: { match: MatchHistory }) => {
   const isWin = match.result === 'Chiến thắng';
   const isDraw = match.result === 'Hòa';
   
   return (
      <div className="group relative bg-neutral-900/40 border border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all hover:bg-neutral-900/60 overflow-hidden">
         <div className={`absolute top-0 left-0 bottom-0 w-1 ${isWin ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : (isDraw ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]')}`}></div>
         
         <div className="flex items-center justify-between gap-4 relative z-10">
            {/* ID & Date */}
            <div className="min-w-[120px]">
               <div className={`text-base lg:text-lg font-black uppercase tracking-tight ${isWin ? 'text-green-500' : (isDraw ? 'text-yellow-500' : 'text-red-500')}`}>
                  {match.result?.toUpperCase()}
               </div>
               <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  {new Date(match.played_at).toLocaleDateString()}
               </div>
            </div>

            {/* Mode & Details */}
            <div className="flex-1 text-center">
               <div className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors">
                  {match.mode === 'Ranked Match' ? 'Xếp hạng' : 'Đấu thường'}
               </div>
            </div>

            {/* Score & MMR */}
            <div className="flex items-center gap-6 text-right">
               <div>
                  <div className="text-xl font-black text-white tabular-nums tracking-widest">
                     {match.score_user} <span className="text-gray-700 mx-1">:</span> {match.score_opponent}
                  </div>
                  {match.round_scores && match.round_scores.length > 0 && (
                     <div className="text-[10px] text-gray-500 font-bold tracking-[0.3em] mt-1 italic">
                        {match.round_scores.join(' / ')}
                     </div>
                  )}
               </div>

               {match.mode === 'Ranked Match' && match.mmr_change !== undefined && (
                  <div className={`min-w-[60px] text-center p-2 rounded-xl border ${match.mmr_change >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                     <div className="text-[8px] font-black uppercase tracking-tighter opacity-60 mb-0.5">MMR</div>
                     <div className="text-sm font-black tabular-nums">{match.mmr_change >= 0 ? '+' : ''}{match.mmr_change}</div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ProfileView;
