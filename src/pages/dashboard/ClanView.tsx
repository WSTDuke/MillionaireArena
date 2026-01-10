import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  Coins,
  BookUser,
  Eye
} from 'lucide-react';
import CreateClanModal from '../../components/modals/CreateClanModal';
import UpdateClanModal from '../../components/modals/UpdateClanModal';
import Toast from '../../components/Toast';
import type { ToastType } from '../../components/Toast';
import { ClanPageSkeleton } from '../../components/LoadingSkeletons';
import { CLAN_ICONS, CLAN_COLORS } from './clanConstants';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [toast, setToast] = useState<{ message: React.ReactNode, type: ToastType } | null>(null);

  // Ref to track user's primary clan membership for joined/kicked notifications
  const prevClanIdRef = React.useRef<string | null>(null);
  const isInitialStatusRef = React.useRef(true);

  // New state for viewing other clans
  const [viewingClan, setViewingClan] = useState<ClanInfo | null>(null);
  const [viewingMembers, setViewingMembers] = useState<MemberInfo[]>([]);
  const [viewingLoading, setViewingLoading] = useState(false);

  const handleShowToast = (message: React.ReactNode, type: ToastType = 'success') => {
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


  const handleViewClanDetails = useCallback(async (clanId: string) => {
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
  }, [fetchMembers]);


  const handleBackToList = () => {
    if (location.state?.returnTo) {
      navigate(location.state.returnTo);
      return;
    }
    setViewingClan(null);
    setViewingMembers([]);
    setSearchParams({}); // Clear query params on back
  };


  // Handle URL query for deep linking to a clan
  useEffect(() => {
    const clanId = searchParams.get('id');
    // Ensure we only trigger if we have an ID, and we aren't already viewing that clan
    if (clanId && (!viewingClan || viewingClan.id !== clanId)) {
        handleViewClanDetails(clanId);
    } else if (!clanId && viewingClan) {
        // Optional: Close viewing if ID is removed. 
        // For consistent state with URL, we should probably close it.
        // setViewingClan(null); // Uncommenting this might be safer for browser back button
    }
  }, [searchParams, handleViewClanDetails, viewingClan]); 


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
      handleShowToast(<span className="flex items-center gap-1">Tạo Clan thành công! (Đã trừ 1000 <Coins size={14} className="text-yellow-500"/>)</span>, 'success');
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
      handleShowToast(<span className="flex items-center gap-1">Cập nhật Clan thành công! (Đã trừ 500 <Coins size={14} className="text-yellow-500"/>)</span>, 'success');
      
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
         handleShowToast(<span className="flex items-center gap-1">Số dư không đủ để cập nhật (Cần 500 <Coins size={14} className="text-yellow-500"/>).</span>, 'error');
      } else {
         handleShowToast(errorMessage, 'error');
      }
    }
  };

  const handleRequestToJoinClan = async (clanId: string) => {
    if (!user?.id || clanInfo) return; // Already in a clan
    
    if (userClanStatus[clanId] === 'pending') {
      handleShowToast('Yêu cầu đã được gửi. Vui lòng chờ trưởng nhóm xét duyệt.', 'info');
      return;
    }

    // Check if clan is full before sending request
    const targetClan = recommendedClans.find(c => c.id === clanId);
    if (targetClan && targetClan.members_count >= 5) {
      handleShowToast('Clan này đã đủ 5 thành viên. Bạn không thể xin tham gia lúc này.', 'error');
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
    
    // Check if already reached limit
    const approvedCount = members.filter(m => m.status === 'approved').length;
    if (approvedCount >= 5) {
      handleShowToast('Clan đã đạt tối đa 5 thành viên. Bạn không thể duyệt thêm.', 'error');
      return;
    }

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
            <span className="font-bold text-lg">Quay lại</span>
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
  onAcceptRequest: (member: MemberInfo) => void;
  onRejectRequest: (member: MemberInfo) => void;
  onSettingsClick?: () => void;
  isViewingOnly?: boolean;
}) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (!clanInfo) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/50 border border-white/5 rounded-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-2 animate-bounce">
          <Shield size={40} className="text-gray-500" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Chưa tham gia Clan</h3>
          <p className="text-gray-400 font-medium max-w-md mx-auto">
            Gia nhập Clan để tham gia các giải đấu, nhận phần thưởng độc quyền và kết nối với đồng đội.
          </p>
        </div>
        <button 
          onClick={onCreateClan}
          className="px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          Tạo Clan Mới
        </button>
      </div>
    );
  }
  
  const { icon: IconComponent } = CLAN_ICONS.find((item: any) => item.id === clanInfo.icon) || { icon: Shield };
  const colorObj = CLAN_COLORS.find(c => c.id === clanInfo.color) || CLAN_COLORS[0];
  const approvedMembers = members.filter(m => m.status === 'approved');

  return (
    <div className="space-y-8">
      {/* Clan Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorObj.classes} opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${colorObj.bg}/10 flex items-center justify-center border-2 border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative group-hover:scale-105 transition-transform duration-500`}>
             <IconComponent size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ color: colorObj.hex }} />
             
             {/* Rank Badge (Mock) */}
             <div className="absolute -bottom-2 -right-2 bg-neutral-900 border border-yellow-500/50 text-yellow-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <Crown size={12} />
                Rank {Math.floor(clanInfo.members_count * 100 / 5)}
             </div>
          </div>
          
          <div className="flex-1 space-y-4">
             <div>
               <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/10 text-white`}>
                    [{clanInfo.tag}]
                 </span>
                 {clanInfo.role === 'leader' && !isViewingOnly && (
                   <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider flex items-center gap-1">
                     <Crown size={12} /> Leader
                   </span>
                 )}
               </div>
               <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                 {clanInfo.name}
               </h2>
             </div>
             
             <p className="text-gray-300 font-medium max-w-2xl leading-relaxed text-sm md:text-base border-l-2 border-white/20 pl-4">
               {clanInfo.description}
             </p>
             
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 pt-4">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                    <Users size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Thành viên</span>
                    <span className="text-white font-bold">{approvedMembers.length} / 5</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                    <Trophy size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Điểm Clan</span>
                    <span className="text-white font-bold">--</span>
                  </div>
               </div>
             </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-3 min-w-[160px]">
             {isViewingOnly ? (
               // Viewing Only Actions (e.g. Join if not in clan)
               <div className="text-center">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Thông tin Clan
                  </span>
               </div>
             ) : (
               <>
                 {clanInfo.role === 'leader' && onSettingsClick && (
                   <button 
                     onClick={onSettingsClick}
                     className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                   >
                     <Settings size={14} />
                     Cài đặt
                   </button>
                 )}
                 <button 
                   onClick={onLeaveRequest}
                   className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold uppercase tracking-wider text-xs rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                 >
                   <LogOut size={14} />
                   Rời Clan
                 </button>
               </>
             )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List - REMOVED overflow-hidden for dropdown visibility */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/50 rounded-t-2xl">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users size={18} className="text-fuchsia-500" /> Thành viên ({approvedMembers.length})
                </h3>
             </div>
             
             <div className="divide-y divide-white/5">
                {approvedMembers.map((member, index) => (
                  <div 
                    key={member.user_id} 
                    className={`p-4 hover:bg-white/5 transition-colors flex items-center gap-4 group relative ${index === approvedMembers.length - 1 ? 'rounded-b-2xl' : ''}`}
                  >
                     {/* Avatar */}
                     <div className="w-12 h-12 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                        {member.profiles.avatar_url ? (
                          <img src={member.profiles.avatar_url} alt="Avt" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                            {member.profiles.display_name?.charAt(0) || '?'}
                          </div>
                        )}
                     </div>
                     
                     {/* Info */}
                     <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-white">
                             {member.profiles.display_name || 'Unknown User'}
                           </h4>
                           {member.role === 'leader' && (
                             <span className="p-0.5 bg-yellow-500/10 rounded text-yellow-500" title="Leader">
                               <Crown size={12} />
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                           <span className="flex items-center gap-1">
                             <Target size={10} /> MMR: {member.profiles.mmr || 0}
                           </span>
                           <span>•</span>
                           <span>Tham gia: {new Date(member.joined_at).toLocaleDateString()}</span>
                        </div>
                     </div>
                     
                     {/* Actions - Visible to everyone for Profile View, but Leader specific actions guarded */}
                     {currentUserId !== member.user_id && (
                       <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === member.user_id ? null : member.user_id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${openMenuId === member.user_id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                          >
                             <MoreVertical size={16} />
                          </button>
                          
                          {/* Dropdown */}
                          {openMenuId === member.user_id && (
                             <div className="absolute right-8 bottom-0 mt-1 w-52 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                               <div className="p-1">
                                 {/* View Profile - Available to All */}
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/profile?id=${member.user_id}`); setOpenMenuId(null); }}
                                   className="w-full text-left px-3 py-2 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors flex items-center gap-2"
                                 >
                                   <Eye size={16} className="text-cyan-400" />
                                   Xem Hồ Sơ
                                 </button>

                                 {/* Leader Only Actions */}
                                 {clanInfo?.role === 'leader' && !isViewingOnly && (
                                   <>
                                     <div className="h-px bg-white/5 my-1" />
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); onPromote(member); setOpenMenuId(null); }}
                                       className="w-full text-left px-3 py-2 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors flex items-center gap-2"
                                     >
                                       <Crown size={16} className="text-yellow-500" />
                                       Phong Trưởng Nhóm
                                     </button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); onKick(member); setOpenMenuId(null); }}
                                       className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2"
                                     >
                                       <LogOut size={16} />
                                       Xóa Khỏi Clan
                                     </button>
                                   </>
                                 )}
                               </div>
                             </div>
                          )}
                       </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
        
        {/* Sidebar Info or Requests */}
        <div className="space-y-6">
           {clanInfo?.role === 'leader' && joinRequests.length > 0 && !isViewingOnly && (
             <div className="bg-neutral-900/50 border border-fuchsia-500/20 rounded-2xl overflow-hidden animate-pulse-border">
                <div className="p-4 bg-fuchsia-500/10 border-b border-fuchsia-500/20 flex justify-between items-center">
                   <h3 className="text-sm font-black text-fuchsia-400 uppercase tracking-wider flex items-center gap-2">
                     <MailCheck size={16} /> Yêu cầu tham gia ({joinRequests.length})
                   </h3>
                </div>
                
                <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                   {joinRequests.map(req => (
                     <div key={req.user_id} className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden border border-white/10">
                              {req.profiles.avatar_url ? (
                                <img src={req.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">
                                  {req.profiles.display_name?.charAt(0) || '?'}
                                </div>
                              )}
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-white">{req.profiles.display_name}</h4>
                              <span className="text-[10px] text-gray-500">MMR: {req.profiles.mmr || 0}</span>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => onAcceptRequest(req)}
                             className="flex-1 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                           >
                             Chấp nhận
                           </button>
                           <button 
                             onClick={() => onRejectRequest(req)}
                             className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                           >
                             Từ chối
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           <div className="p-6 bg-neutral-900 border border-white/5 rounded-2xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                Thống Kê Clan
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Thứ hạng</span>
                    <span className="text-white font-bold">Top 100</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Điểm Uy Tín</span>
                    <span className="text-green-500 font-bold">Good</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Thành lập</span>
                    <span className="text-white font-bold">2024</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const FindClanSection = ({ 
  userClanStatus,
  recommendedClans, 
  onCreateClan, 
  onJoinClan,
  onCancelRequest,
  onViewDetails,
  hasClan,
  userClanId
}: { 
  userClanStatus: { [clanId: string]: 'pending' | 'member' };
  recommendedClans: ClanInfo[];
  onCreateClan: () => void;
  onJoinClan: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onViewDetails: (id: string) => void;
  hasClan: boolean;
  userClanId?: string;
}) => {
  return (
    <div className="space-y-8">
      {/* Search & Filter - Simplified */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm Clan theo tên hoặc tag..." 
              className="w-full bg-neutral-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium"
            />
         </div>
         <button className="px-6 py-4 bg-neutral-900 border border-white/10 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-colors">
            Bộ Lọc
         </button>
         {!hasClan && (
           <button 
             onClick={onCreateClan}
             className="px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-fuchsia-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <Plus size={18} />
             Tạo Clan
           </button>
         )}
      </div>

      {/* Recommended Grid */}
      <h3 className="text-xl font-black text-white uppercase italic tracking-wider flex items-center gap-2">
        <Target size={24} className="text-fuchsia-500" />
        Đề Xuất Cho Bạn
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {recommendedClans.map((clan, idx) => {
            // Find icon and color
            const { icon: IconComponent } = CLAN_ICONS.find((item: any) => item.id === clan.icon) || { icon: Shield };
            const colorObj = CLAN_COLORS.find(c => c.id === clan.color) || CLAN_COLORS[0];
            const status = userClanStatus[clan.id];
            const isUserClan = clan.id === userClanId;

            return (
              <div key={clan.id} className="group bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-fuchsia-500/30 transition-all hover:-translate-y-1 relative">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorObj.classes}`} />
                  
                  <div className="p-6 space-y-4">
                     {/* Header */}
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                           <div className={`w-14 h-14 rounded-xl ${colorObj.bg}/10 flex items-center justify-center border border-white/10`}>
                              <IconComponent size={28} style={{ color: colorObj.hex }} />
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-white uppercase italic tracking-tight leading-none mb-1">
                                {clan.name}
                              </h4>
                              <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                #{clan.tag}
                              </span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-xs font-bold text-gray-500 uppercase">Rank</span>
                           <span className="text-yellow-500 font-black italic shadow-yellow-500/10 drop-shadow-sm">#{idx + 1}</span>
                        </div>
                     </div>
                     
                     {/* Stats */}
                     <div className="grid grid-cols-2 gap-2 py-4 border-y border-white/5">
                        <div className="text-center border-r border-white/5">
                           <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Thành viên</span>
                           <span className="text-white font-bold">{clan.members_count}/5</span>
                        </div>
                        <div className="text-center">
                           <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Điểm</span>
                           <span className="text-white font-bold">1,250</span>
                        </div>
                     </div>
                     
                     <p className="text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed">
                        {clan.description || 'Chưa có mô tả.'}
                     </p>
                     
                      {/* Action Button */}
                     {!isUserClan && (
                       <div className="flex gap-2">
                          <button 
                            onClick={status === 'pending' ? () => onCancelRequest(clan.id) : () => onJoinClan(clan.id)}
                            disabled={clan.members_count >= 5 && status !== 'pending'}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all border
                            ${status === 'pending' 
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' 
                              : clan.members_count >= 5
                                ? 'bg-neutral-800 text-gray-500 border-white/5 cursor-not-allowed'
                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30'}`}
                          >
                            {status === 'pending' ? 'Hủy Yêu Cầu' : clan.members_count >= 5 ? 'Đã Đầy' : 'Xin Gia Nhập'}
                          </button>
                          
                          <button 
                             onClick={() => onViewDetails(clan.id)}
                             className="w-10 h-10 flex items-center justify-center bg-neutral-900 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/30 transition-all"
                             title="Xem chi tiết"
                          >
                             <BookUser size={16} />
                          </button>
                       </div>
                     )}
                     
                     {isUserClan && (
                        <div className="w-full py-3 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 text-center text-[10px] font-black uppercase tracking-wider rounded-lg">
                           Clan Của Bạn
                        </div>
                     )}
                  </div>
              </div>
            );
         })}
      </div>
    </div>
  );
};


const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }: any) => {
  if (!isOpen) return null;
  
  const isDanger = type === 'danger';
  const colorClass = isDanger ? 'red-500' : 'blue-500';
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-neutral-900 border border-${colorClass}/30 rounded-2xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${colorClass} to-transparent`} />
        
        <div className="text-center space-y-6">
           <div className={`w-16 h-16 mx-auto bg-${colorClass}/10 rounded-full flex items-center justify-center border border-${colorClass}/20`}>
              <AlertTriangle size={32} className={`text-${colorClass}`} />
           </div>
           
           <div className="space-y-2">
             <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
             <p className="text-gray-400 font-medium text-sm leading-relaxed">
               {message}
             </p>
           </div>
           
           <div className="flex gap-4 pt-2">
             <button 
               onClick={onClose}
               className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all"
             >
               {cancelText}
             </button>
             <button 
               onClick={onConfirm}
               className={`flex-1 py-3 bg-${colorClass} hover:bg-${colorClass}/80 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg transition-all`}
             >
               {confirmText}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClanView;
