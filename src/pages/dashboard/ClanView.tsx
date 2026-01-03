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

const ClanView = () => {
  const { user } = useOutletContext<{ 
    user: { id: string }; 
  }>();

  const [activeTab, setActiveTab] = useState('find-clan'); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const [recommendedClans, setRecommendedClans] = useState<ClanInfo[]>([]);

  const fetchClanData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Fetch user's clan membership
      const { data: membership, error: memError } = await supabase
        .from('clan_members')
        .select(`
          clan_id,
          role,
          clans (
            id,
            name,
            tag,
            description,
            icon,
            color,
            level,
            members_count
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memError) throw memError;

      if (membership && membership.clans) {
        const clan = membership.clans as unknown as ClanInfo;
        setClanInfo({
          id: clan.id,
          name: clan.name,
          tag: clan.tag,
          description: clan.description,
          icon: clan.icon,
          color: clan.color,
          level: clan.level,
          members_count: clan.members_count,
          role: membership.role
        });
        setActiveTab('my-clan');
      } else {
        setClanInfo(null);
        setActiveTab('find-clan');
      }

      // 2. Fetch recommended clans
      const { data: clans, error: clansError } = await supabase
        .from('clans')
        .select('*')
        .order('members_count', { ascending: false })
        .limit(10);

      if (clansError) throw clansError;
      setRecommendedClans(clans || []);

    } catch (err) {
      console.error('Error fetching clan data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchClanData();
  }, [fetchClanData]);

  const handleCreateClan = async (data: { name: string; tag: string; description: string; icon: string; color: string }) => {
    if (!user?.id) return;

    try {
      // 1. Insert building clan
      const { data: newClan, error: createError } = await supabase
        .from('clans')
        .insert({
          name: data.name,
          tag: data.tag,
          description: data.description,
          icon: data.icon,
          color: data.color,
          creator_id: user.id,
          members_count: 1
        })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Add creator as leader
      const { error: joinError } = await supabase
        .from('clan_members')
        .insert({
          clan_id: newClan.id,
          user_id: user.id,
          role: 'leader'
        });

      if (joinError) throw joinError;

      // 3. Refresh
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
        .insert({
          clan_id: clanId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Update members count (simplified - in production use an RPC or trigger)
      await supabase.rpc('increment_clan_members', { clan_id_param: clanId });

      await fetchClanData();
    } catch (err: any) {
      console.error('Error joining clan:', err);
      alert(err.message || 'Lỗi khi gia nhập Clan.');
    }
  };

  const handleLeave = async () => {
    if (!user?.id || !clanInfo?.id) return;

    try {
      const { error } = await supabase
        .from('clan_members')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Decrement members count
      await supabase.rpc('decrement_clan_members', { clan_id_param: clanInfo.id });

      setClanInfo(null);
      setActiveTab('find-clan');
      setShowLeaveConfirm(false);
      await fetchClanData();
    } catch (err: any) {
      console.error('Error leaving clan:', err);
      alert(err.message || 'Lỗi khi rời Clan.');
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
          onLeaveRequest={() => setShowLeaveConfirm(true)}
          onCreateClan={() => setShowCreateModal(true)} 
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

    </div>
  );
};

// --- Sections ---

const MyClanSection = ({ clanInfo, onCreateClan, onLeaveRequest }: { clanInfo: ClanInfo | null; onCreateClan: () => void, onLeaveRequest: () => void }) => {
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
                 <StatBadge icon={Users} label="Thành viên" value={`${clanInfo?.members_count || 1}/50`} />
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

          {/* Action Dropdown Button */}
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
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
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
                 <Users className="text-blue-500" /> Thành viên ({clanInfo?.members_count || 1})
               </h3>
               <button className="text-xs font-bold text-blue-400 hover:text-white uppercase tracking-widest">Xem tất cả</button>
             </div>
             
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/10 overflow-hidden">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-black text-white flex items-center gap-2">
                        Bạn <Crown size={14} className="text-yellow-500" fill="currentColor" />
                      </div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{clanInfo?.role === 'leader' ? 'Chủ sở hữu' : 'Thành viên'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Đang trực tuyến</span>
                  </div>
                </div>
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
