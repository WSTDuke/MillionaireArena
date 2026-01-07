import React, { useState } from "react";
import { useNavigate, NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getRankFromMMR } from "../../lib/ranking";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Settings,
  Search,
  LogOut,
  Users,
  ChevronRight,
  Bookmark,
  Plus,
  Shield,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dashboardCache, setDashboardCache] = useState<Record<string, any>>({});

  React.useEffect(() => {
    const getData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    getData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isLinkActive = (path: string) => {
    // Exact match for root dashboard (overview)
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    // For other paths, check if it starts with the path (e.g. /dashboard/settings)
    if (path !== "/dashboard" && location.pathname.startsWith(path))
      return true;
    return false;
  };

  const getPageInfo = () => {
      return { title: 'SẢNH ĐẤU', bg: 'bg-neutral-800' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="h-screen bg-black text-white font-sans flex selection:bg-fuchsia-500 selection:text-white overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 hidden lg:flex flex-col border-r border-white/10 bg-neutral-950/50 backdrop-blur-xl h-screen fixed top-0 left-0 z-50">
        {/* Logo */}
        <Link to="/dashboard">
          <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 justify-center">
            <div className="text-xl font-bold">
              <span className="text-white">MillionMind</span>
              <span className="text-fuchsia-500">Arena</span>
            </div>
          </div>
        </Link>
        {/* Navigation */}
        <nav className="flex-1 justify-between h-full">
          <div className="flex-1 space-y-2 p-4">
            <NavItem
              icon={LayoutDashboard}
              label="Tổng quan"
              to="/dashboard"
              active={isLinkActive("/dashboard")}
            />
            <NavItem
              icon={Swords}
              label="Đấu trường"
              to="/dashboard/arena"
              active={isLinkActive("/dashboard/arena")}
            />
             <NavItem
              icon={Bookmark}
              label="Xếp hạng"
              to="/dashboard/ranking"
              active={isLinkActive("/dashboard/ranking")}
            />
            <NavItem
              icon={Trophy}
              label="Giải đấu"
              to="/dashboard/tournaments"
              active={isLinkActive("/dashboard/tournaments")}
            />
           
            <NavItem
              icon={Shield}
              label="Clan / Đội"
              to="/dashboard/clan"
              active={isLinkActive("/dashboard/clan")}
            />
            <div className="pt-4 pb-2">
              <div className="h-px bg-white/10 mx-2"></div>
            </div>
          </div>
        </nav>

        {/* User Mini Profile (Bottom Sidebar) */}
        <div className="p-4 border-t border-white/5 bg-neutral-900/50">
          <UserProfileDropup
            user={user}
            profile={profile}
            onLogout={handleLogout}
            onSettings={() => navigate("/dashboard/settings")}
            onProfile={() => navigate("/dashboard/profile")}
          />
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 lg:ml-64 relative flex flex-col h-full">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-fuchsia-900/10 blur-[120px] pointer-events-none"></div>

        {/* Header - TRAPEZOID STYLE - REFINED */}
        <div className="relative h-16 shrink-0 mb-2 flex items-center justify-between px-6 z-50 bg-gradient-to-b from-neutral-900/80 to-transparent">
            {/* Background Line (Top Border) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5"></div>

            {/* LEAVE LEFT EMPTY FOR NOW (Sidebar handles Nav) */}
            <div className="flex items-center gap-6 h-full z-10 w-1/3">
                 {/* Optional: Add Breadcrumbs here later */}
            </div>

            {/* Center: TRAPEZOID DYNAMIC TITLE */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full">
                   <Link to={"/dashboard/arena"}>
                <div className={`relative w-[320px] h-full cursor-pointer ${pageInfo.bg} flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-all duration-500 group`}
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}>
                    {/* Inner Gradient/Shine */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                    
                    {/* Text */}
                    <div className="relative z-10 flex flex-col items-center -mt-1 ">
                        <div className="flex items-center gap-4 text-sm font-black text-white/20 hover:text-white uppercase tracking-[0.25em] drop-shadow-md group-hover:text-fuchsia-100 transition-colors">
                            <Swords size={16} className="mr-2" />
                            {pageInfo.title}
                        </div>
                    </div>
                    
                    {/* Bottom active line */}
                    <div className="absolute bottom-0 w-1/2 h-[2px] bg-white/20 group-hover:bg-white/50 transition-colors"></div>
                </div>
                </Link>
            </div>

            {/* Right: Search & Coins */}
            <div className="flex items-center justify-end gap-4 h-full z-10 w-1/3">
                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-neutral-900 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:border-fuchsia-500/50 transition-colors">
                  <Search size={18} className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm người chơi..."
                    className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-gray-600"
                  />
                </div>

                {/* Gold Balance & Add button */}
                <div className="flex items-center gap-3 bg-neutral-900/50 border border-white/5 rounded-full px-4 py-1.5 hover:border-white/10 transition-all select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">🪙</span>
                    <span className="text-sm font-black text-yellow-500">
                      {profile?.gold?.toLocaleString() || 0}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate("/dashboard/payment")}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-fuchsia-600/20 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white transition-all border border-fuchsia-500/30"
                    title="Nạp vàng"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
            </div>
        </div>

        {/* Dashboard Content Scrollable */}
        <div className="p-8 h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-20">
          <Outlet context={{ user, profile, setProfile, dashboardCache, setDashboardCache }} />
        </div>
      </main>
    </div>
  );
};

// --- Sub Components ---

const NavItem = ({ icon: Icon, label, active, to }: { icon: React.ElementType, label: string, active: boolean, to: string }) => (
  <NavLink
    to={to}
    end={to === "/dashboard"}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
      active
        ? "bg-fuchsia-600/10 text-fuchsia-400"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    <Icon
      size={20}
      className={`${
        active ? "text-fuchsia-400" : "text-gray-500 group-hover:text-white"
      } transition-colors`}
    />
    {label}
    {active && (
      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]"></div>
    )}
  </NavLink>
);

const UserProfileDropup = ({
  user,
  profile,
  onLogout,
  onSettings,
  onProfile,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayName =
    profile?.display_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "User";

  // Chỉ hiển thị khi đã có profile để tránh flash hiển thị "User" -> username -> display name
  if (!profile) {
    return (
      <div className="flex items-center gap-3 p-2 -m-2 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse"></div>
        <div className="flex-1 overflow-hidden space-y-2">
          <div className="h-4 bg-neutral-800 rounded animate-pulse w-24"></div>
          <div className="h-3 bg-neutral-800 rounded animate-pulse w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in-up">
            <button
              onClick={() => {
                onProfile();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-b border-white/5"
            >
              <Users size={16} /> Hồ sơ
            </button>
            <button
              onClick={() => {
                onSettings();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-b border-white/5"
            >
              <Settings size={16} /> Cài đặt
            </button>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 -m-2 rounded-xl cursor-pointer transition-colors ${
          isOpen ? "bg-white/10" : "hover:bg-white/5"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 p-[2px]">
          <img
            src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
            alt="User"
            className="w-full h-full rounded-full object-cover border-2 border-black"
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-bold truncate">{displayName}</h4>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium" style={{ color: getRankFromMMR(profile?.mmr ?? null).color }}>
              Hạng: {getRankFromMMR(profile?.mmr ?? null).tier} {getRankFromMMR(profile?.mmr ?? null).division}
            </p>
            <div className="w-1 h-1 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="text-gray-500">
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${
              isOpen ? "-rotate-90" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
