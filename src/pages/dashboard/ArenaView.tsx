import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { supabase } from "../../lib/supabase";
import { Swords, Trophy, Users, Zap, Star, Play, Lock, Bookmark, X, Loader2 } from 'lucide-react';
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

const ArenaView = () => {
  const navigate = useNavigate();
  const { dashboardCache, setDashboardCache } = useOutletContext<any>();
  const [loading, setLoading] = useState(!dashboardCache.arenaRooms || !dashboardCache.arenaProfile);
  const [profile, setProfile] = useState<any>(dashboardCache.arenaProfile || null);
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

  const handleStartMode = (mode: string) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-fuchsia-500" size={20} /> Thiết lập phòng đấu
                    </h3>
                    <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Room Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tên phòng</label>
                        <input 
                            type="text" 
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 transition-colors outline-none font-bold"
                            value={roomSettings.name}
                            onChange={(e) => setRoomSettings({...roomSettings, name: e.target.value})}
                            placeholder="Nhập tên phòng..."
                        />
                    </div>
                    
                    {/* Input Group: Rounds Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Thể thức thi đấu</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[3, 5, 7].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setRoomSettings({...roomSettings, max_rounds: num})}
                                    className={`py-3 rounded-xl font-bold transition-all border ${
                                        roomSettings.max_rounds === num
                                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_15px_rgba(192,38,211,0.2)]'
                                        : 'bg-neutral-900 border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                                >
                                    Bo{num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Group: Questions Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Số câu hỏi mỗi Round</label>
                        <div className="grid grid-cols-4 gap-3">
                            {[5, 7, 10, 12].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setRoomSettings({...roomSettings, questions: num})}
                                    className={`py-3 rounded-xl font-bold transition-all border ${
                                        roomSettings.questions === num
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                        : 'bg-neutral-900 border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/5 bg-neutral-900/30 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleConfirmCreate}
                        disabled={creating || !roomSettings.name}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-fuchsia-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                        {creating ? 'Đang tạo...' : 'Tạo phòng ngay'}
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

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             Đấu Trường (Arena)
           </h1>
           <p className="text-gray-400 mt-2">
             Chọn chế độ thi đấu và khẳng định bản thân.
           </p>
        </div>
        
        <div className="flex items-center gap-4 bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-sm font-bold text-gray-300">Online:</span>
             <span className="text-sm font-bold text-white">1,240</span>
           </div>
           <div className="w-px h-4 bg-white/10"></div>
           <div className="flex items-center gap-2">
             <Zap size={14} className="text-yellow-500" />
             <span className="text-sm font-bold text-gray-300">Matching:</span>
             <span className="text-sm font-bold text-green-400">--</span>
           </div>
        </div>
      </div>

      {/* Game Modes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Normal Mode */}
        <ModeCard 
          title="Đấu thường (Normal)"
          description="Luyện tập kỹ năng, thử nghiệm chiến thuật."
          image="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"
          icon={Swords}
          color="blue"
          features={["Thể thức: Bo3", "Thoải mái", "Không tính Rank"]}
          onClick={() => handleStartMode('Normal')}
        />

        {/* Ranked Mode */}
        <ModeCard 
          title="Xếp hạng (Ranked)"
          description="Leo tháp danh vọng, khẳng định đẳng cấp."
          image="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
          icon={Bookmark}
          color="fuchsia"
          features={["Thể thức: Bo5", "Tranh hạng", "Tính điểm MMR"]}
          onClick={() => handleStartMode('Ranked')}
        />

        {/* Special/Event Mode */}
        <ModeCard 
          title="Chớp nhoáng (Blitzmatch)"
          description="Suy nghĩ nhanh chóng-đưa ra kết quả chính xác."
          image="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1965&auto=format&fit=crop"
          icon={Zap}
          color="red"
          features={["Thể thức: Bo3", "Nhịp độ cao", "Limited Time"]}
          isNew
          onClick={() => handleStartMode('Blitzmatch')}
        />
      </div>

      {/* Active Lobbies / Live Matches */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        
        {/* Quick Join / Lobbies */}
        <div className="xl:col-span-2 space-y-6 mt-8">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="text-fuchsia-500" /> Phòng chờ tuỳ chọn (Custom)
                </h3>
                
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
          <div className="bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 border border-fuchsia-500/20 rounded-b-4xl p-6 relative overflow-hidden">
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
             <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
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
  color: 'fuchsia' | 'blue' | 'red';
  features: string[];
  isNew?: boolean;
  onClick: () => void;
}

const ModeCard = ({ title, description, image, icon: Icon, color, features, isNew, onClick }: ModeCardProps) => {
  const colorClasses: Record<string, string> = {
    fuchsia: "text-fuchsia-400 group-hover:text-fuchsia-300 bg-fuchsia-500",
    blue: "text-blue-400 group-hover:text-blue-300 bg-blue-500",
    red: "text-red-400 group-hover:text-red-300 bg-red-500",
  };

  const titleColors: Record<string, string> = {
    fuchsia: "group-hover:text-fuchsia-400",
    blue: "group-hover:text-blue-400",
    red: "group-hover:text-red-400",
  };

  return (
    <div className="group relative h-90 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40 " />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
      </div>

      {isNew && (
        <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
          NEW
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className={`w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-lg ${colorClasses[color].split(' ')[0]}`}>
          <Icon size={24} />
        </div>
        
        <h3 className={`text-2xl font-bold text-white mb-2 transition-colors ${titleColors[color]}`}>{title}</h3>
        <p className="text-gray-400 text-sm mb-6 line-clamp-2 ">{description}</p>
        
        <div className="space-y-2 mb-6">
          {features.map((feat: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
              <Star size={10} className={colorClasses[color].split(' ')[0]} /> {feat}
            </div>
          ))}
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`w-full py-3  font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 transition-colors flex items-center justify-center gap-2 group-hover:bg-gradient-to-r ${color === 'fuchsia' ? 'from-fuchsia-600 to-purple-600' : color === 'red' ? 'from-red-600 to-orange-600' : 'from-blue-600 to-cyan-600'}`}
        >
          <Play size={16} fill="currentColor" /> Chơi ngay
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
      className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors group ${isFull ? 'bg-black/20 cursor-not-allowed opacity-60' : 'hover:bg-white/5 cursor-pointer'}`}
    >
      <div className="col-span-5 flex items-center gap-3">
        {isPrivate ? <Lock size={14} className="text-red-400" /> : <div className="w-3.5" />}
        <span className="font-bold text-gray-200 group-hover:text-white truncate">{name}</span>
      </div>
      <div className="col-span-2 text-center">
        <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">{mode}</span>
      </div>
      <div className={`col-span-2 text-center text-sm font-black tracking-tighter ${isFull ? 'text-gray-500' : 'text-fuchsia-500'}`}>
        {playerCount}/2
      </div>
      <div className="col-span-3 text-right">
         <button 
            disabled={isFull}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${
                isFull 
                ? 'bg-neutral-800 text-gray-500 border-white/5' 
                : 'bg-white/5 hover:bg-fuchsia-600 hover:text-white text-fuchsia-400 border-white/10 hover:border-fuchsia-500'
            }`}
         >
           {isFull ? 'Đã đầy' : 'Tham gia'}
         </button>
      </div>
    </div>
  );
};

export default ArenaView;
