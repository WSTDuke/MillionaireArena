import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { TOURNAMENT_CONFIG } from '../../../lib/constants';
import { getRankFromMMR } from '../../../lib/ranking';

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

interface MatchMonitorProps {
  userClanId: string | undefined;
  onMatchDetected: (matchData: { matchId: string, clan1: ClanInfo, clan2: ClanInfo | null, members1: MatchMember[], members2: MatchMember[], matchTime: string }) => void;
  isOpen: boolean;
}

const MatchMonitor = ({ userClanId, onMatchDetected, isOpen }: MatchMonitorProps) => {
  const [lastMatchId, setLastMatchId] = useState<string | null>(null);

  const fetchClanMembers = useCallback(async (clanId: string): Promise<MatchMember[]> => {
    try {
      const { data: memberData, error } = await supabase
        .from('clan_members')
        .select(`
          user_id,
          profiles (
            id,
            display_name,
            avatar_url,
            mmr
          )
        `)
        .eq('clan_id', clanId)
        .eq('status', 'approved')
        .limit(5);

      if (error) throw error;

      return memberData.map(m => {
        const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        const rankInfo = getRankFromMMR(prof?.mmr || 0);
        return {
          id: prof?.id || Math.random().toString(),
          name: prof?.display_name || 'Chiến Binh',
          avatar: prof?.avatar_url || undefined,
          rank: `${rankInfo.tier} ${rankInfo.division}`,
          rankColor: rankInfo.color
        };
      });
    } catch (err) {
      console.error('Error fetching clan members for overlay:', err);
      // Mock fallback if failed or empty
      return Array.from({ length: 5 }).map((_, i) => ({
        id: `mock-${i}`,
        name: `Elite Player ${i + 1}`,
        rank: 'GOLD IV',
        rankColor: '#fbbf24'
      }));
    }
  }, []);

  useEffect(() => {
    if (isOpen || !userClanId) return;

    const checkInterval = setInterval(async () => {
      const storageKey = `bracket_${TOURNAMENT_CONFIG.ID}_${TOURNAMENT_CONFIG.START_TIME}`;
      const savedBracketStr = localStorage.getItem(storageKey);
      if (!savedBracketStr) return;

      const matches = JSON.parse(savedBracketStr);
      const now = new Date().getTime();

      // Find an upcoming or live match for the user's clan
      const myMatch = matches.find((m: { id: string, clan1: any, clan2: any, status: string, scheduledTime: string }) => 
        (m.clan1?.id === userClanId || m.clan2?.id === userClanId) && 
        m.status !== 'completed'
      );

      if (myMatch && myMatch.id !== lastMatchId) {
        const matchStartTime = new Date(myMatch.scheduledTime).getTime();
        const diffSeconds = (matchStartTime - now) / 1000;

        // Trigger if match starts in less than 35 seconds (buffer)
        if (diffSeconds <= 35 && diffSeconds > -30) {
          const isClan1User = myMatch.clan1?.id === userClanId;
          const userClan = isClan1User ? myMatch.clan1 : myMatch.clan2;
          const opponentClan = isClan1User ? myMatch.clan2 : myMatch.clan1;

          if (!userClan) return; // Should not happen

          // Fetch members
          const [m1, m2] = await Promise.all([
             fetchClanMembers(userClan.id),
             opponentClan ? fetchClanMembers(opponentClan.id) : Promise.resolve([])
          ]);

          onMatchDetected({
            matchId: myMatch.id,
            clan1: userClan,
            clan2: opponentClan,
            members1: m1,
            members2: m2,
            matchTime: new Date(myMatch.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          });
          setLastMatchId(myMatch.id);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [userClanId, onMatchDetected, isOpen, lastMatchId, fetchClanMembers]);

  return null;
};

export default MatchMonitor;
