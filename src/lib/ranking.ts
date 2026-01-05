export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Challenger' | 'Unranked';

export interface RankInfo {
  tier: RankTier;
  division: 'I' | 'II' | 'III' | '';
  mmr: number;
  nextMMR: number | null;
  progress: number;
  color: string;
}

const TIER_COLORS: Record<RankTier, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#B9F2FF',
  Master: '#CC33FF',
  Challenger: '#FF3300',
  Unranked: '#9CA3AF',
};

export const getRankFromMMR = (mmr: number | null): RankInfo => {
  if (mmr === null) {
    return {
      tier: 'Unranked',
      division: '',
      mmr: 0,
      nextMMR: null,
      progress: 0,
      color: TIER_COLORS.Unranked,
    };
  }

  // Tiers Bronze (0-299), Silver (300-599), Gold (600-899), Platinum (900-1199), Diamond (1200-1499)
  const tiers: RankTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  
  if (mmr < 1500) {
    const tierIndex = Math.floor(mmr / 300);
    const tier = tiers[tierIndex];
    const divisionMMR = mmr % 300;
    const divisionIndex = Math.floor(divisionMMR / 100);
    const divisions: ('I' | 'II' | 'III')[] = ['III', 'II', 'I'];
    
    return {
      tier,
      division: divisions[divisionIndex],
      mmr,
      nextMMR: mmr - (mmr % 100) + 100,
      progress: divisionMMR % 100,
      color: TIER_COLORS[tier],
    };
  }

  if (mmr < 2500) {
    // Master: 1500 - 2499 (1000 MMR needed for Challenger)
    return {
      tier: 'Master',
      division: '',
      mmr,
      nextMMR: 2500,
      progress: Math.floor(((mmr - 1500) / 1000) * 100),
      color: TIER_COLORS.Master,
    };
  }

  // Challenger: 2500+
  return {
    tier: 'Challenger',
    division: '',
    mmr,
    nextMMR: null,
    progress: 100,
    color: TIER_COLORS.Challenger,
  };
};

export const calculateMMRChange = (currentMMR: number | null, isWin: boolean): number => {
  // Initial Placement
  if (currentMMR === null) {
    return isWin ? 300 : 0; // Silver III or Bronze III
  }

  // Master & Challenger: +/- 100
  if (currentMMR >= 1500) {
    const change = isWin ? 100 : -100;
    const newMMR = currentMMR + change;
    return Math.max(1500, newMMR); // Can't drop below Master? Or can drop back to Diamond?
    // User didn't specify if can drop out of Master.
    // "thời điểm 1500 MMR để lên Thách Đấu" 
    // Let's assume you can drop if MMR goes below 1500.
  }

  // Bronze to Diamond: +/- 25
  const change = isWin ? 25 : -25;
  const newMMR = currentMMR + change;
  return Math.max(0, newMMR);
};
