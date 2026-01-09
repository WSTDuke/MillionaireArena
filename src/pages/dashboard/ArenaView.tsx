import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { supabase } from "../../lib/supabase";
import { Swords, Trophy, Users, Zap, Play, Lock, Shield, X, Loader2, Bookmark } from 'lucide-react';
import { ArenaPageSkeleton } from '../../components/LoadingSkeletons';
import { getRankFromMMR } from '../../lib/ranking';

interface Participant {
    id: string;
    display_name: string;
    avatar_url: string;
    is_ready: boolean;
    is_host: boolean;
}

interface RoomData {
    id: string;
    name: string;
    code: string;
    participants: Participant[];
    settings: {
        format: string;
        questions_per_round: number;
    };
    status: string;
    mode: string;
}

interface DashboardContext {
  dashboardCache: {
    arenaRooms?: RoomData[];
    arenaProfile?: { mmr: number | null };
    [key: string]: unknown;
  };
  setDashboardCache: React.Dispatch<React.SetStateAction<any>>;
}

const ArenaView = () => {
  const navigate = useNavigate();
  const { dashboardCache, setDashboardCache } = useOutletContext<DashboardContext>();
  const [loading, setLoading] = useState(!dashboardCache.arenaRooms || !dashboardCache.arenaProfile);
  const [profile, setProfile] = useState<{ mmr: number | null } | null>(dashboardCache.arenaProfile || null);
  const [loadingRooms, setLoadingRooms] = useState(!dashboardCache.arenaRooms);
  const [roomsList, setRoomsList] = useState<RoomData[]>(dashboardCache.arenaRooms || []);
  const [joinCode, setJoinCode] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
      name: "",
      max_rounds: 3,
      questions: 10
  });
  const [creating, setCreating] = useState(false);
  const [alertModal, setAlertModal] = useState<{
      show: boolean;
      title: string;
      message: string;
      type: 'error' | 'warning' | 'info';
  }>({
      show: false,
      title: "",
      message: "",
      type: 'info'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('mmr')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
          setDashboardCache((prev: any) => ({ ...prev, arenaProfile: data }));
        }
      }
    };
    fetchProfile();
  }, [setDashboardCache]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    
    // Fetch initial rooms
    const fetchRooms = async () => {
        setLoadingRooms(true);
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('mode', 'custom')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });
        
        if (data) {
            setRoomsList(data as RoomData[]);
            setDashboardCache((prev: any) => ({ ...prev, arenaRooms: data }));
        }
        if (error) console.error("Error fetching rooms:", error);
        setLoadingRooms(false);
    };

    fetchRooms();

    // Subscribe to room changes
    const channel = supabase
        .channel('public:rooms')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newRoom = payload.new as RoomData;
                if (newRoom.mode === 'custom' && newRoom.status === 'waiting') {
                    setRoomsList(prev => [newRoom, ...prev]);
                }
            } else if (payload.eventType === 'UPDATE') {
                const updatedRoom = payload.new as RoomData;
                if (updatedRoom.mode === 'custom') {
                    if (updatedRoom.status === 'waiting') {
                        setRoomsList(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                    } else {
                        // Room started playing or finished, remove from list
                        setRoomsList(prev => prev.filter(r => r.id !== updatedRoom.id));
                    }
                }
            } else if (payload.eventType === 'DELETE') {
                setRoomsList(prev => prev.filter(r => r.id !== payload.old.id));
            }
        })
        .subscribe();

    return () => {
        clearTimeout(timer);
        supabase.removeChannel(channel);
    };
  }, []);

  const handleQuickMatch = (mode: string) => {
    navigate(`/dashboard/arena/lobby?mode=${mode}`);
  };

  // Open Modal
  const handleOpenCreateModal = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          setRoomSettings(prev => ({ ...prev, name: `${user.user_metadata?.full_name || 'Player'}'s Room` }));
      }
      setIsCreateModalOpen(true);
  };

  // Actual Create Logic
  const handleConfirmCreate = async () => {
    if (!roomSettings.name) return;
    setCreating(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Generate a random 6-digit code
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Fetch latest profile for correct avatar/name
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const hostDisplay = profileData?.display_name || user.user_metadata?.full_name || 'Host';
        const hostAvatar = profileData?.avatar_url || user.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.id;

        const { data, error } = await supabase
            .from('rooms')
            .insert({
                host_id: user.id,
                code: roomCode,
                status: 'waiting',
                mode: 'custom',
                name: roomSettings.name,
                settings: {
                    max_rounds: roomSettings.max_rounds,
                    questions_per_round: roomSettings.questions,
                    format: `Bo${roomSettings.max_rounds}`
                },
                participants: [
                    {
                        id: user.id,
                        display_name: hostDisplay,
                        avatar_url: hostAvatar,
                        is_ready: true,
                        is_host: true,
                        rank: profileData?.rank_name || 'Bronze I'
                    }
                ],
                current_players: 1
            })
            .select()
            .single();

        if (error) throw error;

        if (data) {
            navigate(`/dashboard/arena/lobby?mode=custom&roomId=${data.id}`);
        }
    } catch (error) {
        console.error('Error creating room:', error);
        alert('Không thể tạo phòng. Vui lòng thử lại.');
    } finally {
        setCreating(false);
        setIsCreateModalOpen(false);
    }
  };

  const handleJoinByCode = async () => {
      if (!joinCode) return;
      
      try {
          const { data, error } = await supabase
              .from('rooms')
              .select('*')
              .eq('code', joinCode)
              .single();

          if (error || !data) {
              setAlertModal({
                  show: true,
                  title: "Phòng không tồn tại",
                  message: "Mã phòng bạn nhập không chính xác hoặc phòng đã bị đóng.",
                  type: 'error'
              });
              return;
          }

          if (data.status !== 'waiting') {
              setAlertModal({
                  show: true,
                  title: "Phòng đang thi đấu",
                  message: "Phòng này đã bắt đầu trận đấu hoặc không còn nhận người chơi mới.",
                  type: 'warning'
              });
              return;
          }

          if (data.participants && data.participants.length >= 2) {
              setAlertModal({
                  show: true,
                  title: "Phòng đã đầy",
                  message: "Phòng này đã đủ 2 người chơi. Vui lòng chọn phòng khác hoặc tự tạo phòng mới!",
                  type: 'warning'
              });
              return;
          }

          navigate(`/dashboard/arena/lobby?mode=custom&roomId=${data.id}`);
      } catch (error) {
          console.error("Error joining room:", error);
          setAlertModal({
              show: true,
              title: "Lỗi kết nối",
              message: "Đã có lỗi xảy ra khi kết nối đến phòng. Vui lòng thử lại sau.",
              type: 'error'
          });
      }
  };

  const rankInfo = getRankFromMMR(profile?.mmr ?? null);

  if (loading) return <ArenaPageSkeleton />;

  return (
    <div className="animate-fade-in-up pb-10 relative">
      {/* --- CREATE ROOM MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-neutral-950 border border-fuchsia-500/30 rounded-lg w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.1)] relative animate-in zoom-in-95 duration-200">
                
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-fuchsia-500/50" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-fuchsia-500/50" />

                {/* Modal Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-neutral-900/40 relative">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
                    <h3 className="text-2xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                        <Zap className="text-fuchsia-500 animate-pulse" size={24} /> Tạo phòng tùy chọn
                    </h3>
                    <button onClick={() => setIsCreateModalOpen(false)} className="bg-black/40 p-2 border border-white/10 text-gray-500 hover:text-fuchsia-400 hover:border-fuchsia-500/50 transition-all active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-10 space-y-8">
                    
                    {/* Room Name */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <label className="tech-label">Tên phòng</label>
                        </div>
                        <input 
                            type="text" 
                            className="w-full bg-black border border-white/5 px-5 py-4 text-white focus:border-fuchsia-500/50 transition-all outline-none font-black text-sm uppercase tracking-widest placeholder-gray-800"
                            value={roomSettings.name}
                            onChange={(e) => setRoomSettings({...roomSettings, name: e.target.value})}
                            placeholder="INPUT_SECTOR_ID..."
                        />
                    </div>
                    
                    {/* Input Group: Rounds Selection */}
                    <div className="space-y-4">
                        <label className="tech-label">Thể thức thi đấu</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[3, 5, 7].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setRoomSettings({...roomSettings, max_rounds: num})}
                                    className={`py-4 transition-all border font-black uppercase text-xs tracking-[0.2em] relative overflow-hidden ${
                                        roomSettings.max_rounds === num
                                        ? 'bg-fuchsia-600/10 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_20px_rgba(192,38,211,0.1)]'
                                        : 'bg-black border-white/5 text-gray-600 hover:border-white/20'
                                    }`}
                                >
                                    {roomSettings.max_rounds === num && <div className="absolute top-0 left-0 w-1 h-3 bg-fuchsia-500" />}
                                    Bo{num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Group: Questions Selection */}
                    <div className="space-y-4">
                        <label className="tech-label">Số câu hỏi mỗi round</label>
                        <div className="grid grid-cols-4 gap-4">
                            {[5, 7, 10, 12].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setRoomSettings({...roomSettings, questions: num})}
                                    className={`py-4 transition-all border font-black uppercase text-xs tracking-[0.2em] relative overflow-hidden ${
                                        roomSettings.questions === num
                                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                        : 'bg-black border-white/5 text-gray-600 hover:border-white/20'
                                    }`}
                                >
                                   {roomSettings.questions === num && <div className="absolute top-0 left-0 w-1 h-3 bg-blue-500" />}
                                    {num} Q
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="p-8 bg-black/60 flex justify-end gap-5">
                    <button 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="tech-label hover:text-white transition-colors px-4"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleConfirmCreate}
                        disabled={creating || !roomSettings.name}
                        className="px-10 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-[0.3em] text-[11px] flex items-center gap-3 transition-all active:translate-y-1 disabled:opacity-20 disabled:cursor-not-allowed group/btn"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)' }}
                    >
                        {creating ? <Loader2 className="animate-spin text-white" size={16} /> : <Zap size={16} />}
                        {creating ? 'Bắt đầu...' : 'Bắt đầu'}
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* --- ALERT MODAL --- */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                        {alertModal.type === 'error' ? (
                            <X className="text-red-500" size={32} />
                        ) : alertModal.type === 'warning' ? (
                            <Zap className="text-yellow-500" size={32} />
                        ) : (
                            <Users className="text-blue-500" size={32} />
                        )}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white leading-tight">{alertModal.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{alertModal.message}</p>
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-neutral-900/50">
                    <button 
                        onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header - Tech Sector Style */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 relative">
        <div className="relative z-10 w-full md:w-auto">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4 rounded-sm">
              <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">Combat Sector // Arena</span>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
             Đấu Trường <span className="text-fuchsia-500">MMR</span>
           </h1>
           <div className="h-0.5 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mt-2"></div>
           <p className="text-gray-500 mt-4 font-bold max-w-md text-sm leading-relaxed">
             Nơi kỹ năng lên ngôi. Bạn đã sẵn sàng đối đầu với những đối thủ xứng tầm để chạm tay vào vinh quang?
           </p>
        </div>
        
      </div>

      {/* Game Modes Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <ModeCard 
            title="Đấu Máy" 
            description=" rèn luyện kỹ năng và thử nghiệm chiến thuật mới với máy." 
            image="https://www.fightersgeneration.com/news2021/news/evo2021-crowd.JPG" 
            icon={Zap}
            color="blue"
            features={['Thế thức: Bo3', 'Luyện tập', 'Không tính Rank']}
            onClick={() => handleQuickMatch('bot')}
        />
        <ModeCard 
            title="Đấu thường" 
            description="Luyện tập kỹ năng, thử nghiệm chiến thuật." 
            image="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
            icon={Swords}
            color="purple" 
            features={['Thế thức: Bo3', 'Thoải mái', 'Không tính Rank']}
            onClick={() => handleQuickMatch('normal')}
        />
        <ModeCard 
            title="Đấu xếp Hạng" 
            description="Leo tháp danh vọng, khẳng định đẳng cấp." 
            image="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop" 
            icon={Bookmark}
            color="red"
            features={['Thế thức: Bo5', 'Tranh hạng', 'Tính điểm MMR']}
            onClick={() => handleQuickMatch('ranked')}
        />
       
      </div>

      {/* Active Lobbies / Live Matches */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        
        {/* Quick Join / Lobbies */}
        <div className="xl:col-span-2 space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <span className="text-2xl font-bold flex items-center gap-2 uppercase">
                  <span className="text-fuchsia-500">|</span>  Phòng chờ tuỳ chọn 
                </span>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-neutral-900 border border-white/10 rounded-xl overflow-hidden focus-within:border-fuchsia-500/50 transition-colors h-10">
                       <input 
                          type="text" 
                          placeholder="Mã phòng..." 
                          className="bg-transparent border-none outline-none text-white px-3 w-32 text-center text-sm font-mono placeholder-gray-600"
                          maxLength={6}
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                       />
                       <button 
                          onClick={handleJoinByCode}
                          disabled={!joinCode || joinCode.length < 6}
                          className="bg-white/5 hover:bg-white/10 text-white px-3 border-l border-white/10 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           Vào
                       </button>
                   </div>

                   <button 
                      onClick={handleOpenCreateModal}
                      className="px-4 h-10 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-bold  shadow-lg shadow-fuchsia-900/20 flex items-center gap-2 transition-all active:scale-95 border border-fuchsia-400/20"
                   >
                       Tạo phòng
                   </button>
                </div>
             </div>

          
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Table Header */}

            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Tên phòng</div>
              <div className="col-span-2 text-center">Chế độ</div>
              <div className="col-span-2 text-center">Người chơi</div>
              <div className="col-span-3 text-right">Trạng thái</div>
            </div>

            {/* List */}
            <div className="divide-y divide-white/5">
              {loadingRooms ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                   <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                   Đang tải danh sách phòng...
                </div>
              ) : roomsList.length > 0 ? (
                roomsList.map((room) => (
                    <LobbyRow 
                        key={room.id}
                        name={room.name} 
                        mode={room.settings?.format || 'Bo3'} 
                        playerCount={room.participants?.length || 0}
                        onClick={() => navigate(`/dashboard/arena/lobby?mode=custom&roomId=${room.id}`)}
                    />
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm italic">
                    Chưa có phòng nào được tạo. Hãy tạo phòng mới!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Ranking / History */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 border border-fuchsia-500/20 rounded-b-lg p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Bookmark size={100} />
             </div>
             <h3 className="text-xl font-bold text-white mb-4">Mùa giải 12</h3>
             <div className="flex items-center gap-4 mb-6">
               <div className="p-0.5 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-white/5">
                 <div className="w-16 h-16 rounded-full flex items-center justify-center relative bg-neutral-900/50">
                   <Bookmark size={32} style={{ color: rankInfo.color }} className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                   {rankInfo.division && (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] flex flex-col gap-0.5">
                        {Array.from({ length: rankInfo.division === 'III' ? 3 : (rankInfo.division === 'II' ? 2 : 1) }).map((_, i) => (
                          <div key={i} className="w-4 h-[1.5px] rounded-full" style={{ backgroundColor: rankInfo.color }} />
                        ))}
                     </div>
                   )}
                 </div>
               </div>
               <div>
                  <div className="text-2xl font-bold text-white uppercase tracking-tight" style={{ color: rankInfo.color }}>
                    {rankInfo.tier === 'Unranked' ? 'Chưa có hạng' : `${rankInfo.tier} ${rankInfo.division}`}
                  </div>
                  <div className="text-sm text-gray-400 font-bold">{profile?.mmr ?? 0} MMR</div>
               </div>
             </div>
             
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold">Thứ hạng</span>
                  <span className="text-white font-black">#--</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold">Thắng/Thua</span>
                  <span className="text-white font-black">0/0</span>
                </div>
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden mt-2 border border-white/5 p-[1px]">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${rankInfo.progress}%`, backgroundColor: rankInfo.color, boxShadow: `0 0 10px ${rankInfo.color}80` }}></div>
                </div>
                <div className="text-center text-[10px] text-gray-500 mt-1 font-black uppercase tracking-widest">Tiến trình Rank: {rankInfo.progress}%</div>
              </div>
             
             <Link to="/dashboard/ranking">
             <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-sm font-black uppercase tracking-widest  transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
               <Trophy size={18} className="text-yellow-500" /> Bảng vinh danh
             </button></Link>
          </div>
        </div>
      </div>
    </div>
  );
};



