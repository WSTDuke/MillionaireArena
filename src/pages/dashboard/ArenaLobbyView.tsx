import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { Zap, Swords, X, Loader2, Bookmark, Copy, Check, Play, Plus } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface Participant {
    id: string;
    display_name: string;
    avatar_url: string;
    is_ready: boolean;
    is_host: boolean;
    level?: number;
    rank?: string;
}

interface Room {
    id: string;
    name: string;
    code: string;
    host_id: string;
    status: string;
    participants: Participant[];
    settings: {
        format: string;
        questions_per_round: number;
    };
}

const ArenaLobbyView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile } = useOutletContext<{ user: any; profile: any }>();
    const mode = searchParams.get('mode') || 'Normal';
    const roomId = searchParams.get('roomId');
    
    // State for manual matchmaking
    const [searching, setSearching] = useState(false);
    const [timer, setTimer] = useState(0);
    const [matchFound, setMatchFound] = useState(false);
    const [opponent, setOpponent] = useState<Participant | null>(null);

    const [roomData, setRoomData] = useState<Room | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const displayName = profile?.display_name || profile?.full_name || user?.user_metadata?.full_name || "User";
    const avatarUrl = profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.id || 'default');

    // --- CUSTOM ROOM LOGIC ---
    useEffect(() => {
        if (!roomId || !user) return;

        const fetchRoom = async () => {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (data) {
                setRoomData(data);
                setIsHost(data.host_id === user.id);
                setParticipants(data.participants || []);
                setSearching(true); // "Waiting" state

                // Auto-join if not in participants
                const isParticipant = data.participants?.some((p: Participant) => p.id === user.id);
                if (!isParticipant) {
                    const newParticipant: Participant = {
                        id: user.id,
                        display_name: displayName,
                        avatar_url: avatarUrl,
                        is_ready: false,
                        is_host: false,
                        level: profile?.level || 1,
                        rank: profile?.rank_name || 'Bronze I'
                    };
                    const newParticipants = [...(data.participants || []), newParticipant];
                    
                    await supabase
                        .from('rooms')
                        .update({ participants: newParticipants, current_players: newParticipants.length })
                        .eq('id', roomId);
                    
                    setParticipants(newParticipants);
                }
                
                if (data.status === 'playing') {
                     setMatchFound(true); 
                }
            } else {
                console.error("Room not found", error);
                navigate('/dashboard/arena');
            }
        };

        fetchRoom();

        // Subscribe to Room changes
        const channel = supabase
            .channel(`room_${roomId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
                setRoomData(payload.new as Room);
                setParticipants(payload.new.participants || []);
                
                if (payload.new.status === 'playing') {
                     setMatchFound(true);
                     navigate(`/gameplay?mode=${mode}&roomId=${roomId}`);
                }
            })
            .subscribe();

        return () => {
             supabase.removeChannel(channel);
        };
    }, [roomId, user, navigate, displayName, avatarUrl, mode, profile?.level, profile?.rank_name]);

    // --- MOCK PLAYER SIMULATION (for testing) ---
    const mockPlayerAddedRef = useRef(false);
    
    useEffect(() => {
        if (!roomId || !user || !isHost || !roomData) return;
        if (mockPlayerAddedRef.current) return; // Already triggered

        // Wait 5 seconds, then add mock player
        const joinTimer = setTimeout(async () => {
            if (mockPlayerAddedRef.current) return;
            mockPlayerAddedRef.current = true;

            const mockPlayer: Participant = {
                id: 'mock-player-1',
                display_name: 'CyberHunter_X',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=opponent',
                is_ready: false,
                is_host: false,
                level: 15,
                rank: 'Diamond'
            };

            // Fetch current participants from DB to avoid stale state
            const { data: currentRoom } = await supabase
                .from('rooms')
                .select('participants')
                .eq('id', roomId)
                .single();

            const currentParticipants = currentRoom?.participants || [];
            
            // Check if mock already exists
            if (currentParticipants.some((p: { id: string }) => p.id === 'mock-player-1')) return;
            if (currentParticipants.length >= 2) return;

            const newParticipants = [...currentParticipants, mockPlayer];
            
            await supabase
                .from('rooms')
                .update({ participants: newParticipants, current_players: newParticipants.length })
                .eq('id', roomId);

            // Wait another 5 seconds, then mark mock player as ready
            setTimeout(async () => {
                const { data: roomNow } = await supabase
                    .from('rooms')
                    .select('participants')
                    .eq('id', roomId)
                    .single();

                const latestParticipants = roomNow?.participants || [];
                const updatedParticipants = latestParticipants.map((p: { id: string; is_ready?: boolean }) =>
                    p.id === 'mock-player-1' ? { ...p, is_ready: true } : p
                );

                await supabase
                    .from('rooms')
                    .update({ participants: updatedParticipants })
                    .eq('id', roomId);
            }, 5000);
        }, 5000);

        return () => clearTimeout(joinTimer);
    }, [roomId, user, isHost, roomData]);

    const handleToggleReady = async () => {
        if (!roomData || !user) return;
        
        const updatedParticipants = participants.map(p => 
            p.id === user.id ? { ...p, is_ready: !p.is_ready } : p
        );

        const { error } = await supabase
            .from('rooms')
            .update({ participants: updatedParticipants })
            .eq('id', roomId);

        if (error) {
            console.error("Error updating ready status:", error);
        } else {
             setParticipants(updatedParticipants);
        }
    };

    const handleStartGame = async () => {
        if (!isHost) return;
        
        // Check if all guests are ready (Host is always ready effectively, but let's check everyone else)
        // Or assume host clicking start IS the host ready signal + start signal.
        // We need at least 2 players to start?
        if (participants.length < 2) {
            alert("Cần ít nhất 2 người chơi để bắt đầu!");
            return;
        }

        const allReady = participants.every(p => p.is_host || p.is_ready);
        if (!allReady) {
            alert("Tất cả người chơi cần Sẵn sàng!");
            return;
        }

        await supabase
            .from('rooms')
            .update({ status: 'playing' })
            .eq('id', roomId);
    };

    // Handle Copy Code
    const handleCopyCode = () => {
        if (roomData?.code) {
             navigator.clipboard.writeText(roomData.code);
             setCopied(true);
             setTimeout(() => setCopied(false), 2000);
        }
    };

    // --- TIMER EFFECT ---
    useEffect(() => {
        let interval: any;
        if (searching && !matchFound) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [searching, matchFound]);

    // --- MATCHMAKING SIMULATION (Only if NOT custom room) ---
    useEffect(() => {
        if (!roomId && searching && timer >= 5 && !matchFound) {
            const t = setTimeout(() => {
                setMatchFound(true);
                setOpponent({
                    display_name: "CyberHunter_X",
                    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=opponent",
                    level: 15,
                    rank: 'Diamond',
                    is_ready: false,
                    is_host: false,
                    id: 'mock-player-1'
                });
            }, 0);
            return () => clearTimeout(t);
        }
    }, [searching, timer, matchFound, roomId]);

    const handleFindMatch = () => {
        setSearching(true);
        setMatchFound(false);
        setTimer(0);
        setOpponent(null);
    };

    const handleCancelSearch = () => {
        setSearching(false);
        setMatchFound(false);
        setTimer(0);
        setOpponent(null);
        if (roomId) navigate('/dashboard/arena'); // Leave room
    };

    const handleDeclineMatch = () => {
        setSearching(false);
        setMatchFound(false);
        setTimer(0);
        setOpponent(null);
        if (roomId) navigate('/dashboard/arena'); // Leave room
    };

    const handleAcceptMatch = () => {
        navigate(`/gameplay?mode=${mode}&roomId=${roomId || ''}`);
    };

    // Helper to get opponent (for UI display)
    const opponentPlayer = participants.find(p => p.id !== user?.id);
    // Sync local opponent state for fallback UI if needed, but we'll use 'participants' primarily
    useEffect(() => {
        if (opponentPlayer) {
            // Use setTimeout to avoid cascading renders warning
            const t = setTimeout(() => {
                setOpponent({
                    display_name: opponentPlayer.display_name,
                    avatar_url: opponentPlayer.avatar_url,
                    level: opponentPlayer.level,
                    rank: opponentPlayer.rank,
                    id: opponentPlayer.id,
                    is_ready: opponentPlayer.is_ready,
                    is_host: opponentPlayer.is_host
                });
                setMatchFound(true); // To show the VS UI
            }, 0);
            return () => clearTimeout(t);
        } else if (roomId) { // Only reset if in custom room
            const t = setTimeout(() => {
                setMatchFound(false);
                setOpponent(null);
            }, 0);
            return () => clearTimeout(t);
        }
    }, [opponentPlayer, roomId]);

    
    // formatTime helper removed as it was unused

    const getModeDetails = () => {
        switch (mode.toLowerCase()) {
            case 'ranked':
                return {
                    title: 'Xếp hạng (Ranked)',
                    icon: Bookmark,
                    color: 'text-fuchsia-400',
                    bg: 'from-fuchsia-600/20 to-purple-600/20',
                    border: 'border-fuchsia-500/30'
                };
            case 'deathmatch':
                return {
                    title: 'Tử chiến (Deathmatch)',
                    icon: Zap,
                    color: 'text-red-400',
                    bg: 'from-red-600/20 to-orange-600/20',
                    border: 'border-red-500/30'
                };
            default:
                return {
                    title: 'Đấu thường (Normal)',
                    icon: Swords,
                    color: 'text-blue-400',
                    bg: 'from-blue-600/20 to-cyan-600/20',
                    border: 'border-blue-500/30'
                };
        }
    };

    const details = getModeDetails();

    return (
        <div className="fixed inset-0 z-[100] bg-neutral-950 text-white p-4 h-screen overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <button 
                    onClick={() => navigate('/dashboard/arena')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-wider">Quay lại đấu trường</span>
                </button>

                <div className="flex items-center gap-4 bg-neutral-900 border border-white/5 px-6 py-2 rounded-full backdrop-blur-md">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Server: Southeast Asia</span>
                     </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-center content-center h-full pb-20">
                
                {/* Left Column: Mode Info */}
                <div className="space-y-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${details.bg} border ${details.border}`}>
                        <details.icon size={16} className={details.color} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${details.color}`}>
                            {mode} MODE
                        </span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                        {roomId && roomData ? roomData.name : details.title}
                    </h1>
                    
                    {roomId && roomData ? (
                        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 mt-4 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-20"><Bookmark size={40} /></div>
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Mã phòng (Room Code)</div>
                             <div className="flex items-center gap-4">
                                 <span className="text-3xl font-mono font-bold text-fuchsia-400 tracking-widest">{roomData.code}</span>
                                 <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                     {copied ? <Check className="text-green-500" size={20} /> : <Copy className="text-gray-400" size={20} />}
                                 </button>
                             </div>
                             <p className="text-xs text-gray-500 mt-2">Chia sẻ mã này cho bạn bè để mời họ vào phòng.</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-lg leading-relaxed">
                            {searching ? "Đang tìm kiếm đối thủ xứng tầm..." : "Sẵn sàng tham chiến? Hãy bấm nút tìm trận để bắt đầu hành trình của bạn."}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Thể thức</div>
                             <div className="text-white font-bold">{roomData?.settings?.format || 'Season 12'}</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Câu hỏi</div>
                             <div className="text-white font-bold">{roomData?.settings?.questions_per_round ? `${roomData.settings.questions_per_round} câu/Round` : 'Ngẫu nhiên'}</div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Empty for custom room, Visuals for normal matchmaking */}
                <div className="flex-1 relative flex flex-col items-center justify-center min-h-[300px]">
                     
                     {/* --- SEARCHING STATE (Hide for Custom Room) --- */}
                     {searching && !matchFound && !opponent && !roomId && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-in fade-in duration-500">
                             <div className="relative">
                                 <div className="w-56 h-56 rounded-full border-2 border-fuchsia-500/30 animate-[spin_3s_linear_infinite]"></div>
                                 <div className="absolute inset-0 w-56 h-56 rounded-full border-t-2 border-fuchsia-400 animate-[spin_2s_linear_infinite_reverse]"></div>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <Loader2 size={40} className="text-fuchsia-500 animate-spin" />
                                 </div>
                             </div>
                             <div className="mt-8 text-center space-y-2">
                                 <div className="text-2xl font-bold text-white tracking-wider animate-pulse">
                                     SCANNING...
                                 </div>
                                 <div className="text-fuchsia-400 font-mono text-lg">
                                     {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                                 </div>
                                 <div className="text-sm text-gray-500">Estimated time: 00:15</div>
                             </div>
                         </div>
                     )}

                     {/* --- IDLE STATE (Placeholder Visual) --- */}
                     {!searching && !roomId && (
                         <div className="relative opacity-20 select-none pointer-events-none">
                              <Swords size={200} className="text-gray-700" />
                         </div>
                     )}
                </div>

                {/* Right Column: Opponent display or placeholder for custom room */}
                <div className="flex-1 relative flex flex-col items-center justify-center min-h-[300px]">
                     {/* --- MATCH FOUND STATE (for both custom and normal) --- */}
                     {matchFound && opponent && (
                        <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                             <div className="relative">
                                 <div className="w-40 h-40 rounded-full bg-neutral-800 overflow-hidden border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                     <img src={opponent.avatar_url} className="w-full h-full object-cover" alt={opponent.display_name} />
                                 </div>
                             </div>
                             <div className="mt-6 text-center space-y-2">
                                 <h3 className="text-2xl font-bold text-white">{opponent.display_name}</h3>
                                 <div className="flex items-center justify-center gap-4 text-sm">
                                     <span className="text-gray-400">Level <span className="text-white font-bold">{opponent.level || 1}</span></span>
                                     <span className="text-fuchsia-400 font-bold uppercase tracking-wider">{opponent.rank || 'Bronze I'}</span>
                                 </div>
                             </div>
                        </div>
                     )}

                     {/* --- CUSTOM ROOM PLACEHOLDER (only when no opponent) --- */}
                     {roomId && !matchFound && (
                        <div className="relative flex flex-col items-center gap-6">
                            <div className="w-64 h-64 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                <span className="text-6xl font-bold text-white/20">?</span>
                            </div>
                        </div>
                     )}
                </div>
            </div>
            
            {/* --- INVITE MODAL --- */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Mời người chơi</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên người chơi</label>
                                <input 
                                    type="text" 
                                    placeholder="Nhập tên..." 
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-fuchsia-500 transition-colors"
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase transition-colors text-sm"
                                >
                                    Đóng
                                </button>
                                <button 
                                    className="flex-1 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold uppercase shadow-lg shadow-fuchsia-900/20 active:scale-95 transition-all text-sm"
                                >
                                    Mời
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Bar: Player Slots & Actions */}
            <div className="border-t border-white/5 pt-6 pb-6 mt-auto shrink-0 flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto w-full">
                 
                 {/* Player Slots */}
                 <div className="flex items-center gap-4">
                     {/* Self */}
                     <div className="relative group">
                         <div className={`w-16 h-16 rounded-2xl p-0.5 relative z-10 ${participants.find(p => p.id === user?.id)?.is_ready ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-fuchsia-600'}`}>
                              <img src={avatarUrl} className="w-full h-full rounded-[14px] object-cover bg-neutral-900" />
                              <div className="absolute -bottom-2 -right-2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">YOU</div>
                              {participants.find(p => p.id === user?.id)?.is_ready && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-neutral-900">
                                      <Check size={12} className="text-white" strokeWidth={3} />
                                  </div>
                              )}
                         </div>
                         <div className="absolute inset-0 bg-fuchsia-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                     </div>
                     
                     <div className="w-8 h-px bg-white/10"></div>
                     <span className="text-xs font-bold text-white/20">VS</span>
                     <div className="w-8 h-px bg-white/10"></div>

                     {/* Opponent Slot */}
                     <div className="relative">
                         <div className={`w-16 h-16 rounded-2xl border-2 border-dashed ${matchFound ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'} flex items-center justify-center relative z-10 transition-colors`}>
                             {matchFound && opponent ? (
                                  <div className="relative w-full h-full"> 
                                    <img src={opponent.avatar_url} className="w-full h-full rounded-[14px] object-cover p-0.5" />
                                    {opponentPlayer?.is_ready && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-neutral-900 animate-in zoom-in">
                                            <Check size={12} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                  </div>
                             ) : (
                                  roomId ? (
                                    <button 
                                        onClick={() => setShowInviteModal(true)}
                                        className="w-full h-full flex items-center justify-center hover:bg-white/10 rounded-[14px] transition-colors group"
                                    >
                                        <Plus className="text-gray-500 group-hover:text-white transition-colors" size={24} />
                                    </button>
                                  ) : (
                                    <div className="text-white/20 font-bold">?</div>
                                  )
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="relative z-20 flex flex-col items-center gap-4 w-full max-w-sm">
                        {/* Status Text */}
                         <div className="text-center">
                             {/* Only show Match Found for normal matchmaking, not custom rooms */}
                             {!roomId && matchFound && (
                                 <div className="text-sm font-black uppercase tracking-[0.2em] mb-1 text-green-500 animate-pulse">
                                     Match Found!
                                 </div>
                             )}
                             {roomId && (
                                 <div className={`text-sm font-black uppercase tracking-[0.2em] mb-1 ${opponentPlayer ? 'text-gray-400' : 'text-gray-500'}`}>
                                     {opponentPlayer ? '' : 'Đợi người chơi khác...'}
                                 </div>
                             )}
                             {!roomId && !matchFound && (
                                 <div className="text-sm font-black uppercase tracking-[0.2em] mb-1">
                                     {searching ? 'Searching' : 'Idle'}
                                 </div>
                             )}
                             {searching && !matchFound && !roomId && (
                                 <div className="flex justify-center gap-1">
                                     <div className="w-1 h-1 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                     <div className="w-1 h-1 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                     <div className="w-1 h-1 bg-fuchsia-500 rounded-full animate-bounce"></div>
                                 </div>
                             )}
                         </div>

                        {/* --- BUTTONS LOGIC --- */}
                        {roomId ? (
                            // CUSTOM ROOM BUTTONS
                            <div className="w-full space-y-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancelSearch}
                                        className="flex-1 py-4 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-500 font-bold uppercase tracking-wider transition-all border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] active:scale-95 backdrop-blur-md group text-sm"
                                    >
                                        <span className="group-hover:animate-pulse">Rời phòng</span>
                                    </button>

                                    {isHost ? (
                                        <button 
                                            onClick={handleStartGame}
                                            disabled={participants.length < 2 || participants.some(p => !p.is_host && !p.is_ready)}
                                            className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Play size={20} fill="currentColor" /> Bắt đầu
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleToggleReady}
                                            className={`flex-[2] py-4 rounded-xl font-bold uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm ${
                                                participants.find(p => p.id === user?.id)?.is_ready 
                                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-900/20' 
                                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                            }`}
                                        >
                                            {participants.find(p => p.id === user?.id)?.is_ready ? 'Huỷ sẵn sàng' : 'Sẵn sàng'}
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-center text-gray-500 font-mono">
                                    {participants.length}/2 Players Connected
                                </div>
                            </div>
                        ) : (
                            // NORMAL MATCHMAKING BUTTONS
                            matchFound ? (
                                <div className="flex gap-4 w-full">
                                    <button onClick={handleDeclineMatch} className="flex-1 py-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all border border-white/10 text-sm">
                                        Decline
                                    </button>
                                    <button onClick={handleAcceptMatch} className="flex-[2] py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] animate-pulse transition-all text-sm">
                                        Accept Match
                                    </button>
                                </div>
                            ) : searching ? (
                                <button
                                    onClick={handleCancelSearch}
                                    className="w-full py-4 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-500 font-bold uppercase tracking-[0.2em] transition-all border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] active:scale-95 backdrop-blur-md group"
                                >
                                    <span className="group-hover:animate-pulse">Hủy tìm trận</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleFindMatch}
                                    className={`w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase tracking-[0.25em] text-lg transition-all shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] border border-cyan-400/30 hover:scale-105 active:scale-95 group relative overflow-hidden`}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] duration-[1000ms]"></div>
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        <span className="hidden group-hover:inline-block animate-in fade-in slide-in-from-left-2">►</span>
                                        Tìm trận
                                        <span className="hidden group-hover:inline-block animate-in fade-in slide-in-from-right-2">◄</span>
                                    </span>
                                </button>
                            )
                        )}
                </div>
            </div>
            
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
    );
};

export default ArenaLobbyView;
