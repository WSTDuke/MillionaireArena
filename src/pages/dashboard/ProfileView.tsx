import React from 'react';
import { 
  Trophy, Swords, Target, Clock, Zap, Medal, 
  Share2, Edit3, MapPin, Calendar, Award 
} from 'lucide-react';

const ProfileView = ({ onEditProfile }) => {
  return (
    <div className="animate-fade-in-up">
      {/* --- HERO SECTION --- */}
      <div className="relative mb-24">
        {/* Cover Image */}
        <div className="h-64 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 left-8 flex items-end gap-6 w-[calc(100%-4rem)]">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 bg-black">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 p-[2px]">
                <img 
                  src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=100&h=100" 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-4 border-black" 
                />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold border-2 border-black">
              LVL 42
            </div>
          </div>

          {/* Text Info */}
          <div className="flex-1 mb-2">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  ShadowHunter
                  <Medal className="text-fuchsia-500" size={24} />
                </h1>
                <div className="flex items-center gap-4 text-gray-400 text-sm mt-1">
                  <span className="flex items-center gap-1"><MapPin size={14} /> Vietnam</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Joined 2023</span>
                  <span className="text-fuchsia-400">Pro Player</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium flex items-center gap-2 transition-colors">
                  <Share2 size={18} /> Chia sẻ
                </button>
                <button 
                  onClick={onEditProfile}
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(192,38,211,0.3)] flex items-center gap-2 transition-colors"
                >
                  <Edit3 size={18} /> Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Detailed Stats) */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Main Rank Card */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} /> Competitive Rank
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-32 h-32 relative mb-4">
                 {/* Placeholder for Rank Icon SVG */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy size={64} className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(192,38,211,0.5)]" />
                 </div>
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-neutral-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path className="text-fuchsia-500" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                 </svg>
              </div>
              <div className="text-2xl font-bold text-white">Diamond III</div>
              <div className="text-sm text-gray-400">2,450 MMR</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-xs text-gray-500">Global Rank</div>
                <div className="font-bold text-white">#1,240</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-xs text-gray-500">Server Rank</div>
                <div className="font-bold text-white">#42</div>
              </div>
            </div>
          </div>

          {/* Skill Radar / Bars */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="text-blue-500" size={20} /> Kỹ năng
            </h3>
            <div className="space-y-4">
              <SkillBar label="Kỹ năng cá nhân" percent={85} color="bg-blue-500" />
              <SkillBar label="Chiến thuật" percent={72} color="bg-green-500" />
              <SkillBar label="Phối hợp đồng đội" percent={90} color="bg-purple-500" />
              <SkillBar label="Phản xạ" percent={78} color="bg-yellow-500" />
            </div>
          </div>

          {/* Information */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Thông tin</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex justify-between">
                <span>Tuổi</span>
                <span className="text-white">24</span>
              </li>
              <li className="flex justify-between">
                <span>Giới tính</span>
                <span className="text-white">Nam</span>
              </li>
              <li className="flex justify-between">
                <span>Discord</span>
                <span className="text-white hover:text-fuchsia-400 cursor-pointer">shadow#1234</span>
              </li>
              <li className="flex justify-between">
                <span>Team</span>
                <span className="text-white hover:text-fuchsia-400 cursor-pointer">Phoenix Fire</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CENTER & RIGHT COLUMN (History & Achievements) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Overview Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MiniStatBox label="Total Matches" value="1,240" icon={Swords} />
             <MiniStatBox label="Win Rate" value="68.5%" icon={Trophy} color="text-green-400" />
             <MiniStatBox label="K/D Ratio" value="4.2" icon={Target} color="text-red-400" />
             <MiniStatBox label="Play Time" value="400h" icon={Clock} color="text-blue-400" />
          </div>

          {/* Achievements */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Award className="text-yellow-500" size={20} /> Thành tựu nổi bật
              </h3>
              <button className="text-xs text-fuchsia-400 hover:text-fuchsia-300">Xem tất cả</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              <AchievementCard title="MVP Mùa giải" tier="Legendary" icon="👑" color="from-yellow-500 to-orange-600" />
              <AchievementCard title="Bách chiến" tier="Epic" icon="⚔️" color="from-red-500 to-pink-600" />
              <AchievementCard title="Nhà từ thiện" tier="Rare" icon="💎" color="from-blue-500 to-cyan-600" />
              <AchievementCard title="Tay bắn tỉa" tier="Epic" icon="🎯" color="from-purple-500 to-indigo-600" />
              <AchievementCard title="Chiến thuật gia" tier="Common" icon="🧠" color="from-gray-500 to-slate-600" />
            </div>
          </div>

          {/* Match History (Reusing design style) */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
               <Zap className="text-fuchsia-500" size={20} /> Trận đấu gần đây
            </h3>
            <div className="space-y-4">
               {/* Mock Data */}
               <ProfileMatchRow result="Victory" mode="Ranked 5v5" hero="Yasuo" kda="15/2/8" time="2h ago" score="+25 MMR" />
               <ProfileMatchRow result="Defeat" mode="Ranked 5v5" hero="Yone" kda="5/8/2" time="5h ago" score="-18 MMR" isWin={false} />
               <ProfileMatchRow result="Victory" mode="Tournament" hero="Zed" kda="22/4/10" time="1d ago" score="+MVP" />
               <ProfileMatchRow result="Victory" mode="Normal" hero="Lee Sin" kda="12/1/15" time="2d ago" score="+10 MMR" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const SkillBar = ({ label, percent, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-bold">{percent}%</span>
    </div>
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

const MiniStatBox = ({ label, value, icon: Icon, color = "text-white" }) => (
  <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-white/5 ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  </div>
);

const AchievementCard = ({ title, tier, icon, color }) => (
  <div className="min-w-[140px] p-4 rounded-xl bg-gradient-to-br border border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform">
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
    <div className="text-3xl mb-3">{icon}</div>
    <div className="text-sm font-bold text-white mb-1">{title}</div>
    <div className="text-xs text-gray-400">{tier}</div>
  </div>
);

const ProfileMatchRow = ({ result, mode, hero, kda, time, score, isWin = true }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
     <div className="flex items-center gap-4">
       <div className={`w-1 h-12 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}></div>
       <div>
         <div className={`font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>{result}</div>
         <div className="text-xs text-gray-500">{mode}</div>
       </div>
     </div>
     <div className="text-center">
        <div className="font-bold text-white">{hero}</div>
        <div className="text-xs text-gray-500">Hero</div>
     </div>
     <div className="text-center">
        <div className="font-medium text-gray-300">{kda}</div>
        <div className="text-xs text-gray-500">KDA</div>
     </div>
     <div className="text-right">
        <div className={`font-bold ${isWin ? 'text-yellow-400' : 'text-gray-400'}`}>{score}</div>
        <div className="text-xs text-gray-500">{time}</div>
     </div>
  </div>
);

export default ProfileView;
