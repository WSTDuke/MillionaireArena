import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Trophy, Target, 
  Users,
  LogOut,
  MoreVertical,
  Settings,
  Shield,
  Crown,
  Plus,
  Search,
  AlertTriangle,
  MailCheck,
  MailX
} from 'lucide-react';
import CreateClanModal from '../../components/modals/CreateClanModal';
import UpdateClanModal from '../../components/modals/UpdateClanModal';
import Toast from '../../components/Toast';
import type { ToastType } from '../../components/Toast';
import { ClanPageSkeleton } from '../../components/LoadingSkeletons';
import { CLAN_ICONS, CLAN_COLORS } from './clanConstants';
import { getRankFromMMR } from '../../lib/ranking';

interface ClanInfo {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  color: string;
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
    mmr: number | null;
  }
}


interface DashboardContext {
  user: { id: string } | null;
  profile: { balance?: number } | null;
  setProfile: React.Dispatch<React.SetStateAction<{ id: string; display_name: string | null; avatar_url: string | null; mmr: number | null; balance?: number } | null>>;
  dashboardCache: {
    recommendedClans?: ClanInfo[];
    clanInfo?: ClanInfo | null;
    members?: MemberInfo[];
    joinRequests?: MemberInfo[];
    userClanStatus?: { [clanId: string]: 'pending' | 'member' };
    overviewTopUsers?: unknown[];
    rankingData?: unknown[];
    [key: string]: unknown;
  };
  setDashboardCache: React.Dispatch<React.SetStateAction<DashboardContext['dashboardCache']>>;
}

