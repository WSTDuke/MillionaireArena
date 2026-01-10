import { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, Filter, Search, ArrowRight, Coins } from 'lucide-react';
import { TournamentsPageSkeleton } from '../../components/LoadingSkeletons';
import { supabase } from '../../lib/supabase';

interface TournamentData {
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
  registration_count: number;
}

// Define the type for the dashboard cache
type DashboardCacheType = {
  tournamentsLoaded: boolean;
  [key: string]: unknown;
};

// Define the context type for useOutletContext
interface DashboardContext {
  dashboardCache: DashboardCacheType;
  setDashboardCache: React.Dispatch<React.SetStateAction<DashboardCacheType>>;
}

const TournamentsView = () => {
  const { dashboardCache, setDashboardCache } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(!dashboardCache.tournamentsLoaded);
  const tabsSectionRef = useRef<HTMLDivElement>(null);
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTournamentsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch tournaments
      const { data: tournamentData, error: tError } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_registrations (count)
        `);

      if (tError) {
        console.warn('Tournaments table might not exist yet, using fallback:', tError);
      }

      if (tournamentData && tournamentData.length > 0) {
        const formattedData = tournamentData.map(t => ({
          ...t,
          registration_count: t.tournament_registrations?.[0]?.count || 0,
          prize_pool: t.prize_pool || "1000", // Fallback if column missing
          tournament_type: t.tournament_type || "SOLO 5v5" // Fallback if column missing
        })) as TournamentData[];
        setTournaments(formattedData);
      } else {
        // Fallback: If no tournaments in DB, show the default one but fetch ITS real counts
        const { count, error: regError } = await supabase
          .from('tournament_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', 'community-weekly-cup-42');
        
        if (regError) console.error('Error fetching fallback counts:', regError);

        setTournaments([{
          id: 'community-weekly-cup-42',
          title: 'Community Weekly Cup #42',
          status: 'Đang diễn ra',
          prize_pool: '1000',
          entry_fee: 0,
          max_participants: 16,
          start_date: '05 Jan, 2025',
          end_date: '10 Jan, 2025',
          tournament_type: 'SOLO 5v5',
          image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
          description: 'Giải đấu hàng tuần cho cộng đồng.',
          registration_count: count || 0
        }]);
      }
    } catch (err) {
      console.error('Error in fetchTournamentsData:', err);
    } finally {
      setLoading(false);
      setDashboardCache((prev: DashboardCacheType) => ({ ...prev, tournamentsLoaded: true }));
    }
  }, [setDashboardCache]);

  useEffect(() => {
    fetchTournamentsData();
  }, [fetchTournamentsData]);

  // 3. Hàm xử lý hiệu ứng trượt
  const handleScrollToTabs = () => {
    if (tabsSectionRef.current) {
      tabsSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', // <--- QUAN TRỌNG: Tạo hiệu ứng trượt mượt
        block: 'start'      // Trượt để phần tử nằm ở đầu khung nhìn
      });
    }
  };

  if (loading) return <TournamentsPageSkeleton />;


  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header - Tech Sector Style */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 relative">
        <div className="relative z-10 w-full md:w-auto">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4 rounded-sm">
              <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">Competitive Sector // Tournaments</span>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
             Giải Đấu <span className="text-fuchsia-500">Tournaments</span>
           </h1>
           <div className="h-0.5 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mt-2"></div>
           <p className="text-gray-500 mt-4 font-bold max-w-lg text-sm leading-relaxed">
             Chinh phục những <span className="text-gray-300">đỉnh cao vinh quang</span> và khẳng định vị thế của bạn trong hệ thống Arena.
           </p>
        </div>
      </div>

      

      {/* Featured Tournament (Hero) - Geometric Tech Style */}
      <div className="relative group min-h-[450px] border border-white/5 bg-neutral-950 overflow-hidden">
        {/* Background Image with Scanlines */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop" 
            alt="Tournament Banner" 
            className="w-full h-full object-cover opacity-10 blur-sm group-hover:blur-none transition-all duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
          <div className="absolute inset-0 bg-dot-pattern opacity-10" />
          <div className="absolute inset-x-0 top-0 h-1 bg-fuchsia-500/10 animate-scanline-fast opacity-0 group-hover:opacity-100 pointer-events-none" />
        </div>

        {/* HUD Frame */}
        <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-fuchsia-500/40" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-fuchsia-500/40" />
        
        <div className="absolute top-8 right-8 z-10 flex items-center gap-3">
           <div className="px-4 py-2 bg-black border border-fuchsia-500/50 text-fuchsia-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-[0_0_15px_rgba(192,38,211,0.2)]">
             <Trophy size={14} className="animate-bounce" /> Giải đấu thường niên
           </div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end p-10 md:p-16">
          <div className="flex items-center gap-3 mb-4">
             <span className="text-fuchsia-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Season_Alpha // 2024</span>
             <div className="w-1 h-3 bg-fuchsia-500/50 skew-x-[-20deg]"></div>
             <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Protocol Approved</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 max-w-4xl tracking-tighter uppercase italic leading-[0.9]">
            MillionMind <br />
            <span className="text-fuchsia-500">Championship Series</span>
          </h2>

          <div className="flex flex-wrap gap-10 mb-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 italic">Thời gian diễn ra</span>
              <div className="flex items-center gap-3 text-white font-black text-base italic tracking-tight">
                <Calendar size={18} className="text-fuchsia-500" /> 15/01/2025 - 30/01/2025
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 italic">Số đọi tham gia</span>
              <div className="flex items-center gap-3 text-white font-black text-base italic tracking-tight">
                <Users size={18} className="text-blue-500" /> 32 CLAN
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleScrollToTabs}
              className="px-10 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(192,38,211,0.4)] flex items-center gap-3 hover:translate-y-[-2px] active:scale-95"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              Tham gia <ArrowRight size={20} />
            </button>
            <button 
              className="px-10 py-5 bg-black border border-white/10 text-gray-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-white/5 transition-all"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>

    {/* Search & Filter - Tech Style */}
      <div className="flex flex-col md:flex-row items-center gap-4 w-1/2">
        <div className="flex-1 w-full flex items-center bg-black border border-white/10 px-6 py-3 focus-within:border-fuchsia-500/50 transition-all relative">
           <Search size={20} className="text-fuchsia-500" />
           <input 
             type="text" 
             placeholder="QUÉT TÌM GIẢI ĐẤU [DATABASE]..." 
             className="bg-transparent border-none outline-none text-[11px] font-black tracking-[0.2em] ml-4 w-full text-white placeholder-gray-700 uppercase" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fuchsia-500/30" />
           <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fuchsia-500/30" />
        </div>
        <button className="p-3 bg-neutral-950 border border-white/10 text-gray-500 hover:text-fuchsia-500 hover:border-fuchsia-500/50 transition-all shadow-xl group">
           <Filter size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Tabs - Tech Style */}
      <div 
        ref={tabsSectionRef} 
        className="flex gap-10 border-b border-white/5 pb-1 overflow-x-auto scroll-mt-24 no-scrollbar"
      >
        {['all', 'upcoming', 'ongoing', 'completed'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${filter === tab ? 'text-fuchsia-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'all' ? 'Tất cả' : tab === 'upcoming' ? 'Sắp diễn ra' : tab === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
            {filter === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />}
          </button>
        ))}
      </div>

      {/* Tournament List - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {tournaments
          .filter(t => {
            if (filter !== 'all' && t.status !== (filter === 'upcoming' ? 'Sắp diễn ra' : filter === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc')) return false;
            if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
          })
          .map((t) => (
          <TournamentCard 
            key={t.id}
            image={t.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"}
            title={t.title}
            date={t.start_date}
            prize={t.prize_pool}
            participants={`${t.registration_count}/${t.max_participants}`}
            status={t.status}
            type={t.tournament_type}
            entryFee={t.entry_fee === 0 ? "miễn phí" : `${t.entry_fee} Gold`}
            onClick={() => navigate(t.id)}
          />
        ))}
        {tournaments.length === 0 && !loading && (
          <div className="col-span-full py-20 bg-neutral-900/50 border border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
            <Trophy size={48} className="text-gray-800 mb-4" />
            <span className="text-sm font-black text-gray-600 uppercase tracking-widest">Không tìm thấy giải đấu nào</span>
          </div>
        )}
      </div>

    </div>
  );
};

// --- Sub Components ---

interface TournamentCardProps {
  title: string;
  status: string;
  prize: string;
  participants: string;
  date: string;
  type: string;
  entryFee: string;
  image: string;
  onClick?: () => void;
}

const TournamentCard = ({ title, status, prize, participants, date, type, entryFee, image, onClick }: TournamentCardProps) => {
  const statusConfig: Record<string, { label: string; glow: string; text: string }> = {
    'Sắp diễn ra': { label: 'Sắp diễn ra', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]', text: 'text-blue-400' },
    'Đang diễn ra': { label: 'Đang diễn ra', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]', text: 'text-green-400' },
    'Đã kết thúc': { label: 'Đã kết thúc', glow: 'shadow-[0_0_10px_rgba(107,114,128,0.3)]', text: 'text-gray-500' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Sắp diễn ra'];

  return (
    <div 
      onClick={onClick}
      className="group relative bg-neutral-950 border border-white/10 hover:border-fuchsia-500/50 transition-all overflow-hidden flex flex-col h-full shadow-2xl cursor-pointer"
    >
      {/* Visual Accents */}
      <div className="absolute inset-0 bg-dot-pattern opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* HUD Corners */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/5 pointer-events-none" />

      {/* Media Layer */}
      <div className="h-44 relative overflow-hidden bg-black">
        <img src={image} alt={title} className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-1000 scale-105 group-hover:scale-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
        
        {/* Status Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`px-2 py-1 bg-black/80 border border-white/10 ${config.text} text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${config.glow}`}>
             <span className="w-1 h-3 bg-current skew-x-[-20deg]" />
             {config.label}
          </div>
        </div>

        {/* Info Overlay */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-2 py-1 bg-fuchsia-600 text-white text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
             {entryFee}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 relative z-10">
        <div className="mb-6">
           <span className="text-[9px] font-black text-fuchsia-500/60 uppercase tracking-[0.3em] mb-2 block italic">// {type}</span>
           <h3 className="text-lg font-black text-white uppercase tracking-tighter italic leading-tight group-hover:text-fuchsia-500 transition-colors">{title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="p-3 bg-black border border-white/5 relative overflow-hidden group-hover:border-fuchsia-500/20 transition-colors">
              <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 italic">Tổng giải thưởng</div>
              <div className="flex items-center gap-1 text-sm font-black text-fuchsia-500 tabular-nums italic">{prize} <span className="text-[10px] opacity-40"><Coins size={16} className="text-yellow-500"/></span></div>
           </div>
           <div className="p-3 bg-black border border-white/5 relative overflow-hidden group-hover:border-fuchsia-500/20 transition-colors">
              <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 italic">Số lượng clan</div>
              <div className="text-sm font-black text-white tabular-nums tracking-tighter italic">{participants}</div>
           </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
           <div className="flex items-center gap-3">
              <Calendar size={14} className="text-gray-600" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-0.5">Ngày bắt đầu</span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight italic">{date}</span>
              </div>
           </div>
           
           <button 
             className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
               status === 'Sắp diễn ra' 
               ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:bg-fuchsia-500' 
               : 'bg-white/5 text-gray-600 hover:text-white border border-white/10'
             } active:scale-95`}
             style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
           >
             {status === 'Sắp diễn ra' ? 'Request' : 'Tham gia'}
           </button>
        </div>
      </div>
      
      {/* Hover Scanline */}
      <div className="absolute inset-x-0 top-0 h-1 bg-fuchsia-500/20 animate-scanline-fast opacity-0 group-hover:opacity-100 pointer-events-none" />
    </div>
  );
};

export default TournamentsView;