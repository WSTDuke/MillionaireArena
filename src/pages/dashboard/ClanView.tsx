import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Shield, Trophy, Plus, Search, MoreVertical, Crown, Settings, LogOut, Target, AlertTriangle, Loader2 } from 'lucide-react';
import CreateClanModal from '../../components/modals/CreateClanModal';
import { CLAN_ICONS, CLAN_COLORS } from './clanConstants';
import { supabase } from '../../lib/supabase';

interface ClanInfo {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  members_count: number;
  role?: string;
}

interface MemberInfo {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    full_name: string | null;
  }
}

const ClanView = () => {
  const { user } = useOutletContext<{ 
    user: { id: string }; 
  }>();

  const [activeTab, setActiveTab] = useState('find-clan'); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [targetMember, setTargetMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [recommendedClans, setRecommendedClans] = useState<ClanInfo[]>([]);

  const fetchMembers = useCallback(async (clanId: string) => {
    const { data: rawMembers, error: rawError } = await supabase
      .from('clan_members')
      .select('user_id, role, joined_at')
      .eq('clan_id', clanId)
      .order('role', { ascending: true });
    
    if (rawError) {
      console.error('Members fetch error:', rawError);
      return [];
    } else if (rawMembers && rawMembers.length > 0) {
      const userIds = rawMembers.map(m => m.user_id);
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, full_name')
        .in('id', userIds);
      
      if (profError) {
        console.error('Profiles fetch error:', profError);
        return rawMembers.map(m => ({
          ...m,
          profiles: { display_name: null, avatar_url: null, full_name: null }
        })) as MemberInfo[];
      } else {
        const mappedMembers = rawMembers.map(m => ({
          ...m,
          profiles: profilesData?.find(p => p.id === m.user_id) || { display_name: null, avatar_url: null, full_name: null }
        }));
        return mappedMembers as MemberInfo[];
      }
    }
    return [];
  }, []);

  const fetchClanData = useCallback(async (isInitialLoad = true) => {
    if (!user?.id) return;
    if (isInitialLoad) setLoading(true);
    console.log('Fetching clan data for user:', user.id);

    let clanIdForSubscription: string | null = null;

    try {
      const { data: membership, error: memError } = await supabase
        .from('clan_members')
        .select(`
          clan_id,
          role,
          clans (id, name, tag, description, icon, color, level, members_count)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memError) throw memError;

      if (membership && membership.clans) {
        const clanDataRaw = membership.clans;
        const clan = Array.isArray(clanDataRaw) ? clanDataRaw[0] : clanDataRaw;
        
        if (clan) {
          clanIdForSubscription = clan.id;
          const membersList = await fetchMembers(clan.id);
          setMembers(membersList);
          setClanInfo({
            id: clan.id,
            name: clan.name,
            tag: clan.tag,
            description: clan.description,
            icon: clan.icon,
            color: clan.color,
            level: clan.level,
            members_count: membersList.length, // Update count based on actual members
            role: membership.role
          });
          setActiveTab('my-clan');
        } else {
          setClanInfo(null);
          setActiveTab('find-clan');
        }
      } else {
        setClanInfo(null);
        setActiveTab('find-clan');
      }
    } catch (err: any) {
      console.error('Error fetching clan data:', err);
      alert('Lỗi khi tải thông tin Clan: ' + err.message);
    } finally {
      if (isInitialLoad) {
        try {
          const { data: clans, error: clansError } = await supabase
            .from('clans')
            .select('*')
            .order('members_count', { ascending: false })
            .limit(10);
          if (clansError) throw clansError;
          setRecommendedClans(clans || []);
        } catch (err: any) {
          console.error('Error fetching recommended clans:', err);
        }
        setLoading(false);
      }
      return clanIdForSubscription;
    }
  }, [user?.id, fetchMembers]);

  useEffect(() => {
    fetchClanData();

    const channel = supabase.channel('clan-changes');
    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'clan_members', 
      }, (payload) => {
        console.log('Clan members change received!', payload);
        // Refetch data without setting loading state
        fetchClanData(false);
      })
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchClanData]);

  const handleCreateClan = async (data: { name: string; tag: string; description: string; icon: string; color: string }) => {
    if (!user?.id) return;
    try {
      const { data: newClan, error: createError } = await supabase
        .from('clans')
        .insert({
          name: data.name,
          tag: data.tag,
          description: data.description,
          icon: data.icon,
          color: data.color,
          creator_id: user.id,
          members_count: 1 // Starts with 1 member
        })
        .select()
        .single();
      if (createError) throw createError;
      const { error: joinError } = await supabase
        .from('clan_members')
        .insert({
          clan_id: newClan.id,
          user_id: user.id,
          role: 'leader'
        });
      if (joinError) throw joinError;
      await fetchClanData();
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating clan:', err);
      alert(err.message || 'Lỗi khi tạo Clan. Vui lòng thử lại.');
    }
  };

  const handleJoinClan = async (clanId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('clan_members')
        .insert({ clan_id: clanId, user_id: user.id, role: 'member' });
      if (error) throw error;
      // The realtime listener will handle the UI update. 
      // Manual refetch is a good fallback.
      await fetchClanData(false);
    } catch (err: any) {
      console.error('Error joining clan:', err);
      alert(err.message || 'Lỗi khi gia nhập Clan.');
    }
  };

  const handleLeave = async () => {
    if (!clanInfo?.id || !user?.id) return;
    
    // Prevent leader from leaving
    if (clanInfo.role === 'leader') {
      alert('Trưởng nhóm không thể rời clan. Hãy chuyển giao quyền lãnh đạo trước.');
      setShowLeaveConfirm(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('clan_members')
        .delete()
        .match({ user_id: user.id, clan_id: clanInfo.id });

      if (error) throw error;
      // Realtime listener will trigger refetch. 
      // But we can also clear the state immediately for faster UI feedback.
      setClanInfo(null);
      setMembers([]);
      setActiveTab('find-clan');
      setShowLeaveConfirm(false);
      await fetchClanData(false); // Refetch recommended clans etc.
    } catch (err: any) {
      console.error('Error leaving clan:', err);
      alert(err.message || 'Lỗi khi rời Clan.');
    }
  };

  const handleKickRequest = (member: MemberInfo) => {
    if (!clanInfo?.id || !user?.id) return;
    if (clanInfo.role !== 'leader') {
      alert('Chỉ trưởng nhóm mới có quyền xóa thành viên.');
      return;
    }
    if (member.user_id === user.id) {
      alert('Bạn không thể xóa chính mình khỏi clan.');
      return;
    }
    setTargetMember(member);
    setShowKickConfirm(true);
  };

  const handleKickMember = async () => {
    if (!clanInfo?.id || !targetMember) return;
    
    try {
      const { error } = await supabase
        .from('clan_members')
        .delete()
        .match({ user_id: targetMember.user_id, clan_id: clanInfo.id });

      if (error) throw error;
      
      // UI will update via realtime subscription, but immediate update feels better
      setMembers(prev => prev.filter(m => m.user_id !== targetMember.user_id));
      
      setShowKickConfirm(false);
      setTargetMember(null);
    } catch (err: any) {
      alert('Lỗi khi xóa thành viên: ' + err.message);
      // Let realtime handle state correction on error
    }
  };

  const handlePromoteRequest = (member: MemberInfo) => {
    if (!clanInfo?.id || !user?.id) return;
    if (clanInfo.role !== 'leader') {
      alert('Chỉ trưởng nhóm mới có quyền phong thành viên làm trưởng nhóm.');
      return;
    }
    if (member.user_id === user.id) {
      alert('Bạn đã là trưởng nhóm rồi.');
      return;
    }
    setTargetMember(member);
setShowPromoteConfirm(true);
  };

  const handlePromoteToLeader = async () => {
    if (!clanInfo?.id || !targetMember || !user?.id) return;
    
    try {
      // Use RPC to ensure atomic transfer
      const { error } = await supabase.rpc('transfer_clan_leadership', {
        new_leader_id: targetMember.user_id,
        old_leader_id: user.id,
        p_clan_id: clanInfo.id
      });
      
      if (error) throw error;

      // UI will update via realtime subscription.
      setShowPromoteConfirm(false);
      setTargetMember(null);
    } catch (err: any) {
      alert('Lỗi khi phong trưởng nhóm: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest">Đang tải dữ liệu Clan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-1">
            Clan / Đội
          </h1>
          <p className="text-gray-400">Quản lý đội ngũ, chiêu mộ thành viên và leo hạng Team.</p>
        </div>
        
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('my-clan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-clan' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Đội của tôi
          </button>
          <button 
            onClick={() => setActiveTab('find-clan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'find-clan' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Tìm Clan
          </button>
        </div>
      </div>

      {activeTab === 'my-clan' ? (
        <MyClanSection 
          clanInfo={clanInfo} 
          members={members}
          currentUserId={user?.id}
          onLeaveRequest={() => setShowLeaveConfirm(true)}
          onCreateClan={() => setShowCreateModal(true)} 
          onKick={handleKickRequest}
          onPromote={handlePromoteRequest}
        />
      ) : (
        <FindClanSection 
          hasClan={!!clanInfo} 
          recommendedClans={recommendedClans}
          onCreateClan={() => setShowCreateModal(true)} 
          onJoinClan={handleJoinClan}
        />
      )}

      <CreateClanModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClan}
      />

      <ConfirmModal 
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeave}
        title="Xác nhận Rời Clan?"
        message={`Bạn sẽ mất toàn bộ quyền lợi và đóng góp tại ${clanInfo?.name}. Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận Rời"
        cancelText="Để tôi nghĩ lại"
        type="danger"
      />

      <ConfirmModal 
        isOpen={showKickConfirm}
        onClose={() => { setShowKickConfirm(false); setTargetMember(null); }}
        onConfirm={handleKickMember}
        title="Xác nhận Xóa Thành viên?"
        message={`Bạn có chắc chắn muốn xóa "${targetMember?.profiles?.display_name || targetMember?.profiles?.full_name || 'thành viên này'}" ra khỏi ${clanInfo?.name}? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận Xóa"
        cancelText="Hủy"
        type="danger"
      />

      <ConfirmModal 
        isOpen={showPromoteConfirm}
        onClose={() => { setShowPromoteConfirm(false); setTargetMember(null); }}
        onConfirm={handlePromoteToLeader}
        title="Xác nhận Phong Trưởng nhóm?"
        message={`Bạn có chắc chắn muốn phong "${targetMember?.profiles?.display_name || targetMember?.profiles?.full_name || 'thành viên này'}" làm trưởng nhóm của ${clanInfo?.name}? Bạn sẽ trở thành thành viên.`}
        confirmText="Xác nhận Phong"
        cancelText="Hủy"
        type="info"
      />

    </div>
  );
};

// --- Sections ---

const MyClanSection = ({ 
  clanInfo, 
  members, 
  currentUserId, 
  onCreateClan, 
  onLeaveRequest,
  onKick,
  onPromote
}: { 
  clanInfo: ClanInfo | null; 
  members: MemberInfo[];
  currentUserId?: string;
  onCreateClan: () => void;
  onLeaveRequest: () => void;
  onKick: (member: MemberInfo) => void;
  onPromote: (member: MemberInfo) => void;
}) => {
  const hasClan = !!clanInfo; 
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedIconObj = CLAN_ICONS.find(i => i.id === clanInfo?.icon) || CLAN_ICONS[0];
  const selectedColorObj = CLAN_COLORS.find(c => c.id === clanInfo?.color) || CLAN_COLORS[0];
  const ClanIcon = hasClan ? selectedIconObj.icon : Shield;

  return (
    <div className="space-y-8">
      {/* Hero / Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 bg-neutral-900 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252723f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent"></div>
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Logo */}
          <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${hasClan ? selectedColorObj.classes : 'from-blue-600 to-cyan-600'} p-[2px] shadow-[0_0_30px_rgba(37,99,235,0.3)]`}>
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
              <ClanIcon size={64} className={hasClan ? "" : "text-blue-500"} style={{ color: hasClan ? selectedColorObj.hex : undefined }} />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight">
                {hasClan ? clanInfo?.name : "Chưa tham gia Clan"}
              </h2>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                {hasClan ? clanInfo?.tag : "LVL --"}
              </span>
            </div>
            <p className="text-gray-400 max-w-xl mb-8 leading-relaxed">
              {hasClan 
                ? (clanInfo?.description || "Thành viên của một đội ngũ vinh quang, cùng nhau chinh phục những đỉnh cao mới.")
                : "Hãy tìm hoặc tạo một Clan để bắt đầu hành trình cùng đồng đội của bạn!"}
            </p>

            {hasClan && (
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                 <StatBadge icon={Users} label="Thành viên" value={`${members.length}/50`} />
                 <StatBadge icon={Trophy} label="Rank" value="Sơ Nhập" color="text-yellow-400" />
                 <StatBadge icon={Target} label="Tỷ lệ thắng" value="-- %" color="text-green-400" />
              </div>
            )}

            <div className="flex gap-4 justify-center md:justify-start">
              {!hasClan && (
                <>
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                    Tìm Clan
                  </button>
                  <button 
                    onClick={onCreateClan}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10"
                  >
                    Tạo Clan
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Dropdown Button (Banner context - Settings/Leave) */}
          {hasClan && (
            <div className="absolute top-8 right-8">
               <button 
                 onClick={() => setShowDropdown(!showDropdown)}
                 className="p-3 bg-neutral-900/50 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-all shadow-xl"
               >
                 <MoreVertical size={24} />
               </button>

               {showDropdown && (
                 <>
                   <div 
                     className="fixed inset-0 z-[100]" 
                     onClick={() => setShowDropdown(false)}
                   />
                   <div className="absolute right-0 mt-3 w-56 bg-neutral-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-[101] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <button 
                        onClick={() => { setShowDropdown(false); alert('Đang mở Cài đặt...'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                         <Settings size={18} /> Cài đặt Clan
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button 
  onClick={() => { setShowDropdown(false); onLeaveRequest(); }}
  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
    clanInfo?.role === 'leader'
      ? 'text-red-500/40 cursor-not-allowed' 
      : 'text-red-500 hover:bg-red-500/10'
  }`}
  disabled={clanInfo?.role === 'leader'}
  title={clanInfo?.role === 'leader' ? 'Trưởng nhóm không thể rời đi' : 'Rời khỏi Clan'}
>
  <LogOut size={18} /> Rời khỏi Clan
</button>
                   </div>
                 </>
               )}
            </div>
          )}
        </div>
      </div>

      {hasClan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Member List */}
          <div className="lg:col-span-2 bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold flex items-center gap-2">
                 <Users className="text-blue-500" /> Thành viên ({members.length})
               </h3>
               <button className="text-xs font-bold text-blue-400 hover:text-white uppercase tracking-widest">Xem tất cả</button>
             </div>
             
              <div className="space-y-3">
                {members.map((member) => (
                  <MemberRow 
                    key={member.user_id}
                    member={member}
                    isCurrentUser={member.user_id === currentUserId}
                    currentUserRole={clanInfo?.role}
                    onKick={() => onKick(member)}
                    onPromote={() => onPromote(member)}
                  />
                ))}
              </div>
          </div>

          {/* Clan Activities / Wars */}
          <div className="space-y-6">
             <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                 <Trophy className="text-yellow-500" /> Clan Wars
               </h3>
                <div className="space-y-4">
                   <div className="text-center py-10 text-gray-500 italic text-sm">Chưa có hoạt động nào...</div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MemberRow = ({ 
  member, 
  isCurrentUser, 
  currentUserRole, 
  onKick, 
  onPromote 
}: { 
  member: MemberInfo; 
  isCurrentUser: boolean; 
  currentUserRole?: string;
  onKick: (member: MemberInfo) => void;
  onPromote: (member: MemberInfo) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isLeader = member.role === 'leader';
  
  const displayName = member.profiles?.display_name || member.profiles?.full_name || 'Người chơi';
  const avatarUrl = member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`;

  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all relative">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/10 overflow-hidden shadow-lg">
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        </div>
        
        {/* Info */}
        <div>
          <div className="font-black text-white flex items-center gap-2 text-lg">
            {isCurrentUser ? 'Bạn' : displayName} 
            {isLeader && <Crown size={18} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" fill="currentColor" />}
          </div>
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLeader ? 'text-yellow-500/80' : 'text-gray-500'}`}>
            {isLeader ? 'TRƯỞNG NHÓM' : 'THÀNH VIÊN'}
          </div>
        </div>
      </div>

      {/* Actions Trigger (Hidden by default, shown on group hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <MoreVertical size={20} />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
            <div className="absolute right-4 top-14 w-52 bg-neutral-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-[101] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <button 
                onClick={() => { setShowMenu(false); alert('Xem hồ sơ user: ' + member.user_id); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Xem hồ sơ
              </button>

              {/* Leader only actions for non-leader targets */}
              {currentUserRole === 'leader' && !isLeader && !isCurrentUser && (
                <>
                  <div className="h-px bg-white/5 my-1" />
                  <button 
                    onClick={() => { setShowMenu(false); onPromote(member); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-400 hover:text-white hover:bg-blue-500/10 rounded-xl transition-all"
                  >
                    Phong vào trưởng nhóm
                  </button>
                  <button 
                    onClick={() => { setShowMenu(false); onKick(member); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    Xóa khỏi clan
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const FindClanSection = ({ hasClan, recommendedClans, onCreateClan, onJoinClan }: { hasClan: boolean, recommendedClans: ClanInfo[], onCreateClan: () => void, onJoinClan: (id: string) => void }) => {
    return (
        <div className="space-y-6">
             {/* Search Bar */}
            <div className="flex gap-4">
                <div className="flex-1 flex items-center bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
                    <Search size={20} className="text-gray-500" />
                    <input type="text" placeholder="Tìm kiếm Clan bằng tên hoặc tag..." className="bg-transparent border-none outline-none text-base ml-3 w-full text-white placeholder-gray-600" />
                </div>
                {!hasClan && (
                  <button 
                      onClick={onCreateClan}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 animate-in zoom-in duration-300"
                  >
                      <Plus size={20} /> Tạo Clan Mới
                  </button>
                )}
            </div>

            {/* Recommendations List */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="text-blue-500" /> Danh sách Clan
                    </h3>
                </div>
                <div className="divide-y divide-white/5">
                    {recommendedClans.length > 0 ? recommendedClans.map((clan) => (
                      <ClanRow 
                          key={clan.id}
                          name={clan.name}
                          tag={clan.tag}
                          members={clan.members_count} 
                          lvl={clan.level} 
                          desc={clan.description} 
                          hasClan={hasClan}
                          icon={clan.icon}
                          color={clan.color}
                          onJoin={() => onJoinClan(clan.id)}
                      />
                    )) : (
                      <div className="p-12 text-center text-gray-500 italic">Chưa có Clan nào được thành lập.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface ClanRowProps {
  name: string;
  tag: string;
  members: number;
  desc: string;
  lvl: number;
  hasClan: boolean;
  icon: string;
  color: string;
  onJoin?: () => void;
}

const ClanRow = ({ name, tag, members, desc, lvl, hasClan, icon, color, onJoin }: ClanRowProps) => {
  const iconObj = CLAN_ICONS.find(i => i.id === icon) || CLAN_ICONS[0];
  const colorObj = CLAN_COLORS.find(c => c.id === color) || CLAN_COLORS[0];
  const IconComp = iconObj.icon;

  return (
    <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
      <div className="flex items-center gap-6 flex-1">
        <div className={`w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-inner group-hover:border-blue-500/50 transition-colors`}>
          <IconComp size={28} style={{ color: colorObj.hex }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-lg font-black text-white uppercase tracking-tight truncate">{name}</h4>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">{tag}</span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-1 mb-2 max-w-2xl">{desc}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Users size={12} /> {members}/50 Thành viên
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Trophy size={12} /> Cấp {lvl}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-6">
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl border border-white/5 transition-all">
            Chi tiết
          </button>
          {!hasClan && (
            <button 
              onClick={onJoin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              Tham gia
            </button>
          )}
        </div>
        <button className="p-2 text-gray-500 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

// --- Sub Components ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, confirmText: string, cancelText: string, type?: 'danger' | 'info' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
       <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 text-center space-y-8 animate-in zoom-in-95 duration-300">
          <div className="space-y-4">
             <div className={`w-20 h-20 rounded-[1.5rem] ${type === 'danger' ? 'bg-red-500/10' : 'bg-blue-500/10'} mx-auto flex items-center justify-center border border-white/5 shadow-inner`}>
                {type === 'danger' ? <AlertTriangle size={36} className="text-red-500" /> : <Settings size={36} className="text-blue-500" />}
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h3>
                <p className="text-gray-400 text-sm font-bold leading-relaxed px-4">{message}</p>
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <button 
               onClick={onConfirm}
               className={`w-full py-4 rounded-2xl ${type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg`}
             >
               {confirmText}
             </button>
             <button 
               onClick={onClose}
               className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-all"
             >
               {cancelText}
             </button>
          </div>
       </div>
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color = "text-white" }: { icon: React.ElementType, label: string, value: string, color?: string }) => (
  <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
    <Icon size={16} className="text-gray-500" />
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{label}:</span>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);

export default ClanView;
