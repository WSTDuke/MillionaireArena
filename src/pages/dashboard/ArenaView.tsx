import { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
import { Swords, Trophy, Users, Zap, Star, Play, Lock, Bookmark, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ArenaPageSkeleton } from '../../components/LoadingSkeletons';

const ArenaView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const handleStartMode = (mode: string) => {
    navigate(`/dashboard/arena/lobby?mode=${mode}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const [joinCode, setJoinCode] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
      name: "",
      format: "Bo3",
      questions: 5
  });
  const [creating, setCreating] = useState(false);

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

        const { data, error } = await supabase
            .from('rooms')
            .insert({
                host_id: user.id,
                code: roomCode,
                status: 'waiting',
                mode: 'custom',
                name: roomSettings.name,
                settings: {
                    format: roomSettings.format,
                    questions_per_round: roomSettings.questions
                },
                participants: [
                    {
                        id: user.id,
                        display_name: user.user_metadata?.full_name || 'Host',
                        avatar_url: user.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.id,
                        is_ready: true, // Host is ready by default? Or not? Let's say yes or separate start logic.
                        is_host: true
                    }
                ]
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
              .select('id')
              .eq('code', joinCode)
              .single();

          if (error || !data) {
              alert('Mã phòng không tồn tại!');
              return;
          }

          navigate(`/dashboard/arena/lobby?mode=custom&roomId=${data.id}`);
      } catch (error) {
          console.error("Error joining room:", error);
      }
  };

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

                    {/* Checkbox Group: Format */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Thể thức thi đấu</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['Bo1', 'Bo3', 'Bo5'].map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setRoomSettings({...roomSettings, format: fmt})}
                                    className={`relative px-4 py-3 rounded-xl border font-bold transition-all ${
                                        roomSettings.format === fmt 
                                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white shadow-[0_0_15px_rgba(232,121,249,0.3)]' 
                                        : 'bg-neutral-900 border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}
                                >
                                    {fmt}
                                    {roomSettings.format === fmt && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Checkbox Group: Questions */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Số câu hỏi / Round</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[5, 7, 10].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setRoomSettings({...roomSettings, questions: q})}
                                    className={`px-4 py-2 rounded-xl border font-bold transition-all ${
                                        roomSettings.questions === q
                                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                        : 'bg-neutral-900 border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}
                                >
                                    {q} câu
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

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <Swords className="text-fuchsia-500" size={32} />
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
          title="Tử chiến (Deathmatch)"
          description="Suy nghĩ nhanh chóng-đưa ra kết quả chính xác."
          image="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1965&auto=format&fit=crop"
          icon={Zap}
          color="red"
          features={["Thể thức: Bo3", "Nhịp độ cao", "Limited Time"]}
          isNew
          onClick={() => handleStartMode('Deathmatch')}
        />
      </div>

      {/* Active Lobbies / Live Matches */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
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
                      className="px-4 h-10 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-fuchsia-900/20 flex items-center gap-2 transition-all active:scale-95 border border-fuchsia-400/20"
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
              <LobbyRow name="Train team tối nay" mode="Bo5" players="1/2" isPrivate />
            </div>
          </div>
        </div>

        {/* Sidebar: Ranking / History */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 border border-fuchsia-500/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Trophy size={100} />
             </div>
             <h3 className="text-xl font-bold text-white mb-4">Mùa giải 12</h3>
             <div className="flex items-center gap-4 mb-6">
               <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                 <Bookmark className="text-yellow-500" size={32} />
               </div>
               <div>
                  <div className="text-2xl font-bold text-white">Unranked</div>
                  <div className="text-sm text-gray-400">Chưa bắt đầu</div>
               </div>
             </div>
             
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Thắng</span>
                  <span className="text-green-400 font-bold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Thua</span>
                  <span className="text-red-400 font-bold">0</span>
                </div>
                <div className="w-full bg-black h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-fuchsia-500 h-full w-[0%]"></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">Tỉ lệ thắng: 0%</div>
              </div>
             
             <Link to="/dashboard/ranking">
             <button className="w-full mt-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-fuchsia-900/20">
               Xem bảng xếp hạng
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
  icon: any;
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
          className={`w-full py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 transition-colors flex items-center justify-center gap-2 group-hover:bg-gradient-to-r ${color === 'fuchsia' ? 'from-fuchsia-600 to-purple-600' : color === 'red' ? 'from-red-600 to-orange-600' : 'from-blue-600 to-cyan-600'}`}
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
  players: string;
  isPrivate?: boolean;
}

const LobbyRow = ({ name, mode, players, isPrivate }: LobbyRowProps) => (
  <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer group">
    <div className="col-span-5 flex items-center gap-3">
      {isPrivate ? <Lock size={14} className="text-red-400" /> : <div className="w-3.5" />}
      <span className="font-bold text-gray-200 group-hover:text-white truncate">{name}</span>
    </div>
    <div className="col-span-2 text-center">
      <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">{mode}</span>
    </div>
    <div className="col-span-2 text-center text-sm font-medium text-gray-300">{players}</div>
    <div className="col-span-3 text-right">
       <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-fuchsia-600 hover:text-white text-fuchsia-400 transition-all border border-white/10 hover:border-fuchsia-500">
         Tham gia
       </button>
    </div>
  </div>
);

export default ArenaView;
