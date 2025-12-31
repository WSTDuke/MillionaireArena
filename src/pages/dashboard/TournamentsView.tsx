import { useState, useRef, useEffect } from 'react';
import { Trophy, Calendar, Users, DollarSign, Filter, Search, ArrowRight } from 'lucide-react';
import { TournamentsPageSkeleton } from '../../components/LoadingSkeletons';

const TournamentsView = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // 2. Khởi tạo Ref để đánh dấu vị trí muốn trượt tới
  const tabsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1">
            Giải đấu
          </h1>
          <p className="text-gray-400">Tham gia tranh tài, giành giải thưởng lớn.</p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 focus-within:border-yellow-500/50 transition-colors">
             <Search size={18} className="text-gray-500" />
             <input type="text" placeholder="Tìm giải đấu..." className="bg-transparent border-none outline-none text-sm ml-2 w-48 text-white placeholder-gray-600" />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-300">
             <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Featured Tournament (Hero) */}
      <div className="relative rounded-2xl overflow-hidden border border-yellow-500/20 group h-[400px]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        
        <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse">
          <Trophy size={16} /> Major Event
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="text-yellow-400 font-bold tracking-widest text-sm">WINTER SEASON 2024</span>
             <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
             <span className="text-gray-300 text-sm">Official Tournament</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-3xl leading-tight">
            MillionMind Championship Series
          </h2>
          <div className="flex flex-wrap gap-6 mb-8 text-sm md:text-base">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={18} className="text-fuchsia-500" /> 15/01/2025 - 30/01/2025
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Users size={18} className="text-blue-500" /> 32 Đội tham gia
            </div>
          </div>
          
          <div className="flex gap-4">
            {/* 4. Gắn hàm onClick vào nút Đăng ký */}
            <button 
              onClick={handleScrollToTabs}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center gap-2"
            >
              Đăng ký ngay <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all">
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {/* 5. Gắn ref vào đây. Class scroll-mt-24 giúp khi trượt xuống nó cách mép trên một chút */}
      <div 
        ref={tabsSectionRef} 
        className="flex gap-4 border-b border-white/10 pb-1 overflow-x-auto scroll-mt-24"
      >
        {['all', 'upcoming', 'ongoing', 'completed'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-bold capitalize transition-colors relative ${filter === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'all' ? 'Tất cả' : tab === 'upcoming' ? 'Sắp diễn ra' : tab === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
            {filter === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>}
          </button>
        ))}
      </div>

      {/* Tournament List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <TournamentCard 
          image="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
          title="Community Weekly Cup #42"
          date="05 Jan, 2025"
          prize="$500"
          slots="16/16"
          status="Ongoing"
          tags={["5v5", "Weekly"]}
        />
      </div>

    </div>
  );
};

// --- Sub Components ---

const TournamentCard = ({ image, title, date, prize, slots, status, tags }: any) => {
  const isCtaActive = status === 'Upcoming' || (status === 'Ongoing' && !slots.includes('FULL'));
  
  return (
    <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden group hover:border-yellow-500/50 transition-all hover:translate-y-[-4px]">
      <div className="h-40 relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
          {status}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex gap-2 mb-3">
          {tags.map((tag: string, idx: number) => (
             <span key={idx} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-1 rounded">
               {tag}
             </span>
          ))}
        </div>
        
        <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors" title={title}>{title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-400 gap-2">
            <Calendar size={14} className="text-fuchsia-500" /> {date}
          </div>
          <div className="flex items-center text-sm text-gray-400 gap-2">
            <DollarSign size={14} className="text-green-500" /> Prize: <span className="text-green-400 font-bold">{prize}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400 gap-2">
            <Users size={14} className="text-blue-500" /> Slots: <span className="text-white">{slots}</span>
          </div>
        </div>

        <button 
          disabled={!isCtaActive}
          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors border ${
            isCtaActive 
              ? 'bg-yellow-500 text-black hover:bg-yellow-400 border-yellow-500' 
              : 'bg-white/5 text-gray-500 cursor-not-allowed border-white/5'
          }`}
        >
          {status === 'Completed' ? 'Xem kết quả' : status === 'Ongoing' ? 'Xem trực tiếp' : 'Đăng ký ngay'}
        </button>
      </div>
    </div>
  );
}

export default TournamentsView;