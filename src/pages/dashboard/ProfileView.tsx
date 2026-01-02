import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Trophy, Swords, Target, Clock, Zap, Medal, 
  Share2, Edit3, Calendar, Award,
  Bookmark
} from 'lucide-react';
import { ProfilePageSkeleton } from '../../components/LoadingSkeletons';

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  description?: string | null;
  display_name?: string | null;
  created_at?: string;
}

const ProfileView = ({ onEditProfile }: { onEditProfile?: () => void }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1. Lấy user auth
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // 2. Lấy thông tin chi tiết từ bảng profiles
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile fetch error:', profileError.message);
          }
          
          if (data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) return <ProfilePageSkeleton />;


  // Logic ưu tiên hiển thị: Profile DB -> User Metadata -> Email -> Default
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const fullName = profile?.full_name || user?.user_metadata?.full_name;
  
  const avatarSrc = profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
  const userDescription = profile?.description || "Chưa có giới thiệu bản thân.";
  const joinDate = user?.created_at ? new Date(user.created_at).getFullYear() : '2025';

  return (
    <div className="animate-fade-in-up pb-10">
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
        <div className="absolute -bottom-16 left-4 md:left-8 flex items-end gap-6 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)]">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-neutral-900">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 p-[2px]">
                <img 
                  src={avatarSrc} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-4 border-neutral-900" 
                />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gray-500 text-white px-2 py-0.5 rounded-full text-xs font-bold border-2 border-black shadow-lg">
              LVL 1
            </div>
          </div>

          {/* Text Info */}
          <div className="flex-1 mb-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-end gap-2 flex-wrap">
                  <span>{displayName}</span>
                  {fullName && fullName !== displayName && (
                    <span className="text-xl font-medium text-gray-400 pb-0.5">({fullName})</span>
                  )}
                  <Medal className="text-fuchsia-500 mb-1" size={24} />
                </h1>
                
                <div className="mt-2 space-y-1">
                    <p className="text-gray-300 text-sm max-w-lg line-clamp-2 italic">
                        {userDescription}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-gray-400 text-xs md:text-sm mt-2">
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                            <Calendar size={12} /> Gia nhập {joinDate}
                        </span>
                        <span className="text-gray-400 font-bold px-2 py-1 bg-white/5 rounded-md border border-white/10">
                            New Player
                        </span>
                    </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium flex items-center gap-2 transition-colors">
                  <Share2 size={18} /> <span className="hidden sm:inline">Chia sẻ</span>
                </button>
                
               <Link to="/dashboard/settings">
                <button 
                  onClick={onEditProfile}
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(192,38,211,0.3)] flex items-center gap-2 transition-colors"
                >
                  <Edit3 size={18} /> Chỉnh sửa
                </button>
              </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6">
        
        {/* LEFT COLUMN (Detailed Stats) */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Main Rank Card */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <Trophy className="text-yellow-500" size={20} /> Xếp hạng (Rank)
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-32 h-32 relative mb-4">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Bookmark size={64} className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(192,38,211,0.5)]" />
                 </div>
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-neutral-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path className="text-fuchsia-500" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                 </svg>
              </div>
              <div className="text-2xl font-bold text-white">Unranked</div>
              <div className="text-sm text-gray-400">0 MMR</div>
            </div>
          </div>


          {/* Information */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 text-white">Thông tin thêm</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>ID Người dùng</span>
                <span className="text-white font-mono text-xs">{user?.id?.slice(0,8)}...</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>Email</span>
                <span className="text-white truncate max-w-[150px]">{user?.email}</span>
              </li>
              <li className="flex justify-between">
                <span>Team</span>
                <span className="text-gray-500 italic">Chưa tham gia Clan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CENTER & RIGHT COLUMN (History & Achievements) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Overview Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MiniStatBox label="Tổng số trận đấu" value="0" icon={Swords} />
             <MiniStatBox label="Tỉ lệ thắng" value="0%" icon={Trophy} color="text-green-400" />
             <MiniStatBox label="Tỉ lệ thất bại" value="0" icon={Target} color="text-red-400" />
             <MiniStatBox label="Thời gian chơi" value="0h" icon={Clock} color="text-blue-400" />
          </div>

          {/* Achievements */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Award className="text-yellow-500" size={20} /> Thành tựu nổi bật
              </h3>
              <button className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Xem tất cả</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              <div className="text-center w-full py-4 text-gray-500 italic text-sm">Chưa có thành tựu...</div>
            </div>
          </div>

          {/* Match History */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
               <Zap className="text-fuchsia-500" size={20} /> Lịch sử đấu
            </h3>
            <div className="space-y-4">
              <div className="text-center py-10 text-gray-500 italic text-sm">Chưa có lịch sử đấu...</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


const MiniStatBox = ({ label, value, icon: Icon, color = "text-white" }: any) => (
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
