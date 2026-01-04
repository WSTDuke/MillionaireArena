import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, Shield, Trophy, Plus, Search, MoreVertical, Crown, Settings, LogOut, Target, AlertTriangle, Loader2, MailCheck, MailX } from 'lucide-react';
import CreateClanModal from '../../components/modals/CreateClanModal';
import UpdateClanModal from '../../components/modals/UpdateClanModal';
import Toast from '../../components/Toast';
import type { ToastType } from '../../components/Toast';
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
  status: 'approved' | 'pending' | 'rejected';
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [targetMember, setTargetMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [joinRequests, setJoinRequests] = useState<MemberInfo[]>([]);
  const [userClanStatus, setUserClanStatus] = useState<{ [clanId: string]: 'pending' | 'member' }>({});
  const [recommendedClans, setRecommendedClans] = useState<ClanInfo[]>([]);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  
  // Ref to track user's primary clan membership for joined/kicked notifications
  const prevClanIdRef = React.useRef<string | null>(null);
  const isInitialStatusRef = React.useRef(true);
  
  // New state for viewing other clans
  const [viewingClan, setViewingClan] = useState<ClanInfo | null>(null);
  const [viewingMembers, setViewingMembers] = useState<MemberInfo[]>([]);
  const [viewingLoading, setViewingLoading] = useState(false);

  const handleShowToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const fetchMembers = useCallback(async (clanId: string) => {
    const { data: rawMembers, error: rawError } = await supabase
      .from('clan_members')
      .select('user_id, role, joined_at, status')
      .eq('clan_id', clanId)
      .in('status', ['approved', 'pending'])
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
      // First, check for any pending requests by the user
      const { data: pendingRequests, error: pendingError } = await supabase
        .from('clan_members')
        .select('clan_id, status')
        .eq('user_id', user.id);
  
      if (pendingError) throw pendingError;
  
      const statusMap: { [clanId: string]: 'pending' | 'member' } = {};
      let approvedClanMembership = null;
  
      if (pendingRequests) {
        for (const req of pendingRequests) {
          if (req.status === 'approved') {
            approvedClanMembership = req;
            statusMap[req.clan_id] = 'member';
          } else if (req.status === 'pending') {
            statusMap[req.clan_id] = 'pending';
          }
        }
      }
      setUserClanStatus(statusMap);
  
      if (approvedClanMembership) {
        const { data: clanDetails, error: clanError } = await supabase
          .from('clans')
          .select('id, name, tag, description, icon, color, level, members_count')
          .eq('id', (approvedClanMembership as any).clan_id)
          .single();
  
        if (clanError) throw clanError;
  
        const { data: memberDetails, error: memberError } = await supabase
          .from('clan_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('clan_id', (approvedClanMembership as any).clan_id)
          .single();
        if (memberError) throw memberError;
  
        clanIdForSubscription = clanDetails.id;
        const allMembers = await fetchMembers(clanDetails.id);
        const approvedMembers = allMembers.filter(m => m.status === 'approved');
        const requests = allMembers.filter(m => m.status === 'pending');
        
        setMembers(approvedMembers);
        setJoinRequests(requests);
        setClanInfo({
          ...clanDetails,
          members_count: approvedMembers.length,
          role: memberDetails.role
        });
        setActiveTab('my-clan');
  
      } else {
        setClanInfo(null);
        setMembers([]);
        setJoinRequests([]);
        setActiveTab('find-clan');
      }
    } catch (err: any) {
      console.error('Error fetching clan data:', err);
      handleShowToast('Lỗi khi tải thông tin Clan: ' + err.message, 'error');
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

  const handleViewClanDetails = async (clanId: string) => {
    setViewingLoading(true);
    try {
      const { data: clanDetails, error: clanError } = await supabase
        .from('clans')
        .select('id, name, tag, description, icon, color, level, members_count')
        .eq('id', clanId)
        .single();

      if (clanError) throw clanError;

      const membersData = await fetchMembers(clanDetails.id);
      const approvedMembers = membersData.filter(m => m.status === 'approved');
      
      setViewingClan({
        ...clanDetails,
        members_count: approvedMembers.length
      });
      setViewingMembers(approvedMembers);
    } catch (err: any) {
      console.error('Error viewing clan details:', err);
      handleShowToast('Không thể tải thông tin clan: ' + err.message, 'error');
    } finally {
      setViewingLoading(false);
    }
  };

  const handleBackToList = () => {
    setViewingClan(null);
    setViewingMembers([]);
  };

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
          role: 'leader',
          status: 'approved'
        });
      if (joinError) throw joinError;
      await fetchClanData();
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating clan:', err);
      handleShowToast(err.message || 'Lỗi khi tạo Clan. Vui lòng thử lại.', 'error');
    }
  };

  const handleUpdateClan = async (data: { name: string; tag: string; description: string; icon: string; color: string }) => {
    if (!user?.id || !clanInfo?.id) return;
    try {
      const { data: result, error: updateError } = await supabase.rpc('update_clan_settings', {
        p_clan_id: clanInfo.id,
        p_user_id: user.id,
        p_name: data.name,
        p_tag: data.tag,
        p_description: data.description,
        p_icon: data.icon,
        p_color: data.color,
        p_cost: 200
      });

      if (updateError) throw updateError;
      
      if (result && !result.success) {
        handleShowToast(result.message, 'error');
        return;
      }

      // Success
      await fetchClanData(false);
      setShowUpdateModal(false);
      handleShowToast('Cập nhật Clan thành công! (Đã trừ 200 🪙)', 'success');
    } catch (err: any) {
      console.error('Error updating clan:', err);
      handleShowToast(err.message || 'Lỗi khi cập nhật Clan.', 'error');
    }
  };

  const handleRequestToJoinClan = async (clanId: string) => {
    if (!user?.id || clanInfo) return; // Already in a clan
    if (userClanStatus[clanId] === 'pending') {
      handleShowToast('Yêu cầu đã được gửi. Vui lòng chờ trưởng nhóm xét duyệt.', 'info');
      return;
    }
    try {
      const { error } = await supabase
        .from('clan_members')
        .insert({ clan_id: clanId, user_id: user.id, role: 'member', status: 'pending' });
      if (error) throw error;
      
      setUserClanStatus(prev => ({...prev, [clanId]: 'pending' }));
      handleShowToast('Đã gửi yêu cầu tham gia Clan!', 'success');
    } catch (err: any) {
      console.error('Error requesting to join clan:', err);
      handleShowToast(err.message || 'Lỗi khi gửi yêu cầu tham gia Clan.', 'error');
    }
  };

  const handleCancelRequest = async (clanId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('clan_members')
        .delete()
        .match({ clan_id: clanId, user_id: user.id, status: 'pending' });
      if (error) throw error;
      setUserClanStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[clanId];
        return newStatus;
      });
    } catch (err: any) {
      console.error('Error cancelling request:', err);
      handleShowToast(err.message || 'Lỗi khi hủy yêu cầu.', 'error');
    }
  };

  const handleAcceptRequest = async (request: MemberInfo) => {
    if (clanInfo?.role !== 'leader') return;
    try {
      const { error } = await supabase
        .from('clan_members')
        .update({ status: 'approved' })
        .match({ clan_id: clanInfo.id, user_id: request.user_id });
      if (error) throw error;
      handleShowToast('Đã duyệt thành viên mới!', 'success');
      // Realtime will update the lists
    } catch (err: any) {
      console.error('Error accepting request:', err);
      handleShowToast(err.message || 'Lỗi khi chấp nhận yêu cầu.', 'error');
    }
  };
  
  const handleRejectRequest = async (request: MemberInfo) => {
    if (clanInfo?.role !== 'leader') return;
    try {
      const { error } = await supabase
        .from('clan_members')
        .delete() // We just delete the request row
        .match({ clan_id: clanInfo.id, user_id: request.user_id });
      if (error) throw error;
      handleShowToast('Đã từ chối yêu cầu.', 'info');
      // Realtime will update the lists
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      handleShowToast(err.message || 'Lỗi khi từ chối yêu cầu.', 'error');
    }
  };

  const handleLeave = async () => {
    if (!clanInfo?.id || !user?.id) return;
    
    // Prevent leader from leaving
    if (clanInfo.role === 'leader') {
      handleShowToast('Trưởng nhóm không thể rời clan. Hãy chuyển giao quyền lãnh đạo trước.', 'error');
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
      setJoinRequests([]);
      setActiveTab('find-clan');
      setShowLeaveConfirm(false);
      await fetchClanData(false); // Refetch recommended clans etc.
    } catch (err: any) {
      console.error('Error leaving clan:', err);
      handleShowToast(err.message || 'Lỗi khi rời Clan.', 'error');
    }
  };

  const handleKickRequest = (member: MemberInfo) => {
    if (!clanInfo?.id || !user?.id) return;
    if (clanInfo.role !== 'leader') {
      handleShowToast('Chỉ trưởng nhóm mới có quyền xóa thành viên.', 'error');
      return;
    }
    if (member.user_id === user.id) {
      handleShowToast('Bạn không thể xóa chính mình khỏi clan.', 'error');
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
      setJoinRequests(prev => prev.filter(req => req.user_id !== targetMember.user_id));
      
      setShowKickConfirm(false);
      setTargetMember(null);
      handleShowToast('Đã xóa thành viên khỏi Clan.', 'info');
    } catch (err: any) {
      handleShowToast('Lỗi khi xóa thành viên: ' + err.message, 'error');
      // Let realtime handle state correction on error
    }
  };

  const handlePromoteRequest = (member: MemberInfo) => {
    if (!clanInfo?.id || !user?.id) return;
    if (clanInfo.role !== 'leader') {
      handleShowToast('Chỉ trưởng nhóm mới có quyền phong thành viên làm trưởng nhóm.', 'error');
      return;
    }
    if (member.user_id === user.id) {
      handleShowToast('Bạn đã là trưởng nhóm rồi.', 'info');
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
      handleShowToast('Đã phong trưởng nhóm mới thành công!', 'success');
    } catch (err: any) {
      handleShowToast('Lỗi khi phong trưởng nhóm: ' + err.message, 'error');
    }
  };

  // Effect to detect when user joined or was kicked from a clan
  useEffect(() => {
    // Wait until the initial load is complete before setting baseline or triggering toasts
    if (loading && isInitialStatusRef.current) return;

    const currentClanId = clanInfo?.id || null;
    
    if (isInitialStatusRef.current) {
      prevClanIdRef.current = currentClanId;
      isInitialStatusRef.current = false;
      return;
    }

    if (prevClanIdRef.current === null && currentClanId !== null) {
      handleShowToast(`Chào mừng bạn gia nhập Clan: ${clanInfo?.name}!`, 'success');
    } else if (prevClanIdRef.current !== null && currentClanId === null) {
      handleShowToast('Bạn đã rời khỏi hoặc bị xóa khỏi Clan.', 'info');
    }

    prevClanIdRef.current = currentClanId;
  }, [clanInfo?.id, clanInfo?.name, loading]);

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
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Header - Only show if not viewing a specific clan */}
      {!viewingClan && (
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-6">
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
      )}

      {viewingClan ? (
        <div className="space-y-6">
          <button 
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group hover:translate-x-[-4px]"
          >
            <div className="p-2 bg-neutral-900 border border-white/10 rounded-xl group-hover:border-white/20 transition-all shadow-xl">
              <LogOut className="rotate-180 w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Quay lại danh sách Clan</span>
          </button>

          {viewingLoading ? (
            <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest">Đang tải chi tiết Clan...</p>
            </div>
          ) : (
            <MyClanSection 
              clanInfo={viewingClan} 
              members={viewingMembers}
              joinRequests={[]}
              currentUserId={user?.id}
              isViewingOnly={true}
              onLeaveRequest={() => {}}
              onCreateClan={() => {}} 
              onKick={() => {}}
              onPromote={() => {}}
              onAcceptRequest={() => {}}
              onRejectRequest={() => {}}
            />
          )}
        </div>
      ) : activeTab === 'my-clan' ? (
        <MyClanSection 
          clanInfo={clanInfo} 
          members={members}
          joinRequests={joinRequests}
          currentUserId={user?.id}
          onLeaveRequest={() => setShowLeaveConfirm(true)}
          onCreateClan={() => setShowCreateModal(true)} 
          onKick={handleKickRequest}
          onPromote={handlePromoteRequest}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onSettingsClick={() => setShowUpdateModal(true)}
        />
      ) : (
        <FindClanSection 
          userClanStatus={userClanStatus}
          recommendedClans={recommendedClans}
          onCreateClan={() => setShowCreateModal(true)} 
          onJoinClan={handleRequestToJoinClan}
          onCancelRequest={handleCancelRequest}
          onViewDetails={handleViewClanDetails}
        />
      )}

      <CreateClanModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClan}
      />

      {clanInfo && (
        <UpdateClanModal 
          key={showUpdateModal ? 'open' : 'closed'}
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={handleUpdateClan}
          initialData={{
            name: clanInfo.name,
            tag: clanInfo.tag,
            description: clanInfo.description,
            icon: clanInfo.icon,
            color: clanInfo.color
          }}
        />
      )}

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
  joinRequests,
  currentUserId, 
  onCreateClan, 
  onLeaveRequest,
  onKick,
  onPromote,
  onAcceptRequest,
  onRejectRequest,
  onSettingsClick,
  isViewingOnly = false,
}: { 
  clanInfo: ClanInfo | null; 
  members: MemberInfo[];
  joinRequests: MemberInfo[];
  currentUserId?: string;
  onCreateClan: () => void;
  onLeaveRequest: () => void;
  onKick: (member: MemberInfo) => void;
  onPromote: (member: MemberInfo) => void;
  onAcceptRequest: (request: MemberInfo) => void;
  onRejectRequest: (request: MemberInfo) => void;
  onSettingsClick?: () => void;
  isViewingOnly?: boolean;
}) => {
  const hasClan = !!clanInfo; 
  const [showDropdown, setShowDropdown] = useState(false);
  const [membersTab, setMembersTab] = useState('members');
  const isLeader = clanInfo?.role === 'leader';

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
          {hasClan && !isViewingOnly && (
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
                        onClick={() => { setShowDropdown(false); onSettingsClick?.(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                          clanInfo?.role === 'leader'
                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                            : 'text-gray-400/40 cursor-not-allowed'
                        }`}
                        disabled={clanInfo?.role !== 'leader'}
                        title={clanInfo?.role !== 'leader' ? 'Chỉ trưởng nhóm mới có quyền cài đặt' : 'Cài đặt Clan'}
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
          <div className={`${isViewingOnly ? 'lg:col-span-3' : 'lg:col-span-2'} bg-neutral-900/50 border border-white/5 rounded-2xl p-6`}>
             <div className="flex justify-between items-center mb-6">
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/10">
                    <button 
                    onClick={() => setMembersTab('members')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${membersTab === 'members' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                    Thành viên ({members.length})
                    </button>
                    {isLeader && !isViewingOnly && (
                    <button 
                        onClick={() => setMembersTab('requests')}
                        className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all ${membersTab === 'requests' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Yêu cầu tham gia
                        {joinRequests.length > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {joinRequests.length}
                        </span>
                        )}
                    </button>
                    )}
                </div>
             </div>
             
              <div className="space-y-3">
                {membersTab === 'members' && members.map((member) => (
                  <MemberRow 
                    key={member.user_id}
                    member={member}
                    isCurrentUser={member.user_id === currentUserId}
                    currentUserRole={clanInfo?.role}
                    onKick={() => onKick(member)}
                    onPromote={() => onPromote(member)}
                  />
                ))}
                {membersTab === 'requests' && isLeader && joinRequests.map((req) => (
                  <RequestRow 
                    key={req.user_id}
                    request={req}
                    onAccept={() => onAcceptRequest(req)}
                    onReject={() => onRejectRequest(req)}
                  />
                ))}
                {membersTab === 'requests' && isLeader && joinRequests.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Không có yêu cầu tham gia nào.</p>
                )}
              </div>
          </div>

          {/* Clan Activities / Wars */}
          {!isViewingOnly && (
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
          )}
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
  const navigate = useNavigate();
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
                onClick={() => { setShowMenu(false); navigate(`/dashboard/profile?id=${member.user_id}`); }}
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

const RequestRow = ({
    request,
    onAccept,
    onReject
}: {
    request: MemberInfo;
    onAccept: () => void;
    onReject: () => void;
}) => {
    const displayName = request.profiles?.display_name || request.profiles?.full_name || 'Người chơi';
    const avatarUrl = request.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.user_id}`;

    return (
        <div className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all relative">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/10 overflow-hidden shadow-lg">
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                    <div className="font-black text-white text-lg">{displayName}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        Đang chờ xét duyệt
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onAccept} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5">
                    <MailCheck size={14} /> Chấp nhận
                </button>
                <button onClick={onReject} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5">
                    <MailX size={14} /> Từ chối
                </button>
            </div>
        </div>
    );
};

const FindClanSection = ({ userClanStatus, recommendedClans, onCreateClan, onJoinClan, onCancelRequest, onViewDetails }: { userClanStatus: { [clanId: string]: 'pending' | 'member' }, recommendedClans: ClanInfo[], onCreateClan: () => void, onJoinClan: (id: string) => void, onCancelRequest: (id: string) => void, onViewDetails: (id: string) => void }) => {
    const hasClan = Object.values(userClanStatus).includes('member');
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
                          id={clan.id}
                          name={clan.name}
                          tag={clan.tag}
                          members={clan.members_count} 
                          lvl={clan.level} 
                          desc={clan.description} 
                          userClanStatus={userClanStatus[clan.id]}
                          isUserInAnyClan={hasClan}
                          icon={clan.icon}
                          color={clan.color}
                          onJoin={() => onJoinClan(clan.id)}
                          onCancel={() => onCancelRequest(clan.id)}
                          onView={() => onViewDetails(clan.id)}
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
  id: string;
  name: string;
  tag: string;
  members: number;
  desc: string;
  lvl: number;
  userClanStatus?: 'pending' | 'member';
  isUserInAnyClan: boolean;
  icon: string;
  color: string;
  onJoin?: () => void;
  onCancel?: () => void;
  onView?: () => void;
}

const ClanRow = ({ id, name, tag, members, desc, lvl, userClanStatus, isUserInAnyClan, icon, color, onJoin, onCancel, onView }: ClanRowProps) => {
  const iconObj = CLAN_ICONS.find(i => i.id === icon) || CLAN_ICONS[0];
  const colorObj = CLAN_COLORS.find(c => c.id === color) || CLAN_COLORS[0];
  const IconComp = iconObj.icon;
  const hasClan = userClanStatus === 'member';

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
          <button 
            onClick={onView}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl border border-white/5 transition-all"
          >
            Chi tiết
          </button>
          {!hasClan && userClanStatus === 'pending' && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Hủy yêu cầu
            </button>
          )}
          {!isUserInAnyClan && !userClanStatus && (
            <button 
              onClick={onJoin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              Tham gia
            </button>
          )}
        </div>
       
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
