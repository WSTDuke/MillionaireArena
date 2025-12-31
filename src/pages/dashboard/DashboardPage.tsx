import React, { useState } from "react";
import {
  useNavigate,
  NavLink,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Settings,
  Bell,
  Search,
  LogOut,
  Users,
  ChevronRight,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <div className="min-h-screen bg-black text-white font-sans flex selection:bg-fuchsia-500 selection:text-white overflow-hidden">
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
              icon={Trophy}
              label="Giải đấu"
              to="/dashboard/tournaments"
              active={isLinkActive("/dashboard/tournaments")}
            />
            <NavItem
              icon={Users}
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
      <main className="flex-1 lg:ml-64 relative">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-fuchsia-900/10 blur-[120px] pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4 text-gray-400">
            <Swords className="w-8 h-8 text-fuchsia-500 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-neutral-900 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:border-fuchsia-500/50 transition-colors">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Tìm giải đấu, người chơi..."
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-gray-600"
              />
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
          <Outlet context={{ setProfile }} />
        </div>
      </main>
    </div>
  );
};

// --- Sub Components ---

const NavItem = ({ icon: Icon, label, active, to }) => (
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
  const navigate = useNavigate();

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
          <p className="text-xs text-gray-400">Hạng: --</p>
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
