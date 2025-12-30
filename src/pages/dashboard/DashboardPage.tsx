import React, { useState } from 'react';
import SettingsView from './SettingsView';
import ProfileView from './ProfileView';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Trophy, Swords, Wallet, Settings, Bell, 
  Search, LogOut, TrendingUp, Users, Clock, ChevronRight, Plus 
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex selection:bg-fuchsia-500 selection:text-white overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 hidden lg:flex flex-col border-r border-white/10 bg-neutral-950/50 backdrop-blur-xl h-screen fixed top-0 left-0 z-50">
        {/* Logo */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
          <Swords className="w-8 h-8 text-fuchsia-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
            MillionArena
          </span>
        </div>

        {/* Navigation */}
        <nav className='flex-1 justify-between h-full'>
          <div className="flex-1 space-y-2 p-4">
            <NavItem icon={LayoutDashboard} label="Tổng quan" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <NavItem icon={Swords} label="Đấu trường" active={activeTab === 'arena'} onClick={() => setActiveTab('arena')} />
            <NavItem icon={Trophy} label="Giải đấu" active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} />
            <NavItem icon={Users} label="Clan / Đội" active={activeTab === 'clan'} onClick={() => setActiveTab('clan')} />
            <div className="pt-4 pb-2">
            <div className="h-px bg-white/10 mx-2"></div>
          </div>
          </div>
        </nav>

        {/* User Mini Profile (Bottom Sidebar) */}
        <div className="p-4 border-t border-white/5 bg-neutral-900/50">
          <UserProfileDropup onLogout={handleLogout} onSettings={() => setActiveTab('settings')} onProfile={() => setActiveTab('profile')} />
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 lg:ml-64 relative">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-fuchsia-900/10 blur-[120px] pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4 text-gray-400">
            <h2 className="text-xl font-bold text-white hidden md:block">Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-neutral-900 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:border-fuchsia-500/50 transition-colors">
              <Search size={18} className="text-gray-500" />
              <input type="text" placeholder="Tìm giải đấu, người chơi..." className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-gray-600" />
            </div>

           

            {/* Notifications */}
            <div className="relative cursor-pointer hover:text-fuchsia-400 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>
            </div>
          </div>
        </header>

        {/* Dashboard Content Scrollable */}
        <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pb-20">
          
          {activeTab === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">Xin chào, ShadowHunter! 👋</h1>
                  <p className="text-gray-400">Hôm nay là một ngày tuyệt vời để leo hạng.</p>
                </div>
                <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] transition-all flex items-center gap-2">
                  <Swords size={20} />
                  Tìm trận ngay
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={Trophy} label="Xếp hạng hiện tại" value="Diamond III" subValue="Top 2.5% Server" color="text-yellow-400" gradient="from-yellow-500/20 to-orange-500/5" />
                <StatCard icon={Swords} label="Tỉ lệ thắng" value="68.5%" subValue="+2.4% tuần này" color="text-green-400" gradient="from-green-500/20 to-emerald-500/5" />
                <StatCard icon={TrendingUp} label="Tổng thu nhập" value="$12,450" subValue="+$540 hôm qua" color="text-fuchsia-400" gradient="from-fuchsia-500/20 to-purple-500/5" />
                <StatCard icon={Clock} label="Giờ chơi" value="1,240h" subValue="Hardcore Player" color="text-blue-400" gradient="from-blue-500/20 to-cyan-500/5" />
              </div>
            </>
          )}

          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'profile' && <ProfileView onEditProfile={() => setActiveTab('settings')} />}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column (Main) */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Live Tournament Banner */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 group h-64">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                  <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded text-xs font-bold animate-pulse text-white">LIVE</div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-end p-8">
                    <h3 className="text-3xl font-bold mb-2">Million Major: Winter 2024</h3>
                    <p className="text-gray-300 mb-6 max-w-lg">Giải đấu lớn nhất mùa đông đã khởi tranh. Xem trực tiếp hoặc tham gia vòng loại mở rộng ngay bây giờ.</p>
                    <div className="flex gap-4">
                      <button className="px-5 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors">Xem Stream</button>
                      <button className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded hover:bg-white/20 transition-colors">Chi tiết giải</button>
                    </div>
                  </div>
                </div>

                {/* Recent Matches History */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Lịch sử đấu</h3>
                    <button className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Xem tất cả</button>
                  </div>
                  <div className="space-y-4">
                    <MatchRow result="Win" score="15 - 3" map="Cyber City" kda="18/4/5" date="2 giờ trước" money="+$50" />
                    <MatchRow result="Loss" score="12 - 13" map="Desert Storm" kda="12/10/2" date="5 giờ trước" money="-$20" />
                    <MatchRow result="Win" score="15 - 8" map="Neon Lab" kda="24/2/8" date="1 ngày trước" money="+$75" />
                    <MatchRow result="Win" score="15 - 0" map="Cyber City" kda="15/0/4" date="1 ngày trước" money="+$40" />
                  </div>
                </div>
              </div>

              {/* Right Column (Widgets) */}
              <div className="space-y-8">
                
                {/* Leaderboard Widget */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Trophy className="text-yellow-500 w-5 h-5" /> 
                    Bảng vàng Top 5
                  </h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((rank) => (
                      <div key={rank} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                        <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm rounded ${rank === 1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-gray-400 text-black' : rank === 3 ? 'bg-orange-700 text-white' : 'text-gray-500 bg-white/5'}`}>
                          {rank}
                        </div>
                        <img src={`https://i.pravatar.cc/150?img=${rank + 10}`} alt="Avt" className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <div className="text-sm font-bold group-hover:text-fuchsia-400 transition-colors">Player_{rank}99</div>
                          <div className="text-xs text-gray-500">2,500 MMR</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm text-gray-400 border border-white/10 rounded hover:bg-white/5 hover:text-white transition-colors">
                    Xem bảng xếp hạng đầy đủ
                  </button>
                </div>

                {/* Clan/Friends Active */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="text-blue-500 w-5 h-5" /> 
                    Bạn bè Online (3)
                  </h3>
                  <div className="space-y-3">
                    <FriendRow name="DragonSlayer" status="In Match" statusColor="text-yellow-500" />
                    <FriendRow name="NoobMaster69" status="Online" statusColor="text-green-500" />
                    <FriendRow name="ProGamervn" status="Lobby" statusColor="text-blue-500" />
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

// --- Sub Components ---

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${active ? 'bg-fuchsia-600/10 text-fuchsia-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    <Icon size={20} className={`${active ? 'text-fuchsia-400' : 'text-gray-500 group-hover:text-white'} transition-colors`} />
    {label}
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]"></div>}
  </button>
);

const StatCard = ({ icon: Icon, label, value, subValue, color, gradient }) => (
  <div className={`p-6 rounded-2xl bg-neutral-900/80 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-[40px] -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100`}></div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${color}`}>
        <Icon size={24} />
      </div>
      <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className={`text-xs ${value.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{subValue}</div>
    </div>
  </div>
);

const MatchRow = ({ result, score, map, kda, date, money }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group">
    <div className="flex items-center gap-4">
      <div className={`w-1 h-12 rounded-full ${result === 'Win' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
      <div>
        <div className={`font-bold text-lg ${result === 'Win' ? 'text-green-400' : 'text-gray-400'}`}>{result.toUpperCase()}</div>
        <div className="text-xs text-gray-500">{map}</div>
      </div>
    </div>
    <div className="text-center hidden sm:block">
      <div className="font-bold text-white tracking-wider">{score}</div>
      <div className="text-xs text-gray-500">Score</div>
    </div>
    <div className="text-center hidden sm:block">
      <div className="font-medium text-gray-300">{kda}</div>
      <div className="text-xs text-gray-500">K/D/A</div>
    </div>
    <div className="text-right">
      <div className={`font-bold ${money.includes('+') ? 'text-yellow-400' : 'text-gray-400'}`}>{money}</div>
      <div className="text-xs text-gray-500">{date}</div>
    </div>
  </div>
);

const FriendRow = ({ name, status, statusColor }) => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <img src={`https://i.pravatar.cc/150?u=${name}`} alt={name} className="w-8 h-8 rounded-full" />
      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${status === 'Online' ? 'bg-green-500' : status === 'In Match' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
    </div>
    <div className="flex-1">
      <div className="text-sm font-bold text-white hover:text-fuchsia-400 cursor-pointer transition-colors">{name}</div>
      <div className={`text-xs ${statusColor}`}>{status}</div>
    </div>
    <button className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
      <Plus size={14} />
    </button>
  </div>
);

const UserProfileDropup = ({ onLogout, onSettings, onProfile }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in-up">
            <button 
              onClick={() => { onProfile(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-b border-white/5"
            >
              <Users size={16} /> Hồ sơ
            </button>
            <button 
              onClick={() => { onSettings(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-b border-white/5"
            >
              <Settings size={16} /> Cài đặt
            </button>
            <button 
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 -m-2 rounded-xl cursor-pointer transition-colors ${isOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 p-[2px]">
          <img src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=100&h=100" alt="User" className="w-full h-full rounded-full object-cover border-2 border-black" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-bold truncate">ShadowHunter</h4>
          <p className="text-xs text-gray-400">Level 42</p>
        </div>
        <div className="text-gray-500">
           <ChevronRight size={16} className={`transition-transform duration-300 ${isOpen ? '-rotate-90' : ''}`} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;