import { useState, useEffect } from 'react';
import { Clock, Swords, Shield } from 'lucide-react';
import { CLAN_ICONS } from '../clanConstants';

interface MatchMember {
  id: string;
  name: string;
  avatar?: string;
  rank: string;
  rankColor: string;
}

interface ClanInfo {
  id: string;
  name: string;
  tag: string;
  icon: string;
  color: string;
}

interface MatchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  clan1: ClanInfo;
  clan2: ClanInfo | null;
  members1: MatchMember[];
  members2: MatchMember[];
  matchTime: string;
}

const ClanIconDisplay = ({ iconName, color, className = "w-12 h-12" }: { iconName: string, color: string, className?: string }) => {
  const iconObj = CLAN_ICONS.find(item => item.id === iconName);
  const IconComponent = iconObj ? iconObj.icon : Shield;
  return <IconComponent className={className} style={{ color: color }} />;
};

const PlayerCard = ({ player, side }: { player: MatchMember, side: 'left' | 'right' }) => (
  <div className={`relative w-full h-40 md:h-52 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden group transition-all hover:border-fuchsia-500/50 group`}>
    {/* Background Image Placeholder / Aesthetic Blur */}
    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
      <img 
        src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`} 
        alt={player.name} 
        className="w-full h-full object-cover blur-sm scale-110 group-hover:scale-100 transition-transform duration-700"
      />
    </div>

    {/* Info Overlay */}
    <div className="absolute inset-0 z-20 p-4 flex flex-col justify-end">
        <div className="space-y-1">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Player</span>
            <h4 className="text-sm md:text-base font-black text-white uppercase italic tracking-tighter truncate leading-none">
                {player.name}
            </h4>
            <div 
               className="inline-block mt-1 px-3 py-1 rounded-sm border border-white/10 bg-black/40 backdrop-blur-md"
               style={{ borderColor: `${player.rankColor}40` }}
            >
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: player.rankColor }}>
                    {player.rank}
                </span>
            </div>
        </div>
    </div>

    {/* Side Glow Line */}
    <div 
        className={`absolute bottom-0 left-0 w-full h-1`}
        style={{ backgroundColor: side === 'left' ? '#d946ef' : '#3b82f6' }}
    />
  </div>
);

const MatchOverlay = ({ isOpen, onClose, clan1, clan2, members1, members2, matchTime }: MatchOverlayProps) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black animate-in fade-in duration-500 overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-fuchsia-900/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-blue-900/5 blur-[120px]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />
      </div>

      {/* Header Info */}
      <div className="relative z-10 px-8 py-10 flex flex-col items-center">
         <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded">
                <span className="text-xs font-black text-fuchsia-500 uppercase tracking-[0.3em]">Cặp Đấu Đang Khởi Tranh</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
                <Clock size={14} className="text-blue-500" />
                <span className="text-xs font-black text-white italic">{matchTime}</span>
            </div>
         </div>
         <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
            Quét & Kiểm Tra <span className="text-fuchsia-500">Đối Thủ</span>
         </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 px-4 md:px-12 flex items-center justify-between gap-4 md:gap-12">
        {/* Team 1 (Left) */}
        <div className="flex-1 flex flex-col items-center space-y-8 animate-in slide-in-from-left-8 duration-700">
           <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-fuchsia-600 to-transparent opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                <ClanIconDisplay iconName={clan1.icon} color={clan1.color} className="w-16 h-16 md:w-20 md:h-20" />
              </div>
              <div className="text-center">
                 <h3 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                   {clan1.name}
                 </h3>
                 <span className="text-sm font-black text-fuchsia-500 uppercase tracking-[0.3em]">[{clan1.tag}]</span>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-5xl">
              {members1.map((p, idx) => (
                <div key={p.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 0.1}s` }}>
                   <PlayerCard player={p} side="left" />
                </div>
              ))}
           </div>
        </div>

        {/* Center VS & Timer */}
        <div className="flex flex-col items-center justify-center space-y-8 py-20 min-w-[120px]">
           <div className="relative group">
              <div className="absolute animate-ping -inset-4 bg-white/5 rounded-full blur-2xl" />
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-2 border-fuchsia-500 flex items-center justify-center relative">
                 <span className="text-3xl md:text-5xl font-black text-black italic italic-extreme tracking-tight">VS</span>
              </div>
           </div>

           <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Ready In</span>
              <div className="text-5xl font-black text-white tabular-nums italic">
                 {timeLeft.toString().padStart(2, '0')}
              </div>
              <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-fuchsia-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                 />
              </div>
           </div>
        </div>

        {/* Team 2 (Right) */}
        <div className="flex-1 flex flex-col items-center space-y-8 animate-in slide-in-from-right-8 duration-700">
           <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 to-transparent opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                {clan2 ? (
                    <ClanIconDisplay iconName={clan2.icon} color={clan2.color} className="w-16 h-16 md:w-20 md:h-20" />
                ) : (
                    <Swords className="w-16 h-16 md:w-20 md:h-20 text-neutral-800" />
                )}
              </div>
              <div className="text-center">
                 <h3 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                   {clan2?.name || "ĐANG CHỜ..."}
                 </h3>
                 <span className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">[{clan2?.tag || "???"}]</span>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-5xl">
              {members2.length > 0 ? members2.map((p, idx) => (
                <div key={p.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 0.1}s` }}>
                   <PlayerCard player={p} side="right" />
                </div>
              )) : Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="w-full h-40 md:h-52 bg-neutral-900/40 border border-white/5 rounded-xl animate-pulse" />
              ))}
           </div>
        </div>
      </div>

      {/* Interaction Footer */}
      <div className="relative z-10 p-12 flex justify-center">
         <button 
           onClick={timeLeft === 0 ? onClose : undefined}
           className={`px-12 py-5 text-sm font-black uppercase tracking-[0.3em] italic transition-all shadow-2xl rounded-sm ${timeLeft === 0 ? 'bg-white text-black hover:bg-fuchsia-500 hover:text-white' : 'bg-neutral-900 text-gray-500 cursor-not-allowed border border-white/5'}`}
         >
           {timeLeft === 0 ? 'VÀO TRẬN ĐẤU' : `ĐANG CHUẨN BỊ (${timeLeft}s)`}
         </button>
      </div>

      {/* Cyber Overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
         <div className="w-full h-full bg-scanline animate-scanline" />
      </div>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20" />
    </div>
  );
};

export default MatchOverlay;