const ClanView = () => {
  const { user, profile, setProfile, dashboardCache, setDashboardCache } = useOutletContext<DashboardContext>();

  const [activeTab, setActiveTab] = useState('find-clan');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [targetMember, setTargetMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(!dashboardCache.recommendedClans);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(dashboardCache.clanInfo || null);
  const [members, setMembers] = useState<MemberInfo[]>(dashboardCache.members || []);
  const [joinRequests, setJoinRequests] = useState<MemberInfo[]>(dashboardCache.joinRequests || []);
  const [userClanStatus, setUserClanStatus] = useState<{ [clanId: string]: 'pending' | 'member' }>(dashboardCache.userClanStatus || {});
  const [recommendedClans, setRecommendedClans] = useState<ClanInfo[]>(dashboardCache.recommendedClans || []);
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
        .select('id, display_name, avatar_url, full_name, mmr')
        .in('id', userIds);

      if (profError) {
        console.error('Profiles fetch error:', profError);
        return rawMembers.map(m => ({
          ...m,
          profiles: { display_name: null, avatar_url: null, full_name: null, mmr: null }
        })) as MemberInfo[];
      } else {
        const mappedMembers = rawMembers.map(m => ({
          ...m,
          profiles: profilesData?.find(p => p.id === m.user_id) || { display_name: null, avatar_url: null, full_name: null, mmr: null }
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

    const clanIdForSubscription: string | null = null;
    // Note: clanIdForSubscription is used for real-time updates which might be added later
    void clanIdForSubscription; // Avoid unused warning if not using in simple version

    try {
      // First, check for any pending requests by the user
      const { data: pendingRequests, error: pendingError } = await supabase
        .from('clan_members')
        .select('clan_id, status, role')
        .eq('user_id', user.id);
  
      if (pendingError) throw pendingError;
  
      const statusMap: { [clanId: string]: 'pending' | 'member' } = {};
      let approvedClanMembership: { clan_id: string, status: string, role: string } | null = null;
  
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
          .select('*')
          .eq('id', approvedClanMembership.clan_id)
          .single();
  
        if (clanError) throw clanError;
  
        setClanInfo({ ...clanDetails, role: approvedClanMembership.role });
        
        const membersData = await fetchMembers(clanDetails.id);
        setMembers(membersData);
  
        // Fix 400 error by fetching requests and profiles separately
        const { data: rawRequests, error: requestsError } = await supabase
          .from('clan_members')
          .select('user_id, role, joined_at, status')
          .eq('clan_id', clanDetails.id)
          .eq('status', 'pending');
  
        if (!requestsError && rawRequests) {
          const userIds = rawRequests.map(m => m.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, full_name, mmr')
            .in('id', userIds);
          
          const enrichedRequests = rawRequests.map(r => ({
            ...r,
            profiles: (profiles || []).find(p => p.id === r.user_id) || {
              display_name: null,
              avatar_url: null,
              full_name: null,
              mmr: null
            }
          }));
          setJoinRequests(enrichedRequests as MemberInfo[]);
          
          setActiveTab('my-clan');
          // Final cache sync for my clan
          setDashboardCache((prev) => ({
            ...prev,
            clanInfo: { ...clanDetails, role: approvedClanMembership.role },
            members: membersData,
            joinRequests: enrichedRequests,
            userClanStatus: statusMap
          }));
        }
  
      } else {
        setClanInfo(null);
        setMembers([]);
        setJoinRequests([]);
        setActiveTab('find-clan');
        
        // Update cache for no clan
        setDashboardCache((prev) => ({
          ...prev,
          clanInfo: null,
          members: [],
          joinRequests: [],
          userClanStatus: statusMap
        }));
      }
    } catch (err) {
      console.error('Error fetching clan data:', err);
    }

    if (isInitialLoad) {
      try {
        const { data: clans, error: clansError } = await supabase
          .from('clans')
          .select('*')
          .order('members_count', { ascending: false })
          .limit(10);

        if (clansError) throw new Error(clansError.message);
        setRecommendedClans(clans || []);

        setDashboardCache((prev) => ({
          ...prev,
          recommendedClans: clans || []
        }));
      } catch (err) {
        console.error('Error fetching recommended clans:', err);
      }
    }
    setLoading(false);
    return null;
  }, [user?.id, fetchMembers, setDashboardCache]);


  const handleViewClanDetails = async (clanId: string) => {
    setViewingLoading(true);
    try {
      const { data: clanDetails, error: clanError } = await supabase
        .from('clans')
        .select('id, name, tag, description, icon, color, members_count')
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
    } catch (err) {
      const error = err as Error;
      console.error('Error viewing clan details:', error);
      handleShowToast('Không thể tải thông tin clan: ' + error.message, 'error');
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
      const { data: result, error: createError } = await supabase.rpc('create_clan_with_payment', {
        p_name: data.name,
        p_tag: data.tag,
        p_description: data.description,
        p_icon: data.icon,
        p_color: data.color,
        p_cost: 1000
      });

      if (createError) throw createError;
      
      if (result && !result.success) {
        throw new Error(result.message || 'Lỗi khi tạo Clan');
      }

      await fetchClanData();
      setShowCreateModal(false);
      handleShowToast('Tạo Clan thành công! (Đã trừ 1000 🪙)', 'success');
      // Update local balance if we have access to it, or rely on realtime/refetch
      if (result.new_balance !== undefined) {
         setProfile(prev => prev ? ({ ...prev, balance: result.new_balance }) : prev);
      }
    } catch (err) {
      console.error('Error creating clan:', err);
      handleShowToast(err.message || 'Lỗi khi tạo Clan. Vui lòng thử lại.', 'error');
    }
  };

  const handleUpdateClan = async (data: { name: string; tag: string; description: string; icon: string; color: string }) => {
    if (!user?.id || !clanInfo?.id) return;
    try {
      const { data: result, error: updateError } = await supabase.rpc('update_clan_with_payment', {
        p_clan_id: clanInfo.id,
        // p_user_id is handled by auth.uid() in the RPC
        p_name: data.name,
        p_tag: data.tag,
        p_description: data.description,
        p_icon: data.icon,
        p_color: data.color,
        p_cost: 500
      });

      if (updateError) throw updateError;
      
      if (result && !result.success) {
        throw new Error(result.message || 'Lỗi cập nhật');
      }

      // Success
      await fetchClanData(false);
      setShowUpdateModal(false);
      handleShowToast('Cập nhật Clan thành công! (Đã trừ 500 🪙)', 'success');
      
      if (result.new_balance !== undefined) {
         setProfile(prev => prev ? ({ ...prev, balance: result.new_balance }) : prev);
      }
    } catch (err: any) {
      console.error('Error updating clan details:', err);
      // Log the full structure to help debug "Object" errors
      console.log('Full Error Object:', JSON.stringify(err, null, 2));

      let errorMessage = 'Lỗi khi cập nhật Clan.';
      
      // Try to extract the most relevant message
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (err?.details) {
        errorMessage = err.details;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Specific check for the likely insufficient funds case from the PL/pgSQL function
      if (errorMessage.includes('Insufficient funds') || (err?.details && err.details.includes('Insufficient funds'))) {
         errorMessage = 'Số dư không đủ để cập nhật (Cần 500 🪙).';
      }

      handleShowToast(errorMessage, 'error');
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    return <ClanPageSkeleton />;
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
      
      {/* Header - Tech Sector Style */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 relative">
        <div className="relative z-10 w-full md:w-auto">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4 rounded-sm">
              <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">Social Sector // Clans</span>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
             Hệ Thống <span className="text-fuchsia-500">CLAN</span>
           </h1>
           <div className="h-0.5 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mt-2"></div>
           <p className="text-gray-500 mt-4 font-bold max-w-lg text-sm leading-relaxed">
             Thiết lập kết nối, xây dựng đội ngũ và <span className="text-gray-300">chinh phục các giải đấu Arena</span> cùng những đồng minh tin cậy nhất.
           </p>
        </div>
      </div>

      {/* Tabs - Tech Style */}
      {!viewingClan && (
        <div className="flex border-b border-white/5 gap-10">
          <button 
            onClick={() => setActiveTab('my-clan')}
            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'my-clan' ? 'text-fuchsia-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {activeTab === 'my-clan' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />}
            Clan Của Tôi
          </button>
          <button 
            onClick={() => setActiveTab('find-clan')}
            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'find-clan' ? 'text-fuchsia-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {activeTab === 'find-clan' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />}
            Khám Phá Clan
          </button>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-neutral-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
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
          hasClan={!!clanInfo}
          userClanId={clanInfo?.id}
        />
      )}

      <CreateClanModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClan}
        currentBalance={profile?.balance || 0}
      />

      {clanInfo && (
        <UpdateClanModal 
          key={showUpdateModal ? 'open' : 'closed'}
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={handleUpdateClan}
          currentBalance={profile?.balance || 0}
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
    <div className="space-y-10">
      {/* Hero / Banner - Tech Edition */}
      <div className="relative group p-10 border border-white/5 bg-neutral-950 overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252723f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm group-hover:blur-none transition-all duration-1000"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
          <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        </div>

        {/* HUD Elements */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-fuchsia-500/40" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-fuchsia-500/40" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* Logo Frame */}
          <div className="relative">
             <div className="absolute inset-0 bg-fuchsia-500 blur-2xl opacity-10 animate-pulse"></div>
             <div className="w-40 h-40 bg-black border-2 border-fuchsia-500/30 flex items-center justify-center relative group-hover:border-fuchsia-500 transition-colors" style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }}>
                <ClanIcon size={80} className="text-white drop-shadow-[0_0_15px_rgba(217,70,239,0.4)]" style={{ color: hasClan ? selectedColorObj.hex : undefined }} />
                {/* Internal Scanline */}
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent h-1/2 animate-scanline-fast opacity-20 pointer-events-none" />
             </div>
          </div>
          
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                {hasClan ? clanInfo?.name : "Chưa Gia Nhập CLAN"}
              </h2>
              <div className="px-3 py-1 bg-fuchsia-600 text-white font-black text-[10px] uppercase tracking-[0.2em] skew-x-[-12deg] shadow-[4px_4px_0_rgba(255,255,255,0.1)]">
                {hasClan ? clanInfo?.tag : "UNASSIGNED"}
              </div>
            </div>
            
            <p className="text-gray-500 max-w-xl mb-10 font-bold text-sm leading-relaxed border-l-2 border-fuchsia-500/20 pl-4 italic">
              {hasClan 
                ? (clanInfo?.description || "Dữ liệu mô tả quân đoàn đang được cập nhật từ trung tâm chỉ huy.")
                : "Hãy tìm kiếm hoặc tạo lập một liên minh quân sự mới để tối ưu hóa khả năng chiến đấu của bạn trong giải đấu Arena."}
            </p>

            {hasClan && (
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-10">
                 <StatBadge icon={Users} label="Thành viên" value={`${members.length}/50`} />
                 <StatBadge icon={Trophy} label="Xếp hạng" value="TIỀN VỆ" color="text-fuchsia-400" />
                 <StatBadge icon={Target} label="Tỷ lệ thắng" value="-- %" color="text-blue-400" />
              </div>
            )}

            <div className="flex gap-4 justify-center md:justify-start">
              {!hasClan && (
                <>
                  <button className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all hover:translate-y-[-2px] shadow-[0_0_20px_rgba(192,38,211,0.3)]">
                    Tìm Clan
                  </button>
                  <button 
                    onClick={onCreateClan}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10"
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
                 className="p-3 bg-black border border-fuchsia-500/30 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white transition-all shadow-[0_0_15px_rgba(192,38,211,0.2)]"
                 style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
               >
                 <MoreVertical size={24} />
               </button>

               {showDropdown && (
                 <>
                   <div 
                     className="fixed inset-0 z-[100]" 
                     onClick={() => setShowDropdown(false)}
                   />
                   <div className="absolute right-0 mt-3 w-56 bg-neutral-900 border border-fuchsia-500/30 p-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[101] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <button 
                        onClick={() => { setShowDropdown(false); onSettingsClick?.(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                          clanInfo?.role === 'leader'
                            ? 'text-gray-400 hover:text-fuchsia-400 hover:bg-fuchsia-500/10'
                            : 'text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={clanInfo?.role !== 'leader'}
                      >
                         <Settings size={18} /> Cấu hình quân đoàn
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button 
                        onClick={() => { setShowDropdown(false); onLeaveRequest(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                          clanInfo?.role === 'leader'
                            ? 'text-red-500/20 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-500/10'
                        }`}
                        disabled={clanInfo?.role === 'leader'}
                      >
                        <LogOut size={18} /> Rời khỏi quân đoàn
                      </button>
                   </div>
                 </>
               )}
            </div>
          )}
        </div>
      </div>

      {hasClan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Member List - Tech Panel */}
          <div className={`${isViewingOnly ? 'lg:col-span-3' : 'lg:col-span-2'} relative bg-neutral-950 p-8 border border-white/5`}>
             {/* HUD Corners */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 pointer-events-none" />
             <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 pointer-events-none" />
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 pointer-events-none" />

             <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                <div className="flex gap-8">
                    <button 
                      onClick={() => setMembersTab('members')}
                      className={`text-[11px] font-black uppercase tracking-[0.2em] relative transition-all ${membersTab === 'members' ? 'text-fuchsia-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {membersTab === 'members' && <div className="absolute -bottom-4 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />}
                      Biên Chế ({members.length})
                    </button>
                    {isLeader && !isViewingOnly && (
                    <button 
                        onClick={() => setMembersTab('requests')}
                        className={`relative text-[11px] font-black uppercase tracking-[0.2em] transition-all ${membersTab === 'requests' ? 'text-fuchsia-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {membersTab === 'requests' && <div className="absolute -bottom-4 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />}
                        Đơn Tuyển Dụng
                        {joinRequests.length > 0 && (
                        <span className="absolute -top-3 -right-4 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[8px] font-black text-white animate-pulse">
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
  const rankInfo = getRankFromMMR(member.profiles?.mmr);

  return (
    <div className="group flex items-center justify-between p-5 bg-white/5 border border-white/5 hover:bg-fuchsia-500/5 hover:border-fuchsia-500/20 transition-all relative overflow-visible">
      {/* Selection Glow */}
      <div className="absolute inset-y-0 left-0 w-1 bg-fuchsia-500 opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_15px_#d946ef]" />
      
      <div className="flex items-center gap-6 flex-1">
        <div className="relative">
          <div className="absolute inset-0 bg-fuchsia-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src={avatarUrl} 
            alt={displayName} 
            className="w-14 h-14 bg-black object-cover relative z-10 p-0.5 border border-white/10 group-hover:border-fuchsia-500/50 transition-colors" 
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          />
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
            <div className="font-black text-white flex items-center gap-2 text-xl tracking-tighter uppercase italic">
              {isCurrentUser ? 'Bạn' : displayName} 
              {isLeader && <Crown size={20} className="text-fuchsia-500 drop-shadow-[0_0_10px_#d946ef]" fill="currentColor" />}
            </div>
            <div 
              className="px-2 py-0.5 text-[8px] font-black tracking-[0.2em] border bg-black/40 w-fit" 
              style={{ color: rankInfo.color, borderColor: `${rankInfo.color}33` }}
            >
              {rankInfo.tier === 'Unranked' ? 'DỮ LIỆU THẤP' : `${rankInfo.tier} ${rankInfo.division}`.toUpperCase()}
            </div>
          </div>
          <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${isLeader ? 'text-fuchsia-500' : 'text-gray-600 group-hover:text-gray-400'}`}>
            {isLeader ? '// TRƯỞNG NHÓM' : '// THÀNH VIÊN'}
          </div>
        </div>
      </div>

      {/* Actions Trigger */}
      <div>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-3 bg-black border border-white/10 text-gray-500 hover:text-white hover:border-fuchsia-500/50 transition-all shadow-xl group-hover:shadow-[0_0_15px_rgba(192,38,211,0.1)]"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          <MoreVertical size={20} />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
            <div className="absolute right-4 top-16 w-56 bg-neutral-950 border border-fuchsia-500/30 p-2 shadow-[0_0_40px_rgba(0,0,0,0.9)] z-[101] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <button 
                onClick={() => { setShowMenu(false); navigate(`/dashboard/profile?id=${member.user_id}`); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-fuchsia-400 hover:bg-fuchsia-500/10 transition-all"
              >
                Xem hồ sơ
              </button>

              {/* Leader only actions */}
              {currentUserRole === 'leader' && !isLeader && !isCurrentUser && (
                <>
                  <div className="h-px bg-white/5 my-1" />
                  <button 
                    onClick={() => { setShowMenu(false); onPromote(member); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white hover:bg-blue-500/10 transition-all"
                  >
                    Chuyển giao quyền hạn
                  </button>
                  <button 
                    onClick={() => { setShowMenu(false); onKick(member); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    Trục xuất quân đoàn
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
    const rankInfo = getRankFromMMR(request.profiles?.mmr);

    return (
        <div className="flex items-center justify-between p-5 bg-white/5 border border-white/5 hover:bg-blue-500/5 transition-all">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={displayName} 
            className="w-14 h-14 bg-black object-cover p-0.5 border border-white/10" 
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
             <div className="font-black text-white text-xl tracking-tighter uppercase italic">{displayName}</div>
             <div 
               className="px-2 py-0.5 text-[8px] font-black tracking-[0.2em] border bg-black/40 w-fit" 
               style={{ color: rankInfo.color, borderColor: `${rankInfo.color}33` }}
             >
               {rankInfo.tier === 'Unranked' ? 'NEW_CLIENT' : `${rankInfo.tier} ${rankInfo.division}`.toUpperCase()}
             </div>
          </div>
          <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">// CHỜ PHÊ DUYỆT</div>
        </div>
      </div>
            <div className="flex items-center gap-3">
                <button onClick={onAccept} className="px-5 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(192,38,211,0.2)]">
                    <MailCheck size={16} /> Tiếp Nhận
                </button>
                <button onClick={onReject} className="p-3 bg-white/5 hover:bg-red-500 text-gray-500 hover:text-white transition-all border border-white/10">
                    <MailX size={20} />
                </button>
            </div>
        </div>
    );
};

const FindClanSection = ({ userClanStatus, recommendedClans, onCreateClan, onJoinClan, onCancelRequest, onViewDetails, hasClan, userClanId }: { userClanStatus: { [clanId: string]: 'pending' | 'member' }, recommendedClans: ClanInfo[], onCreateClan: () => void, onJoinClan: (id: string) => void, onCancelRequest: (id: string) => void, onViewDetails: (id: string) => void, hasClan: boolean, userClanId?: string }) => {
    return (
        <div className="space-y-10">
             {/* Search Bar - Tech Edition */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex items-center bg-black border border-white/10 px-6 py-4 transition-all focus-within:border-fuchsia-500/50 focus-within:shadow-[0_0_15px_rgba(192,38,211,0.1)] relative">
                    <Search size={22} className="text-fuchsia-500" />
                    <input 
                      type="text" 
                      placeholder="TÌM CLAN [NAME / TAG]..." 
                      className="bg-transparent border-none outline-none text-[11px] font-black tracking-[0.2em] ml-4 w-full text-white placeholder-gray-700 uppercase" 
                    />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fuchsia-500/30" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fuchsia-500/30" />
                </div>
                {!hasClan && (
                  <button 
                      onClick={onCreateClan}
                      className="px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] shadow-[0_0_20px_rgba(192,38,211,0.3)] animate-in zoom-in duration-500"
                  >
                      <Plus size={20} /> Tạo clan MỚI
                  </button>
                )}
            </div>

            {/* Recommendations List - Tech Style */}
            <div className="relative bg-neutral-950 border border-white/5 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
                
                {/* Header */}
                <div className="relative p-8 border-b border-white/5 bg-gradient-to-r from-fuchsia-500/5 to-transparent">
                    {/* HUD Corners */}
                    <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-fuchsia-500/20"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-fuchsia-500/20"></div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-fuchsia-500 skew-x-[-20deg]"></div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                              Danh sách <span className="text-fuchsia-500">Clan</span>
                            </h3>
                        </div>
                    </div>
                </div>
                
                <div className="divide-y divide-white/5 relative">
                    {recommendedClans.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {recommendedClans.map((clan) => (
                          <ClanCard
                            key={clan.id}
                            clan={{
                              id: clan.id,
                              name: clan.name,
                              description: clan.description,
                              member_count: clan.members_count,
                              tag: clan.tag,
                              icon: clan.icon,
                              color: clan.color,
                              experience: 0, 
                            }}
                            onJoin={onJoinClan}
                            onCancel={onCancelRequest}
                            onDetails={onViewDetails}
                            status={userClanStatus[clan.id]}
                            hasClan={hasClan}
                            userClanId={userClanId}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                          <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">// NO RECORDS FOUND</div>
                          <div className="text-sm font-bold text-gray-600 italic">Chưa có Clan nào được thành lập trong hệ thống.</div>
                      </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface ClanCardProps {
  clan: {
    id: string;
    name: string;
    description: string;
    member_count: number;
    experience?: number;
    tag?: string;
    icon?: string;
    color?: string;
  };
  onJoin: (id: string) => void;
  onCancel: (id: string) => void;
  onDetails: (id: string) => void;
  status?: 'pending' | 'member';
  hasClan?: boolean;
  userClanId?: string;
}

const ClanCard = ({ clan, onJoin, onCancel, onDetails, status, hasClan, userClanId }: ClanCardProps) => {
  const selectedIconObj = CLAN_ICONS.find(i => i.id === clan.icon) || CLAN_ICONS[0];
  const selectedColorObj = CLAN_COLORS.find(c => c.id === clan.color) || CLAN_COLORS[0];
  const ClanIcon = selectedIconObj.icon;

  return (
    <div className="group relative bg-neutral-950 border border-white/10 hover:border-fuchsia-500/50 transition-all overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* HUD Accents */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/5 pointer-events-none" />

      <div className="p-8 flex flex-col flex-1 relative z-10">
        <div className="flex items-start justify-between mb-8">
           <div 
             className="w-16 h-16 bg-black border flex items-center justify-center shadow-[0_0_15px_rgba(192,38,211,0.1)] group-hover:border-opacity-100 transition-all"
             style={{ 
               clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
               borderColor: `${selectedColorObj.hex}50`,
               color: selectedColorObj.hex
             }}
           >
              <ClanIcon size={32} />
           </div>
           
           <div className="text-right">
              <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Thành viên</div>
              <div className="text-2xl font-black text-white tabular-nums tracking-tighter italic">{clan.member_count}<span className="text-gray-700 font-normal mx-0.5">/</span>50</div>
           </div>
        </div>

        <div className="mb-8">
           <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic group-hover:text-fuchsia-500 transition-colors truncate">
                 {clan.name}
              </h3>
              <div className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                {clan.tag || 'SPEC'}
              </div>
           </div>
           <p className="text-gray-500 text-xs font-bold line-clamp-2 leading-relaxed italic border-l border-fuchsia-500/20 pl-3">
              {clan.description || "TÀI LIỆU QUÂN ĐOÀN ĐANG TRONG TRẠNG THÁI PHÂN LOẠI."}
           </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="p-4 bg-black border border-white/5 relative group-hover:border-fuchsia-500/20 transition-colors">
              <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Xếp hạng  </div>
              <div className="text-sm font-black text-fuchsia-500 tabular-nums">{clan.experience || 0}</div>
           </div>
           <div className="p-4 bg-black border border-white/5 relative group-hover:border-fuchsia-500/20 transition-colors">
              <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Trạng thái</div>
              <div className="text-sm font-black text-white uppercase tracking-tighter italic">Hoạt động</div>
           </div>
        </div>

        <div className="flex gap-3 mt-auto">
           <button 
             onClick={() => onDetails(clan.id)}
             className="px-4 py-3 bg-black border border-white/10 text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white hover:border-white/30 transition-all"
             style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
           >
             Chi tiết
           </button>
           
            {!status && !hasClan && clan.id !== userClanId && (
             <button 
               onClick={() => onJoin(clan.id)}
               className="flex-1 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(192,38,211,0.2)] active:scale-95 flex items-center justify-center gap-2"
               style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
             >
               GIA NHẬP
             </button>
           )}

           {status === 'pending' && (
             <button 
               onClick={() => onCancel(clan.id)}
               className="flex-1 py-3 bg-white/5 border border-fuchsia-500/50 text-fuchsia-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-fuchsia-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
               style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
             >
               ĐANG CHỜ...
             </button>
           )}
           
           {status === 'member' && (
              <div className="flex-1 py-3 border border-blue-500/30 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 italic">
                 Tham gia
              </div>
           )}
        </div>
      </div>

      {/* Hover Scanline */}
      <div className="absolute inset-x-0 top-0 h-1 bg-fuchsia-500/20 animate-scanline-fast opacity-0 group-hover:opacity-100 pointer-events-none" />
    </div>
  );
};

// --- Sub Components ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, confirmText: string, cancelText: string, type?: 'danger' | 'info' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
       <div className="bg-neutral-950 border border-white/10 w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] p-10 text-center space-y-10 animate-in zoom-in-95 duration-500 relative">
          {/* HUD Elements */}
          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-fuchsia-500/20" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-fuchsia-500/20" />
          
          <div className="space-y-6 relative z-10">
             <div className={`w-24 h-24 mx-auto flex items-center justify-center relative`}>
                <div className={`absolute inset-0 ${type === 'danger' ? 'bg-red-500' : 'bg-fuchsia-500'} opacity-10 animate-pulse`} style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }} />
                <div className={`w-20 h-20 bg-black border ${type === 'danger' ? 'border-red-500/50' : 'border-fuchsia-500/50'} flex items-center justify-center shadow-inner relative`} style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}>
                   {type === 'danger' ? <AlertTriangle size={36} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> : <Shield size={36} className="text-fuchsia-500 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]" />}
                </div>
             </div>
             
             <div className="space-y-3">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{title}</h3>
                <div className="h-0.5 w-16 bg-fuchsia-500/50 mx-auto" />
                <p className="text-gray-500 text-sm font-bold leading-relaxed px-4 italic">{message}</p>
             </div>
          </div>

          <div className="flex flex-col gap-4 relative z-10">
             <button 
               onClick={onConfirm}
               className={`w-full py-5 ${type === 'danger' ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_30px_rgba(192,38,211,0.3)]'} text-white font-black uppercase tracking-[0.3em] text-xs transition-all active:scale-95`}
               style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
             >
               Confirm_{confirmText}
             </button>
             <button 
                onClick={onClose}
                className="w-full py-5 bg-black border border-white/10 text-gray-600 font-black text-xs uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              >
                {cancelText}
              </button>
          </div>
       </div>
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color = "text-white" }: { icon: React.ElementType, label: string, value: string, color?: string }) => (
  <div className="flex items-center gap-3 bg-black border border-white/10 px-5 py-3 relative">
    <div className="absolute top-0 left-0 w-1 h-1 bg-fuchsia-500" />
    <Icon size={14} className="text-fuchsia-500" />
    <div className="flex flex-col">
      <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">{label}</span>
      <span className={`text-xs font-black ${color} tracking-widest`}>{value}</span>
    </div>
  </div>
);

export default ClanView;