// --- Sub Components ---

interface ModeCardProps {
  title: string;
  description: string;
  image: string;
  icon: React.ElementType;
  color: 'fuchsia' | 'blue' | 'red' | 'purple';
  features: string[];
  onClick: () => void;
}

const ModeCard = ({ title, description, image, icon: Icon, color, features, onClick }: ModeCardProps) => {
  const colorMap = {
    fuchsia: { primary: '#d946ef', accent: 'fuchsia', gradient: 'from-fuchsia-600 to-purple-700' },
    blue: { primary: '#3b82f6', accent: 'blue', gradient: 'from-blue-600 to-cyan-700' },
    red: { primary: '#ef4444', accent: 'red', gradient: 'from-red-600 to-orange-700' },
    purple: { primary: '#a855f7', accent: 'purple', gradient: 'from-purple-600 to-fuchsia-700' },
  };

  const style = colorMap[color];

  return (
    <div 
        onClick={onClick}
        className="group relative h-[480px] cursor-pointer tech-card transition-all duration-500 hover:border-fuchsia-500/40"
    >
      {/* Background Tech Stack */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-30 grayscale group-hover:grayscale-0" />
        <div className="absolute inset-0 bg-neutral-950/80"></div>
        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Cyber Scanline Loop */}
      <div className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-15 transition-opacity">
          <div className="w-full h-[200%] bg-[linear-gradient(to_bottom,transparent_0,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-scanline-fast" />
      </div>

      {/* Corner HUD ornaments */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 opacity-20 border-white group-hover:border-fuchsia-500 group-hover:opacity-100 transition-all duration-500" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 opacity-20 border-white group-hover:border-fuchsia-500 group-hover:opacity-100 transition-all duration-500" />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
        <div className={`w-16 h-16 rounded-xl bg-black/40 border-2 border-white/5 flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-fuchsia-600/10`} style={{ borderColor: `${style.primary}40` }}>
          <Icon size={32} className={`text-${style.accent}-400 group-hover:text-white transition-colors`} />
        </div>
        
        <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter italic group-hover:translate-x-2 transition-transform duration-500">{title}</h3>
        <p className="text-gray-500 text-sm mb-8 font-bold leading-relaxed group-hover:text-gray-300 transition-colors uppercase tracking-tight">{description}</p>
        
        <div className="flex flex-col gap-3 mb-10 opacity-60 group-hover:opacity-100 transition-opacity">
          {features.map((feat: string, idx: number) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rotate-45 border border-white/20" style={{ backgroundColor: style.primary }}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{feat}</span>
            </div>
          ))}
        </div>

        <button 
          className="relative w-full py-5 overflow-hidden group/btn"
          style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 8% 100%)' }}
        >
          <div className={`absolute inset-0 bg-neutral-900 border-x border-b border-fuchsia-500/20 active:translate-y-0.5 transition-all`} />
          <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500`} />
          <span className="relative z-10 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-white">
             <Play size={14} fill="white" /> Chơi ngay
          </span>
        </button>
      </div>
    </div>
  );
}


interface LobbyRowProps {
  name: string;
  mode: string;
  playerCount: number;
  isPrivate?: boolean;
  onClick: () => void;
}

const LobbyRow = ({ name, mode, playerCount, isPrivate, onClick }: LobbyRowProps) => {
  const isFull = playerCount >= 2;

  return (
    <div 
      onClick={isFull ? undefined : onClick}
      className={`relative group h-20 overflow-hidden border-b border-white/5 transition-all ${isFull ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:bg-fuchsia-600/5 hover:border-fuchsia-500/20'}`}
    >
      {/* Hover Highlight Overlay */}
      {!isFull && <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/0 via-fuchsia-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
      
      <div className="absolute inset-0 flex items-center px-6 gap-6 z-10">
        <div className="w-10 h-10 bg-neutral-900 border border-white/10 flex items-center justify-center relative shadow-inner group-hover:border-fuchsia-500/40 transition-colors">
            {isPrivate ? <Lock size={16} className="text-red-400" /> : <Shield size={16} className="text-gray-600 group-hover:text-fuchsia-400" />}
            {/* Tech Corner Brackets */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20" />
        </div>
        
        <div className="flex-1">
          <div className="font-black text-sm uppercase tracking-tight text-white group-hover:text-fuchsia-400 transition-colors">{name}</div>
          <div className="flex items-center gap-3 mt-0.5">
             <span className="tech-label opacity-60">Status:</span>
             <span className={`text-[10px] font-black uppercase ${isFull ? 'text-red-500' : 'text-green-500'}`}>{isFull ? 'Active Match' : 'Ready to Join'}</span>
          </div>
        </div>

        <div className="w-24 text-center">
          <div className="tech-label mb-1">Format</div>
          <div className="text-xs font-black text-gray-300 italic uppercase">{mode}</div>
        </div>

        <div className="w-32 text-center">
          <div className="tech-label mb-1">Participants</div>
          <div className="flex items-center justify-center gap-1.5">
             <div className={`w-2 h-2 rounded-sm rotate-45 ${playerCount >= 1 ? 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' : 'bg-white/10'}`} />
             <div className={`w-2 h-2 rounded-sm rotate-45 ${playerCount >= 2 ? 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' : 'bg-white/10'}`} />
             <span className="text-sm font-black text-white ml-2">{playerCount}/2</span>
          </div>
        </div>

        <div className="w-32 text-right">
           <button 
              disabled={isFull}
              className={`relative px-6 py-2 overflow-hidden transition-all group/btn ${isFull ? 'opacity-50' : 'active:scale-95'}`}
           >
             <div className={`absolute inset-0 bg-neutral-900 border border-white/10 group-hover:border-fuchsia-500/50 transition-colors`} />
             {!isFull && <div className="absolute inset-0 bg-fuchsia-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)' }} />}
             <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.2em] ${isFull ? 'text-gray-600' : 'text-fuchsia-400 group-hover/btn:text-white'}`}>
                {isFull ? 'Locked' : 'Access'}
             </span>
           </button>
        </div>
      </div>

      {/* Hover Scannline */}
      {!isFull && (
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-5 transition-opacity">
            <div className="w-full h-[200%] bg-[linear-gradient(to_bottom,transparent_0,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-scanline-fast" />
        </div>
      )}
    </div>
  );
};

export default ArenaView;
