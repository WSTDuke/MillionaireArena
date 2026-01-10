import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  Users, 
  ArrowLeft, 
  Share2, 
  Shield, 
  Clock, 
  Swords, 
  Award,
  MoreVertical,
  Eye,
  ChevronRight,
  Coins,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Toast, { type ToastType } from '../../components/Toast';
import { CLAN_ICONS } from './clanConstants';

// --- Icon Component Helper ---
const ClanIconDisplay = ({ iconName, color, className = "w-6 h-6" }: { iconName: string, color: string, className?: string }) => {
  // Find the icon object from the array
  const iconObj = CLAN_ICONS.find(item => item.id === iconName);
  const IconComponent = iconObj ? iconObj.icon : Shield;
  
  return <IconComponent className={className} style={{ color: color }} />;
};

interface ClanInfo {
  id: string;
  name: string;
  tag: string;
  role?: string;
  avatar_url?: string;
  icon?: string;
  color?: string;
  members_count?: number;
}

interface DashboardContext {
  dashboardCache: {
    clanInfo?: ClanInfo | null;
    [key: string]: unknown;
  };
}

// Interfaces for fetched data
interface Tournament {
  id: string;
  title: string;
  status: string;
  prize_pool: string;
  entry_fee: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  tournament_type: string;
  image_url: string;
  description: string;
  rules: string[];
  prizes: { rank: string; reward: string; special?: string }[];
}

interface TournamentRegistration {
  id: string;
  clan_id: string;
  status: string;
  clans: ClanInfo;
}

