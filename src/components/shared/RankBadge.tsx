import React from 'react';
import { Bookmark } from 'lucide-react';
import { getRankFromMMR } from '../../lib/ranking';

interface RankBadgeProps {
  mmr: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProgress?: boolean;
}

const RankBadge: React.FC<RankBadgeProps> = ({ mmr, size = 'md', showProgress = true }) => {
  const rank = getRankFromMMR(mmr);

  // Sizing mapping
  const sizes = {
    sm: { circle: 'w-10 h-10', icon: 20, stroke: 2, gap: 1, stripeH: 'h-[1.5px]', stripeW: 'w-2.5', inset: 'inset-1' },
    md: { circle: 'w-24 h-24', icon: 48, stroke: 2, gap: 1.5, stripeH: 'h-[2.5px]', stripeW: 'w-5', inset: 'inset-2' },
    lg: { circle: 'w-32 h-32', icon: 64, stroke: 2, gap: 2, stripeH: 'h-[3px]', stripeW: 'w-6', inset: 'inset-2.5' },
    xl: { circle: 'w-48 h-48', icon: 80, stroke: 2, gap: 2.5, stripeH: 'h-[4px]', stripeW: 'w-8', inset: 'inset-3.5' },
  };

  const s = sizes[size];

  return (
    <div className={`relative ${s.circle}`}>
      {/* Background Circle */}
      <div className={`absolute ${s.inset} bg-neutral-900 rounded-full shadow-inner border border-white/5`}></div>

      {/* Bookmark Icon & Stripes */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <Bookmark 
            size={s.icon} 
            style={{ color: rank.color }} 
            className="drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]" 
          />
          {/* Division Stripes inside Bookmark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] flex flex-col items-center" style={{ gap: `${s.gap}px` }}>
            {Array.from({ length: rank.division === 'III' ? 3 : (rank.division === 'II' ? 2 : 1) }).map((_, idx) => (
              <div 
                key={idx} 
                className={`${s.stripeH} ${s.stripeW} rounded-full opacity-80`}
                style={{ backgroundColor: rank.color, boxShadow: `0 0 8px ${rank.color}` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Circular Progress Overlay */}
      {showProgress && (
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle 
            cx="18" cy="18" r="16" 
            fill="none" stroke="currentColor" 
            strokeWidth={s.stroke} 
            className="text-white/5" 
          />
          <circle 
            cx="18" cy="18" r="16" 
            fill="none" stroke="currentColor" 
            strokeWidth={s.stroke} 
            strokeDasharray={`${rank.progress}, 100`}
            style={{ color: rank.color }}
            className="transition-all duration-[1.5s] ease-out drop-shadow-[0_0_8px_currentColor]"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
};

export default RankBadge;
