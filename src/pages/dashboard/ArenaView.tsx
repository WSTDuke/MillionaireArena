import { useState, useEffect } from 'react';
import { Swords, Trophy, Users, Zap, Star, Play, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  if (loading) return <ArenaPageSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent mb-1">
            Đấu trường
          </h1>
          <p className="text-gray-400">Chọn chế độ và bắt đầu cuộc chiến của bạn.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-sm font-bold text-gray-300">Online:</span>
             <span className="text-sm font-bold text-white">0</span>
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
        {/* Ranked Mode */}
        <ModeCard 
          title="Xếp hạng (Ranked)"
          description="Leo tháp danh vọng, khẳng định đẳng cấp."
          image="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
          icon={Trophy}
          color="fuchsia"
          features={["Cấm/Chọn", "5v5 Competitive", "Tính điểm MMR"]}
          onClick={() => handleStartMode('Ranked')}
        />
        
        {/* Normal Mode */}
        <ModeCard 
          title="Đấu thường (Normal)"
          description="Luyện tập kỹ năng, thử nghiệm chiến thuật."
          image="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"
          icon={Swords}
          color="blue"
          features={["Chọn ẩn", "Thoải mái", "Không tính Rank"]}
          onClick={() => handleStartMode('Normal')}
        />

        {/* Special/Event Mode */}
        <ModeCard 
          title="Tử chiến (Deathmatch)"
          description="Chế độ sinh tồn, duy nhất 1 người sống sót."
          image="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1965&auto=format&fit=crop"
          icon={Zap}
          color="red"
          features={["Solo Free-for-all", "Nhịp độ cao", "Limited Time"]}
          isNew
          onClick={() => handleStartMode('Deathmatch')}
        />
      </div>

      {/* Active Lobbies / Live Matches */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Quick Join / Lobbies */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold flex items-center gap-2">
               <Users className="text-fuchsia-500" /> Phòng chờ tuỳ chọn (Custom)
             </h3>
             <button className="text-sm text-fuchsia-400 hover:text-white transition-colors">
               + Tạo phòng
             </button>
          </div>
          
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-sm font-medium text-gray-500">
              <div className="col-span-4">Tên phòng</div>
              <div className="col-span-2">Chế độ</div>
              <div className="col-span-2">Map</div>
              <div className="col-span-2 text-center">Người chơi</div>
              <div className="col-span-2 text-right">Trạng thái</div>
            </div>

            {/* List */}
            <div className="divide-y divide-white/5">
              <LobbyRow name="Train team tối nay" mode="5v5" map="Cyber City" players="8/10" isPrivate />
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
                 <Trophy className="text-yellow-500" size={32} />
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
             
             <button className="w-full mt-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-fuchsia-900/20">
               Xem bảng xếp hạng
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Sub Components ---

const ModeCard = ({ title, description, image, icon: Icon, color, features, isNew, onClick }: any) => {
  const colorClasses: any = {
    fuchsia: "text-fuchsia-400 group-hover:text-fuchsia-300 bg-fuchsia-500",
    blue: "text-blue-400 group-hover:text-blue-300 bg-blue-500",
    red: "text-red-400 group-hover:text-red-300 bg-red-500",
  };

  return (
    <div className="group relative h-80 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
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
        
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 line-clamp-2">{description}</p>
        
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
          <Play size={16} fill="currentColor" /> Bắt đầu
        </button>
      </div>
    </div>
  );
}


const LobbyRow = ({ name, mode, map, players, isPrivate }: any) => (
  <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer group">
    <div className="col-span-4 flex items-center gap-3">
      {isPrivate ? <Lock size={14} className="text-red-400" /> : <div className="w-3.5" />}
      <span className="font-bold text-gray-200 group-hover:text-white truncate">{name}</span>
    </div>
    <div className="col-span-2">
      <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">{mode}</span>
    </div>
    <div className="col-span-2 text-sm text-gray-400">{map}</div>
    <div className="col-span-2 text-center text-sm font-medium text-gray-300">{players}</div>
    <div className="col-span-2 text-right">
       <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-fuchsia-600 hover:text-white text-fuchsia-400 transition-all border border-white/10 hover:border-fuchsia-500">
         Tham gia
       </button>
    </div>
  </div>
);

export default ArenaView;