const TournamentDetailView = () => {
  const { dashboardCache } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>(); // Get ID from URL
  const [activeTab, setActiveTab] = useState(location.state?.returnTab || 'overview');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [toast, setToast] = useState<{ message: React.ReactNode, type: ToastType } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorType, setErrorType] = useState<'role' | 'no-clan' | 'member-count' | null>(null);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use the clan info from global cache
  const clanInfo = dashboardCache.clanInfo;

  // Fallback/Mock data if DB is empty or during transition
  const defaultTournament: Tournament = {
    id: id || 'community-weekly-cup-42',
    title: 'Community Weekly Cup #42',
    status: 'Đang diễn ra',
    prize_pool: '10.000',
    max_participants: 16,
    start_date: '05 Jan, 2025',
    end_date: '10 Jan, 2025',
    tournament_type: 'SOLO 5v5',
    entry_fee: 500,
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
    description: 'Giải đấu thường niên dành cho cộng đồng MillionMind. Nơi quy tụ những cao thủ hàng đầu để tranh tài và giành lấy vinh quang.',
    rules: [
      'Thi đấu theo thể thức loại trực tiếp (Single Elimination).',
      'Mỗi trận đấu diễn ra trong 30 phút.',
      'Người chơi phải có mặt trước 15 phút.',
      'Nghiêm cấm mọi hành vi gian lận.'
    ],
    prizes: [
      { rank: '1st', reward: '5.000 ',special:'Huy hiệu độc quyền' },
      { rank: '2nd', reward: '3.000 ' },
      { rank: '3rd-4th', reward: '1.000 ' }
    ]
  };

  const fetchTournamentData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
        // 1. Fetch Tournament Details
        setTournament(defaultTournament); 

        // 2. Fetch Registrations (Real Data)
        const { data: regData, error: regError } = await supabase
            .from('tournament_registrations')
            .select(`
                id,
                clan_id,
                status,
                clans (
                    id,
                    name,
                    tag,
                    icon,
                    color
                )
            `)
            .eq('tournament_id', id);

        if (regError) throw regError;
        
        const formattedRegs = regData?.map(item => ({
            id: item.id,
            clan_id: item.clan_id,
            status: item.status,
            clans: Array.isArray(item.clans) ? item.clans[0] : item.clans
        })) as unknown as TournamentRegistration[];

        setRegistrations(formattedRegs || []);

        // 3. Check if current user's clan is registered
        if (clanInfo?.id) {
            const isReg = formattedRegs?.some(r => r.clan_id === clanInfo.id && ['confirmed', 'approved'].includes(r.status));
            setIsRegistered(!!isReg);
        }

    } catch (err) {
        console.error("Error fetching tournament data:", err);
    } finally {
        setLoading(false);
    }
  }, [id, clanInfo?.id]);


  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If clicking inside the dropdown container (which wraps the list),
      // we don't necessarily want to close it, BUT we need to handle specific clicks.
      // Actually, standard pattern is to check if click is OUTSIDE the specific open dropdown or menu.
      // Since we use a single ref for the container, let's just close if clicking outside the list area?
      // Better: bind click handler to window
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
         setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Derived state
  const currentData = tournament || defaultTournament;
  const currentParticipants = registrations.length;
  const maxParticipants = currentData.max_participants;
  const isFull = currentParticipants >= maxParticipants;
  const participantsDisplay = `${currentParticipants}/${maxParticipants}`;


  const handleRegisterClick = () => {
    // 1. Check if user belongs to a clan
    if (!clanInfo) {
      setErrorType('no-clan');
      setShowErrorModal(true);
      return;
    }

    // 2. Check if user is a leader
    if (clanInfo.role !== 'leader') {
      setErrorType('role');
      setShowErrorModal(true);
      return;
    }

    // 3. Check if clan has 5 members
    if ((clanInfo.members_count || 0) < 5) {
      setErrorType('member-count');
      setShowErrorModal(true);
      return;
    }

    // 4. Show confirm modal
    setShowConfirmModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!clanInfo?.id || !id) return;
    
    setIsRegistering(true);
    try {
      // Clean entry fee string to number if needed, or use raw number from logic
      const fee = typeof currentData.entry_fee === 'string' 
          ? parseInt((currentData.entry_fee as string).replace('.', '')) 
          : currentData.entry_fee;

      const { error } = await supabase.rpc('register_clan_for_tournament', {
        p_tournament_id: id,
        p_clan_id: clanInfo.id,
        p_fee: fee
      });

      if (error) throw error;

      setShowConfirmModal(false);
      
      // Show success toast
      setToast({
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-bold">Đăng ký thành công!</span>
            <span className="text-xs opacity-90">Phí tham dự đã được trừ vào tài khoản.</span>
          </div>
        ),
        type: 'success'
      });

      // REFRESH DATA to update participants count
      await fetchTournamentData();

    } catch (err: any) {
      console.error('Registration error:', err);
      // Show error toast or modal update
      setToast({
        message: err.message || "Đăng ký thất bại. Vui lòng thử lại.",
        type: 'error'
      });
      setShowConfirmModal(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // If clicking the same one, close it. If different, open new one.
    if (openDropdownId === id) {
        setOpenDropdownId(null);
    } else {
        setOpenDropdownId(id);
    }
  };

  const handleViewClanDetails = (clanId: string) => {
      navigate(`/dashboard/clan?id=${clanId}`, { 
        state: { 
          returnTo: location.pathname, 
          returnTab: 'teams' 
        } 
      }); 
  };

  if (loading && !tournament) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="animate-spin text-fuchsia-500" size={40} />
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/dashboard/tournaments')}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <div className="p-2 bg-neutral-900 border border-white/10 rounded-lg group-hover:border-fuchsia-500/50 transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Quay lại</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/10 text-gray-400 hover:text-white hover:border-fuchsia-500/30 transition-all rounded-lg">
          <Share2 size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Chia sẻ</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[400px] border border-white/5 bg-neutral-950 overflow-hidden group">
        <div className="absolute inset-0">
          <img 
            src={currentData.image_url} 
            alt={currentData.title} 
            className="w-full h-full object-cover opacity-20 blur-sm group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        </div>

        <div className="absolute relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 bg-fuchsia-600/20 border border-fuchsia-500/50 text-fuchsia-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(192,38,211,0.2)]`}>
              {currentData.status}
            </span>
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">// {currentData.tournament_type}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase italic tracking-tighter max-w-4xl leading-none">
            {currentData.title}
          </h1>

          <div className="flex flex-wrap gap-8 md:gap-16 border-t border-white/10 pt-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/20">
                <Trophy size={24} className="text-fuchsia-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tổng giải thưởng</span>
                <span className="flex items-center gap-2 text-xl font-black text-white italic">{currentData.prize_pool} <Coins size={20} className="text-yellow-500" /></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Users size={24} className="text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số đội tham gia</span>
                <span className="text-xl font-black text-white italic">{participantsDisplay}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <Calendar size={24} className="text-green-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Khởi tranh</span>
                <span className="text-xl font-black text-white italic">{currentData.start_date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {['overview', 'bracket', 'teams', 'matches'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] relative transition-all ${
                  activeTab === tab ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {tab === 'overview' ? 'Tổng quan' : tab === 'bracket' ? 'Nhánh đấu' : tab === 'teams' ? 'Đội tham gia' : 'Trận đấu'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-xl min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-fuchsia-500" /> Giới thiệu
                  </h3>
                  <p className="text-gray-400 leading-relaxed font-medium">
                    {currentData.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                    <Award size={18} className="text-fuchsia-500" /> Cơ cấu giải thưởng
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {currentData.prizes.map((item, index) => (
                      <div key={index} className="p-4 bg-black border border-white/5 rounded-lg flex flex-col items-center text-center gap-2">
                        <span className={`text-sm font-black uppercase ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`}>
                          {item.rank} Place
                        </span>
                        <span className="flex items-center gap-2 text-fuchsia-400 font-bold">{item.reward}<Coins size={20} className="text-yellow-500" /> </span>
                        <span className='text-fuchsia-400 font-bold'>{item.special}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                    <Swords size={18} className="text-fuchsia-500" /> Luật thi đấu
                  </h3>
                  <ul className="space-y-3">
                    {currentData.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-400 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'bracket' && (
              <div className="flex items-center justify-center h-48 text-gray-500 font-bold uppercase tracking-wider">
                   Các nhánh đấu sẽ xuát hiện khi giải đấu bắt đầu.
              </div>
            )}

             {activeTab === 'teams' && (
              <div className="space-y-4" ref={dropdownRef}>
                {registrations.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-500 font-bold uppercase tracking-wider">
                        Chưa có đội nào đăng ký
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {registrations.map((reg) => (
                            <div key={reg.id} className="flex items-center justify-between p-4 bg-neutral-900 border border-white/5 rounded-lg group hover:border-fuchsia-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center border border-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                                        <ClanIconDisplay 
                                            iconName={reg.clans.icon || 'Shield'} 
                                            color={reg.clans.color || '#d946ef'} 
                                            className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-fuchsia-500 uppercase tracking-wider px-1.5 py-0.5 bg-fuchsia-500/10 rounded border border-fuchsia-500/20">
                                                [{reg.clans.tag}]
                                            </span>
                                            <h4 className="text-white font-bold leading-none">{reg.clans.name}</h4>
                                        </div>
     
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${['confirmed', 'approved'].includes(reg.status) ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {['confirmed', 'approved'].includes(reg.status) ? 'Đã xác nhận' : 'Đang chờ duyệt'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <button 
                                        onClick={(e) => toggleDropdown(reg.id, e)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors outline-none"
                                    >
                                        <MoreVertical size={18} className="translate-y-[1px]" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openDropdownId === reg.id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                            <div className="p-1">
                                                <button 
                                                    onClick={() => handleViewClanDetails(reg.clan_id)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                                >
                                                    <Eye size={14} />
                                                    Xem chi tiết Clan
                                                </button>
                                                {/* Add more options here if needed later */}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            )}

             {activeTab === 'matches' && (
              <div className="flex items-center justify-center h-48 text-gray-500 font-bold uppercase tracking-wider">
                Các trận đấu sẽ xuất khi giải đấu bắt đầu.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-fuchsia-500/30 pb-3">
                Thông tin đăng ký
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Lệ phí</span>
                  <span className="flex items-center gap-1 text-white font-black">{currentData.entry_fee} <Coins size={14} className="text-yellow-500" /></span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Ngày kết thúc đăng ký</span>
                  <span className="text-white font-black text-right">04 Jan, 2025<br/><span className="text-[10px] text-fuchsia-500">23:59 GMT+7</span></span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Chế độ</span>
                  <span className="text-white font-black">{currentData.tournament_type} Clan</span>
                </div>
              </div>

              <button 
                onClick={handleRegisterClick}
                disabled={isFull || isRegistered || isRegistering}
                className={`w-full py-4 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 
                ${isFull || isRegistered
                  ? 'bg-neutral-800 text-gray-500 cursor-not-allowed border border-white/5' 
                  : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white group-hover:shadow-[0_0_20px_rgba(192,38,211,0.4)]'
                }`}
            >
              {isRegistering ? (
                 <Loader2 className="animate-spin" size={16} />
              ) : isRegistered 
                ? 'Đã đăng ký'
                : isFull 
                  ? 'Đã đóng (Full)' 
                  : <>Đăng ký ngay <ChevronRight size={16} /></>
              }
            </button>
            </div>
          </div>    

          <div className="p-6 bg-neutral-900 border border-white/5 rounded-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-3">
              Tin tức liên quan
            </h3>
            <div className="space-y-4">
               {[1, 2].map(i => (
                 <div key={i} className="group cursor-pointer">
                    <span className="text-[10px] text-fuchsia-500 font-bold uppercase mb-1 block">Tin tức</span>
                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors leading-tight mb-2">
                       Cập nhật thay đổi luật thi đấu mùa giải 2025
                    </h4>
                    <span className="text-[10px] text-gray-600 flex items-center gap-2">
                       <Clock size={10} /> 2 giờ trước
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-neutral-900 border border-fuchsia-500/30 rounded-2xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(192,38,211,0.2)] md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-blue-600" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="w-20 h-20 bg-fuchsia-500/10 rounded-full flex items-center justify-center border border-fuchsia-500/20 mb-2">
                    <Trophy size={40} className="text-fuchsia-500" />
                 </div>
                 
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Xác nhận Đăng ký?</h3>
                   <p className="text-gray-400 text-sm font-bold leading-relaxed px-4">
                     Bạn đang đăng ký tham gia <span className="text-white">{currentData.title}</span> với tư cách là <span className="text-fuchsia-500">Trưởng Clan</span>.
                   </p>
                   <p className="text-xs text-fuchsia-400 font-bold bg-fuchsia-500/10 py-2 px-4 rounded-lg mt-2 inline-block border border-fuchsia-500/10">
                     Phí tham dự: {currentData.entry_fee} <Coins size={12} className="inline text-yellow-500" />
                   </p>
                 </div>

                 <div className="flex gap-4 w-full pt-4">
                       <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase tracking-widest text-xs rounded-xl border border-white/5 transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={handleConfirmRegistration}
                      disabled={isRegistering}
                      className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isRegistering && <Loader2 className="animate-spin" size={16} />}
                      Xác nhận
                    </button>

                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Error/Alert Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-neutral-900 border border-red-500/30 rounded-2xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-2">
                    <AlertTriangle size={40} className="text-red-500" />
                 </div>
                 
                  <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                     {errorType === 'role' 
                        ? 'Quyền hạn bị từ chối' 
                        : errorType === 'no-clan' 
                           ? 'Chưa tham gia Clan' 
                           : 'Số lượng thành viên không đủ'}
                   </h3>
                   <p className="text-gray-400 text-sm font-bold leading-relaxed px-2">
                     {errorType === 'role' 
                        ? 'Chỉ Trưởng Clan (Leader) mới có quyền đăng ký tham gia giải đấu này.' 
                        : errorType === 'no-clan'
                           ? 'Bạn cần gia nhập hoặc tạo một Clan để tham gia giải đấu.'
                           : 'Clan của bạn cần có đủ 5 thành viên để đăng ký tham gia giải đấu này.'}
                   </p>
                   {errorType !== 'member-count' && (
                     <p className="text-xs text-red-400 font-bold mt-2">
                        Việc vắng mặt khi đã đăng ký sẽ bị xử thua.
                     </p>
                   )}
                 </div>

                 <button 
                   onClick={() => setShowErrorModal(false)}
                   className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-xl border border-white/5 transition-all mt-4"
                 >
                   Đã hiểu
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

    </div>
  );
};

export default TournamentDetailView;
