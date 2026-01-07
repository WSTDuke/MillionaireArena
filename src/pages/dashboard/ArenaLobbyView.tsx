import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { Zap, Swords, X, Loader2, Bookmark, Check, Play, Plus } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

import { leaveRoom as leaveRoomUtil } from '../../lib/roomManager';
import { fetchQuestions, type ProcessedQuestion } from '../../lib/trivia';

interface Participant {
    id: string;
    display_name: string;
    avatar_url: string;
    is_ready: boolean;
    is_host: boolean;
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
    const { user, profile } = useOutletContext<{ 
        user: { id: string; user_metadata: { full_name?: string; avatar_url?: string } }; 
        profile: { display_name?: string; full_name?: string; avatar_url?: string; rank_name?: string; mmr?: number } 
    }>();
    const mode = searchParams.get('mode') || 'Normal';
    const roomId = searchParams.get('roomId');
    
    // State for manual matchmaking
    const [searching, setSearching] = useState(false);
    const [timer, setTimer] = useState(0);
    const [matchFound, setMatchFound] = useState(false);
    const [matchCountdown, setMatchCountdown] = useState<number | null>(null);
    const [opponent, setOpponent] = useState<Participant | null>(null);

    const [roomData, setRoomData] = useState<Room | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const isNavigatingToGame = useRef(false);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const mountTimeRef = useRef(0);
    const hasJoined = useRef(false);
    const leaveRoomRef = useRef<(() => Promise<void>) | null>(null);

    const getModeDetails = () => {
        switch (mode.toLowerCase()) {
            case 'ranked':
                return {
                    title: 'Đấu hạng (Ranked)',
                    icon: Bookmark,
                    color: 'text-red-400',
                    bg: 'from-red-600/20 to-orange-600/20',
                    border: 'border-red-500/30',
                    format: 'Bo5',
                    questions: '10 câu/Round'
                };
            case 'bot':
                return {
                    title: 'Đấu máy (BOT)',
                    icon: Zap,
                    color: 'text-blue-400',
                    bg: 'from-blue-600/20 to-cyan-600/20',
                    border: 'border-blue-500/30',
                    format: 'Bo3',
                    questions: '5 câu/Round'
                };
            default:
                return {
                    title: 'Đấu thường (Normal)',
                    icon: Swords,
                    color: 'text-purple-400',
                    bg: 'from-purple-600/20 to-fuchsia-600/20',
                    border: 'border-purple-500/30',
                    format: 'Bo3',
                    questions: '10 câu/Round'
                };
        }
    };

    const details = getModeDetails();
    const displayName = profile?.display_name || profile?.full_name || user?.user_metadata?.full_name || "User";
    const avatarUrl = profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.id || 'default');

    // --- INTERNAL INITIALIZATION SAFEGUARD ---
    const [isInternalInit, setIsInternalInit] = useState(true);
    const [showIntro, setShowIntro] = useState(true);
    const [introExiting, setIntroExiting] = useState(false);

    useEffect(() => {
        // Only trigger exit if we have profile data (or timeout fallback)
        if (profile) {
             const minLoadTime = 1500; // Minimum time to show "Initializing" animation
             const now = Date.now();
             const renderTime = (window as any)._renderStartTime || now; // heuristic
             const elapsed = now - renderTime;
             const remaining = Math.max(0, minLoadTime - elapsed);

             const timer = setTimeout(() => {
                 // 1. Reveal Real Data (Behind Opaque Overlay)
                 setIsInternalInit(false);
                 
                 // 2. Schedule Exit Animation after a brief paint delay
                 setTimeout(() => {
                     setIntroExiting(true);
                 }, 200); 
             }, remaining);

             return () => clearTimeout(timer);
        }
    }, [profile]);

    // Force exit after 5s max (fallback)
    useEffect(() => {
        (window as any)._renderStartTime = Date.now();
         const t = setTimeout(() => {
             setIsInternalInit(false);
             setTimeout(() => setIntroExiting(true), 100);
         }, 5000);
         return () => clearTimeout(t);
    }, []);

    // Remove from DOM after exit animation
    useEffect(() => {
        if (introExiting) {
             const t = setTimeout(() => setShowIntro(false), 1000);
             return () => clearTimeout(t);
        }
    }, [introExiting]);

    // --- LOADING STATE ---
    // Wait for the profile and internal init to load to avoid sequential flickering
    // CRITICAL: isProfileLoading must be FALSE when the overlay fades.
    const isProfileLoading = !profile || isInternalInit;

    // --- SKELETON COMPONENTS ---
    const SkeletonItem = ({ className = "" }: { className?: string }) => (
        <div className={`animate-pulse rounded ${details.color.replace('text-', 'bg-').replace('-400', '-500/10')} ${className}`} />
    );

    const leaveRoom = useCallback(async () => {
        if (!roomId || !user?.id) return;
        await leaveRoomUtil(roomId, user.id);
    }, [roomId, user?.id]);

    // Keep leaveRoom ref updated for cleanup
    useEffect(() => {
        leaveRoomRef.current = leaveRoom;
    }, [leaveRoom]);

    const cancelMatchmaking = useCallback(async () => {
        if (!user?.id) return;
        await supabase.from('matchmaking').delete().eq('user_id', user.id);
    }, [user?.id]);

    // --- BOT MODE: PRE-POPULATE OPPONENT ---
    useEffect(() => {
        if (mode.toLowerCase() === 'bot' && user && profile) {
            // Define BOT opponent data
            const BOT_OPPONENT: Participant = {
                id: 'bot-ai-001',
                display_name: 'AI Assistant',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bot-ai',
                is_ready: true,
                is_host: false,
                rank: 'Diamond I'
            };

            // Pre-populate opponent (but DON'T set matchFound yet - keep button visible)
            setOpponent(BOT_OPPONENT);
            console.log('BOT mode: Pre-populated AI opponent');
        }
    }, [mode, user, profile]);

    // --- LEAVE ON UNMOUNT & TAB CLOSE ---
    useEffect(() => {
        mountTimeRef.current = Date.now();
        const handleBeforeUnload = () => {
             // Tab closure: always try to leave if not going to game
             if (!isNavigatingToGame.current) {
                if (leaveRoomRef.current) leaveRoomRef.current();
                // Also try to cancel matchmaking if searching
                supabase.from('matchmaking').delete().eq('user_id', user?.id).then();
             }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Capture mount time for cleanup protection
        const mountTimeAtStart = mountTimeRef.current;

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            
            // PROTECTION: Skip cleanup if component was mounted for < 2s (Strict Mode / Fast Refresh)
            const duration = Date.now() - mountTimeAtStart;
            if (duration < 2000) {
                 console.log("Cleanup: Skipping room leave (Short mount time)");
                 return;
            }

            if (!isNavigatingToGame.current && !isNavigatingAway && leaveRoomRef.current) {
                console.log("Cleanup: Leaving room on unmount");
                leaveRoomRef.current();
            }
        };
    }, [isNavigatingAway, user?.id]); 
 // Run ONLY on true unmount of this component instance

    // --- CUSTOM ROOM LOGIC ---
    
    // --- REUSABLE FETCH LOGIC ---
    const fetchRoomData = useCallback(async (isInitial = false) => {
        if (!roomId || !user) return;

        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .maybeSingle();

        if (data) {
            setRoomData(data);
            setIsHost(data.host_id === user.id);
            setParticipants(data.participants || []);
            
            if (isInitial && !hasJoined.current && profile) {
                hasJoined.current = true;
                setSearching(true); // "Waiting" state
                
                const myParticipantData: Participant = {
                    id: user.id,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                    is_ready: false,
                    is_host: (data.host_id === user.id),
                    rank: profile?.rank_name || 'Bronze I'
                };

                // setJoining(true); // Removed unused joining state
                // ATOMIC JOIN VIA RPC (Only if not already in participants)
                const isAlreadyInRoom = data.participants?.some((p: Participant) => p.id === user.id);
                
                if (isAlreadyInRoom) {
                    console.log("User already in participants list, skipping join RPC.");
                    setParticipants(data.participants);
                } else {
                    try {
                        const { error: rpcError } = await supabase.rpc('join_room', {
                            p_room_id: roomId,
                            p_participant: myParticipantData
                        });
                        
                        if (rpcError) {
                            console.error("RPC Join Error:", rpcError);
                            alert(`Lỗi khi vào phòng: ${rpcError.message}`);
                            navigate('/dashboard/arena');
                            return;
                        }

                        // Refresh data after RPC to be sure
                        const { data: freshRoom } = await supabase
                            .from('rooms')
                            .select('*')
                            .eq('id', roomId)
                            .maybeSingle();
                            
                        if (freshRoom) {
                            setParticipants(freshRoom.participants || []);
                            setRoomData(freshRoom);
                        }
                    } catch (err) {
                        console.error("Unexpected Join Error:", err);
                    }
                }
            }

            if (data.status === 'playing') {
                 setSearching(false); 
            }
        } else {
            console.error("Room not found", error);
            if (isInitial) navigate('/dashboard/arena');
        }
    }, [roomId, user, profile, displayName, avatarUrl, navigate]);

    // --- INITIAL FETCH ---
    useEffect(() => {
        if (user && profile) {
            fetchRoomData(true);
        } else if (user) {
            // Fetch initial room data but don't join yet until profile is ready
            fetchRoomData(false);
        }
    }, [fetchRoomData, user, profile]);

    // --- STABLE SUBSCRIPTION ---
    useEffect(() => {
        if (!roomId || !user?.id) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let retryTimeout: ReturnType<typeof setTimeout>;
        let isMounted = true;

        const cleanup = () => {
             if (channel) {
                console.log("Cleaning up Room subscription...");
                supabase.removeChannel(channel);
                channel = null;
             }
             if (retryTimeout) clearTimeout(retryTimeout);
        };

        const initializeSubscription = () => {
            if (!isMounted) return;

            console.log("Subscribing to room:", roomId);
            channel = supabase
                .channel(`room_${roomId}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'rooms', 
                    filter: `id=eq.${roomId}` 
                }, (payload) => {
                    if (!isMounted) return;
                    console.log("Room update received:", payload);
                    const updatedRoom = payload.new as Room;
                    if (updatedRoom && updatedRoom.id) {
                        setRoomData(updatedRoom);
                        setParticipants(updatedRoom.participants || []);
                        setIsHost(updatedRoom.host_id === user?.id);
                        
                        // Only navigate if we're not already navigating
                        if (updatedRoom.status === 'playing' && !isNavigatingToGame.current) {
                             isNavigatingToGame.current = true;
                             setMatchFound(true);
                             navigate(`/gameplay?mode=${mode}&roomId=${roomId}`);
                        }
                    }
                })
                .subscribe((status) => {
                    if (!isMounted) return;
                    console.log(`Subscription status for room ${roomId}:`, status);
                    
                    if (status === 'CLOSED' || status === 'TIMED_OUT') {
                        console.warn("Room subscription unstable. Retrying...");
                        retryTimeout = setTimeout(() => {
                            cleanup();
                            initializeSubscription();
                        }, 3000);
                    }
                });
        };

        initializeSubscription();

        return () => {
            isMounted = false;
            cleanup();
        };
    }, [roomId, user?.id, mode, navigate]);

    // --- POLLING FALLBACK (Atomic Sync) ---
    useEffect(() => {
        if (!roomId || !user) return;

        console.log("Starting polling for room:", roomId);
        const pollInterval = setInterval(() => {
            fetchRoomData(false);
        }, 3000); // 3 seconds fallback

        return () => {
            console.log("Stopping polling for room:", roomId);
            clearInterval(pollInterval);
        };
    }, [roomId, user, fetchRoomData]);

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

    const handleStartGame = useCallback(async () => {
        if (!isHost || isStarting || !roomData) return;
        
        if (participants.length < 2) {
            alert("Cần ít nhất 2 người chơi để bắt đầu!");
            return;
        }
        
        const allReady = participants.every(p => p.is_host || p.is_ready);
        if (!allReady) {
            alert("Tất cả người chơi cần Sẵn sàng!");
            return;
        }

        setIsStarting(true);
        try {
            // STEP 0: Set room status to 'preparing' so guest sees the loading screen too
            await supabase
                .from('rooms')
                .update({ status: 'preparing' })
                .eq('id', roomId);

            const settings = roomData.settings || {};
            const qCount = settings.questions_per_round || 10;
            const format = settings.format || (mode === 'Ranked' ? 'Bo5' : 'Bo3');

            // Dynamic BoX Parsing
            let gameMaxRounds = 1;
            if (format.startsWith('Bo')) {
                gameMaxRounds = parseInt(format.substring(2)) || 1;
            } else {
                gameMaxRounds = format === 'Bo5' ? 5 : (format === 'Bo3' ? 3 : 1);
            }

            console.log(`Host initializing ${format} match (${gameMaxRounds} rounds, ${qCount} q/round)...`);
            
            
            const fetchPromises = [];
            
            // Rounds 1-2: Easy
            const easyRounds = Math.min(gameMaxRounds, 2);
            if (easyRounds > 0) {
                fetchPromises.push(fetchQuestions(easyRounds * qCount, 'easy', user.id));
            }

            // Rounds 3-4: Medium
            if (gameMaxRounds >= 3) {
                const mediumRounds = Math.min(gameMaxRounds - 2, 2);
                fetchPromises.push(fetchQuestions(mediumRounds * qCount, 'medium', user.id));
            }

            // Rounds 5+: Hard
            if (gameMaxRounds >= 5) {
                const hardRounds = gameMaxRounds - 4;
                fetchPromises.push(fetchQuestions(hardRounds * qCount, 'hard', user.id));
            }

            console.log("Fetching all difficulty blocks in parallel...");
            const results = await Promise.all(fetchPromises);
            const allQuestions: ProcessedQuestion[] = results.flat();

            console.log("Saving questions and starting match...");
            await supabase
                .from('rooms')
                .update({ 
                    status: 'playing',
                    questions: allQuestions
                })
                .eq('id', roomId);
        } catch (err) {
            console.error("Error starting game (question fetch):", err);
            alert("Lỗi khi chuẩn vế câu hỏi (API Busy). Vui lòng đợi 5-10 giây và thử lại!");
        } finally {
            setIsStarting(false);
        }
    }, [isHost, isStarting, roomData, participants, roomId, mode, user?.id]);

    // --- AUTO-START FOR MATCHMAKING ---
    useEffect(() => {
        // Initialize countdown when match is found (and not starting yet)
        if (roomId && mode !== 'custom' && participants.length === 2 && roomData?.status === 'waiting' && matchCountdown === null && !isStarting) {
            setMatchCountdown(3);
        }

        // Decrement countdown
        if (matchCountdown !== null && matchCountdown > 0) {
            const t = setTimeout(() => {
                setMatchCountdown(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
            return () => clearTimeout(t);
        }

        // Start game when countdown hits 0
        if (matchCountdown === 0) {
            if (isHost && !isStarting && roomData?.status === 'waiting') {
                handleStartGame();
                // We DON'T set matchCountdown to null immediately for Host, 
                // to prevent the "Initialize" guard above from firing again before status changes
            } else if (!isHost) {
                // Guest can reset once it hits 0 and they see 'preparing' soon
                setMatchCountdown(null);
            }
        }

        // Cleanup: If match is lost or status changes, reset countdown
        if (participants.length < 2 || roomData?.status !== 'waiting') {
            if (matchCountdown !== null && matchCountdown !== 0) {
                setMatchCountdown(null);
            }
        }
    }, [roomId, isStarting, isHost, mode, participants.length, roomData?.status, handleStartGame, matchCountdown]);

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
        let interval: number | undefined;
        if (searching && !matchFound) {
            interval = window.setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => window.clearInterval(interval);
    }, [searching, matchFound]);

    // --- MATCHMAKING LOGIC (Real rooms only) ---
    // (Actual matching happens via the polling/subscription to the 'rooms' table)

    const handleFindMatch = async () => {
        if (!user || roomId) return;
        
        // BOT MODE: Skip matchmaking, go straight to game
        if (mode.toLowerCase() === 'bot') {
            console.log('BOT mode: Starting game directly');
            isNavigatingToGame.current = true;
            setIsGameWarping(true);
            
            // Navigate to gameplay with BOT room ID
            setTimeout(() => {
                navigate(`/gameplay?mode=bot&roomId=bot-local-${user.id}`);
            }, 1500); // Small delay for warp animation
            return;
        }

        setSearching(true);
        setMatchFound(false);
        setTimer(0);
        setOpponent(null);

        const myParticipantData: Participant = {
            id: user.id,
            display_name: displayName,
            avatar_url: avatarUrl,
            is_ready: true, // Auto ready for matchmaking
            is_host: false,
            rank: profile?.rank_name || 'Bronze I'
        };

        try {
            const { data: matchedRoomId, error } = await supabase.rpc('find_or_create_match', {
                p_user_id: user.id,
                p_mode: mode,
                p_participant_data: myParticipantData
            });

            if (error) throw error;

            if (matchedRoomId) {
                console.log("Match found immediately!", matchedRoomId);
                navigate(`/dashboard/arena/lobby?mode=${mode}&roomId=${matchedRoomId}`, { replace: true });
            } else {
                console.log("Joined matchmaking queue...");
            }
        } catch (err) {
            console.error("Matchmaking error:", err);
            setSearching(false);
            alert("Lỗi khi tìm trận. Vui lòng thử lại.");
        }
    };

    const handleCancelSearch = async () => {
        setIsNavigatingAway(true);
        if (roomId) {
            await leaveRoom();
        } else {
            await cancelMatchmaking();
        }
        setSearching(false);
        setMatchFound(false);
        setTimer(0);
        setOpponent(null);
        if (roomId) navigate('/dashboard/arena'); // Leave room
    };

    // Helper to get opponent (for UI display)
    const opponentPlayer = participants.find(p => p.id !== user?.id);

    // --- EFFECT STATES ---
    const [showMatchFoundEffect, setShowMatchFoundEffect] = useState(false);
    const [isGameWarping, setIsGameWarping] = useState(false);

    // Sync local opponent state
    useEffect(() => {
        if (opponentPlayer) {
            const t = setTimeout(() => {
                setOpponent({
                    display_name: opponentPlayer.display_name || 'Opponent',
                    avatar_url: opponentPlayer.avatar_url || '',
                    rank: opponentPlayer.rank || 'Bronze I',
                    id: opponentPlayer.id,
                    is_ready: opponentPlayer.is_ready || false,
                    is_host: opponentPlayer.is_host || false
                });
                setMatchFound(true);
                // Trigger Effect only if it's a new find (not just re-render)
                if (!matchFound) {
                    setShowMatchFoundEffect(true);
                    setTimeout(() => setShowMatchFoundEffect(false), 2500); 
                }
            }, 0);
            return () => clearTimeout(t);
        } else if (roomId && mode === 'custom') {
            const t = setTimeout(() => {
                setMatchFound(false);
                setOpponent(null);
            }, 0);
            return () => clearTimeout(t);
        }
    }, [opponentPlayer, roomId, mode, matchFound]);

    // Handle Game Start Animation intercept
    useEffect(() => {
        // Trigger Warp on 'preparing' (Guest) or 'starting' (Host) or 'playing' (Both)
        if (isStarting || roomData?.status === 'preparing' || (roomData?.status === 'playing' && !isGameWarping)) {
             setIsGameWarping(true);
        }
    }, [isStarting, roomData?.status, isGameWarping]);

    // --- MATCHMAKING SUBSCRIPTION ---
    useEffect(() => {
        if (roomId || !searching || !user?.id) return;

        const channel = supabase
            .channel(`matchmaking_${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'matchmaking',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const updated = payload.new as { room_id: string | null };
                if (updated.room_id) {
                    console.log("Match found via subscription!", updated.room_id);
                    cancelMatchmaking();
                    navigate(`/dashboard/arena/lobby?mode=${mode}&roomId=${updated.room_id}`, { replace: true });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, searching, user?.id, mode, navigate, cancelMatchmaking]);

    // --- MATCHMAKING POLLING FALLBACK ---
    useEffect(() => {
        if (roomId || !searching || !user?.id) return;

        const interval = setInterval(async () => {
            const { data, error } = await supabase
                .from('matchmaking')
                .select('room_id')
                .eq('user_id', user.id)
                .single();
            
            if (!error && data?.room_id) {
                console.log("Match found via polling fallback!", data.room_id);
                clearInterval(interval);
                cancelMatchmaking();
                navigate(`/dashboard/arena/lobby?mode=${mode}&roomId=${data.room_id}`, { replace: true });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [roomId, searching, user?.id, mode, navigate, cancelMatchmaking]);

    const isInitialLoading = !roomData && !!roomId;
    

    // Starting Overlay (Shared)
    const isSharedPreparing = roomData?.status === 'preparing' || isStarting;

    return (
        <div className="fixed inset-0 z-[100] bg-neutral-950 text-white p-4 h-screen overflow-hidden flex flex-col">
            
            {/* --- MATCH FOUND EFFECT --- */}
            {showMatchFoundEffect && (
                <div className="fixed inset-0 z-[1000] bg-red-600/90 mix-blend-hard-light flex items-center justify-center animate-out fade-out duration-500 delay-[2000ms] fill-mode-forwards pointer-events-none">
                    <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                        <Swords size={120} className="text-white animate-bounce" />
                        <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mt-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-pulse">
                            Tìm thấy đối thủ!
                        </h1>
                        <div className="w-[120%] h-2 bg-white mt-8 animate-[ping_1s_linear_infinite]"></div>
                    </div>
                </div>
            )}

            {/* --- GAME WARP EFFECT --- */}
            {isGameWarping && (
                <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
                     <div className="w-full h-full absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-black"></div>
                     <div className="relative z-10 flex flex-col items-center">
                         <div className="w-40 h-40 rounded-full border-8 border-blue-500 border-t-white animate-spin duration-700 shadow-[0_0_100px_rgba(59,130,246,0.5)]"></div>
                         <h2 className="text-4xl font-black text-white uppercase tracking-[0.5em] mt-12 animate-pulse">
                             ĐANG TIẾN VÀO ĐẤU TRƯỜNG
                         </h2>
                         <div className="text-blue-400 font-mono mt-4 animate-bounce">
                             ĐANG ĐỒNG BỘ GAME...
                         </div>
                     </div>
                </div>
            )}

            {/* --- ENTRANCE ANIMATION OVERLAY --- */}
            {showIntro && (
                <div className={`fixed inset-0 z-[999] bg-neutral-950 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out fill-mode-forwards ${introExiting ? 'opacity-0 translate-y-[-100%]' : 'opacity-100 translate-y-0'}`}>
                     <div className="relative">
                         <div className={`w-32 h-32 rounded-full border-4 ${details.border} border-t-transparent animate-spin`}></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <details.icon size={40} className={`${details.color} animate-pulse`} />
                         </div>
                     </div>
                     <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em] mt-8 animate-pulse">
                         Vào phòng đấu
                     </h2>
                     <div className="flex gap-2 mt-4">
                         <div className={`w-3 h-3 rounded-full ${details.color.replace('text-', 'bg-')} animate-bounce delay-0`}></div>
                         <div className={`w-3 h-3 rounded-full ${details.color.replace('text-', 'bg-')} animate-bounce delay-100`}></div>
                         <div className={`w-3 h-3 rounded-full ${details.color.replace('text-', 'bg-')} animate-bounce delay-200`}></div>
                     </div>
                </div>
            )}

            {/* Starting Overlay (Shared) - Only show if NOT warping (Fallback) */}
            {isSharedPreparing && !isGameWarping && (
                <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 text-center px-6">
                    <div className="relative mb-8">
                         <div className="w-24 h-24 rounded-full border-4 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <Zap size={32} className="text-fuchsia-500 animate-pulse" />
                         </div>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-2">Đang lấy câu hỏi...</h2>
                    <p className="text-gray-400 text-sm max-w-xs">Hệ thống đang chuẩn bị bộ câu hỏi đồng bộ cho cả hai đấu thủ. Vui lòng chờ trong giây lát.</p>
                </div>
            )}
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                {!roomId ? (
                    <button 
                        onClick={() => navigate('/dashboard/arena')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                        <span className="font-bold text-sm uppercase tracking-wider">Quay lại sảnh chính</span>
                    </button>
                ) : (
                    <div /> // Spacer for custom rooms
                )}

                <div className="flex items-center gap-4 bg-neutral-900 border border-white/5 px-6 py-2 rounded-full backdrop-blur-md">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Server: Southeast Asia</span>
                     </div>
                </div>
            </div>

            {/* Main Content - SYMMETRICAL LAYOUT */}
            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-0 relative z-10">
                
                {/* MATCH INFO HEADER (Restored - Vertical Banner Style requires this) */}
                <div className="flex items-center gap-6 mb-12 animate-in slide-in-from-top-4 duration-500">
                     <div className={`flex flex-col items-end`}>
                         <div className={`text-xs font-bold uppercase tracking-widest ${details.color} mb-1 opacity-80`}>Chế độ</div>
                         <div className="flex items-center gap-2">
                             <details.icon size={20} className={details.color} />
                             <span className="text-2xl font-black uppercase tracking-tight text-white">{mode}</span>
                         </div>
                     </div>
                     <div className="w-px h-10 bg-white/10"></div>
                     <div className="flex flex-col items-start">
                         <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Thể thức thi đấu</div>
                         <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                             {isInitialLoading ? (
                                <div className="flex gap-2">
                                    <SkeletonItem className="h-7 w-16" />
                                    <SkeletonItem className="h-7 w-24" />
                                </div>
                             ) : (
                                <>
                                    <span className="px-3 py-1 rounded bg-white/5 border border-white/10">{roomData?.settings?.format || details.format}</span>
                                    <span className="px-3 py-1 rounded bg-white/5 border border-white/10">{roomData?.settings?.questions_per_round || 10} Câu/Round</span>
                                </>
                             )}
                         </div>
                     </div>
                     {roomId && mode === 'custom' && (
                         <>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div className="flex flex-col items-start group cursor-pointer" onClick={handleCopyCode}>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    Mã phòng {copied && <Check size={12} className="text-green-500" />}
                                </div>
                                <div className="text-2xl font-mono font-black text-fuchsia-400 tracking-widest group-hover:text-fuchsia-300 transition-colors">
                                    {isInitialLoading ? <SkeletonItem className="h-8 w-24 mt-1" /> : roomData?.code}
                                </div>
                            </div>
                         </>
                     )}
                </div>

                {/* MAIN STAGE: YOU - VS - OPPONENT */}
                <div className="flex items-center justify-center w-full gap-4 lg:gap-12 px-4 h-full max-h-[600px]">
                    
                    {/* LEFT: YOU (BANNER STYLE) */}
                    <div className="relative group w-64 h-[28rem] shrink-0 transition-transform duration-500 hover:scale-[1.02]">
                        {/* Frame/Border Tech */}
                        <div className={`absolute inset-0 border-y-[6px] ${details.border.replace('/30', '')} bg-neutral-900/50 backdrop-blur-sm overflow-hidden flex flex-col`}>
                            {/* Inner Accent Lines */}
                            <div className="absolute top-2 left-2 right-2 h-[1px] bg-white/20 z-20"></div>
                            <div className="absolute bottom-2 left-2 right-2 h-[1px] bg-white/20 z-20"></div>

                            {/* Avatar / Character Image */}
                            <div className="absolute inset-x-0 top-0 bottom-24 bg-neutral-800 overflow-hidden">
                                {isProfileLoading ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <SkeletonItem className="w-full h-full" />
                                    </div>
                                ) : (
                                    <>
                                        <img 
                                            src={avatarUrl} 
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                            alt="You"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
                                        
                                        {/* Ready Banner */}
                                        {participants.find(p => p.id === user?.id)?.is_ready && (
                                            <div className="absolute top-8 -right-8 w-40 bg-green-500 text-black font-black text-xs py-1 text-center rotate-45 shadow-lg border-y-2 border-white/20 z-20">
                                                READY
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Bottom Info Plate */}
                            <div className="absolute bottom-0 inset-x-0 h-24 bg-neutral-900/90 flex flex-col justify-center px-4 border-t border-white/10">
                                <div className="flex items-center justify-between mb-1">
                                    <div className={`text-xs font-bold text-neutral-500 uppercase tracking-widest`}>Player</div>
                                </div>
                                {isProfileLoading ? (
                                    <div className="space-y-2">
                                        <SkeletonItem className="h-6 w-32" />
                                        <SkeletonItem className="h-4 w-40" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight truncate mb-2">{displayName || 'You'}</h2>
                                        
                                        {/* Rank Banner */}
                                        <div className={`w-full py-1 ${mode.toLowerCase() === 'ranked' ? 'bg-red-900/40 text-red-400 border-red-500/30' : mode.toLowerCase() === 'bot' ? 'bg-blue-900/40 text-blue-400 border-blue-500/30' : 'bg-purple-900/40 text-purple-400 border-purple-500/30'} border rounded flex items-center justify-center gap-2`}>
                                            <span className="font-bold text-xs uppercase tracking-wider">{profile?.rank_name || 'Bronze I'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Outer Glow (Dynamic) */}
                        <div className={`absolute -inset-4 rounded-xl -z-10 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${details.bg}`}></div>
                    </div>

                    {/* CENTER: VS / STATUS */}
                    <div className="flex flex-col items-center justify-center w-32 lg:w-48 shrink-0 relative z-50">
                        {matchFound ? (
                            // MATCH FOUND STATE - PREMIUM COUNTDOWN
                            <div className="flex flex-col items-center relative scale-110 lg:scale-125">
                                {/* Ambient Background Glow */}
                                <div className={`absolute inset-0 -z-10 blur-[80px] rounded-full opacity-30 animate-pulse ${
                                    mode.toLowerCase() === 'ranked' ? 'bg-red-500' : 
                                    mode.toLowerCase() === 'bot' ? 'bg-blue-500' : 'bg-purple-500'
                                }`}></div>
                                
                                {/* VS LABEL */}
                                <div className="relative mb-4">
                                    <div className="text-7xl lg:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        VS
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${details.color} opacity-80`}>Match Starting</span>
                                    </div>
                                </div>

                                {/* COUNTDOWN RING & PLATE */}
                                <div className="relative flex items-center justify-center w-36 h-36">
                                     {/* Tech Ring Background */}
                                     <div className="absolute inset-0 rounded-full border border-white/5 bg-white/5 backdrop-blur-md"></div>
                                     
                                     {/* Progress Ring */}
                                     <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                                         <circle 
                                            cx="72" cy="72" r="66" 
                                            className="stroke-white/5 fill-none" 
                                            strokeWidth="2" 
                                        />
                                         <circle 
                                            cx="72" cy="72" r="66" 
                                            className={`fill-none transition-all duration-1000 ease-linear ${
                                                mode.toLowerCase() === 'ranked' ? 'stroke-red-500' : 
                                                mode.toLowerCase() === 'bot' ? 'stroke-blue-500' : 'stroke-purple-500'
                                            }`} 
                                            strokeWidth="4" 
                                            strokeDasharray="414.69"
                                            strokeDashoffset={414.69 - (414.69 * (matchCountdown || 0) / 3)}
                                            strokeLinecap="round"
                                        />
                                     </svg>

                                     {/* The Number */}
                                     <div key={matchCountdown} className="text-6xl font-black text-white tabular-nums italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-in zoom-in-150 fade-in duration-300">
                                        {matchCountdown !== null ? matchCountdown : '0'}
                                    </div>

                                    {/* Scanning Ornament (Slow rotate) */}
                                    <div className={`absolute inset-[-10px] border-t-2 border-l-2 rounded-full opacity-20 animate-[spin_4s_linear_infinite] ${
                                        mode.toLowerCase() === 'ranked' ? 'border-red-500' : 
                                        mode.toLowerCase() === 'bot' ? 'border-blue-500' : 'border-purple-500'
                                    }`}></div>
                                </div>
                            </div>
                        ) : searching || (roomId && mode !== 'custom') ? (
                            // SEARCHING STATE - PREMIUM RADAR
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                {/* Pulse Effect */}
                                <div className={`absolute inset-0 border-2 ${details.border} rounded-full animate-[ping_4s_linear_infinite] opacity-20`}></div>
                                <div className={`absolute inset-4 border ${details.border} rounded-full animate-[ping_4s_linear_infinite_1s] opacity-10`}></div>
                                
                                {/* Rotating Radar Line */}
                                <div className={`absolute inset-0 rounded-full border border-white/5 bg-gradient-to-tr from-transparent via-transparent to-white/10 animate-[spin_3s_linear_infinite]`}></div>
                                
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <Loader2 size={40} className={`${details.color.replace('-400', '-500')} animate-[spin_2s_linear_infinite] opacity-80`} />
                                        <div className={`absolute inset-0 blur-md ${details.color.replace('text-', 'bg-')} opacity-20 animate-pulse`}></div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className={`px-4 py-1 bg-black/60 backdrop-blur-md border ${details.border} rounded-full text-sm font-mono ${details.color} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mt-2 animate-pulse">Scanning...</span>
                                    </div>
                                </div>

                                {/* Tech Corner Ornaments */}
                                <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${details.border} opacity-40`}></div>
                                <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${details.border} opacity-40`}></div>
                                <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${details.border} opacity-40`}></div>
                                <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${details.border} opacity-40`}></div>
                            </div>
                        ) : (
                            // IDLE STATE
                            <div className="flex flex-col items-center opacity-30 scale-75">
                                <Swords size={64} className="text-white mb-2" />
                            </div>
                        )}
                    </div>

                    {/* RIGHT: OPPONENT (BANNER STYLE) */}
                    <div className="relative group w-64 h-[28rem] shrink-0 transition-transform duration-500 hover:scale-[1.02]">
                         {matchFound && opponent ? (
                            // REAL OPPONENT BANNER
                            <div className={`absolute inset-0 border-y-[6px] ${mode.toLowerCase() === 'ranked' ? 'border-red-600' : mode.toLowerCase() === 'bot' ? 'border-blue-600' : 'border-purple-600'} bg-neutral-900/50 backdrop-blur-sm overflow-hidden flex flex-col animate-in slide-in-from-right-12 duration-500`}>
                                {/* Inner Accent Lines */}
                                <div className="absolute top-2 left-2 right-2 h-[1px] bg-white/20 z-20"></div>
                                <div className="absolute bottom-2 left-2 right-2 h-[1px] bg-white/20 z-20"></div>

                                {/* Avatar */}
                                <div className="absolute inset-x-0 top-0 bottom-24 bg-neutral-800 overflow-hidden">
                                     <img 
                                        src={opponent.avatar_url || '/default-avatar.png'} 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                        alt="Opponent"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
                                    
                                    {/* Ready Banner */}
                                    {opponentPlayer?.is_ready && (
                                         <div className="absolute top-8 -left-8 w-40 bg-green-500 text-black font-black text-xs py-1 text-center -rotate-45 shadow-lg border-y-2 border-white/20 z-20">
                                             READY
                                         </div>
                                    )}
                                </div>

                                {/* Bottom Info Plate */}
                                <div className="absolute bottom-0 inset-x-0 h-24 bg-neutral-900/90 flex flex-col justify-center px-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-xs font-bold text-neutral-500 uppercase tracking-widest ml-auto`}>Opponent</div>
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight truncate mb-2 text-right">{opponent?.display_name}</h2>
                                    
                                     {/* Rank Banner */}
                                    <div className={`w-full py-1 ${mode.toLowerCase() === 'ranked' ? 'bg-red-900/40 text-red-400 border-red-500/30' : mode.toLowerCase() === 'bot' ? 'bg-blue-900/40 text-blue-400 border-blue-500/30' : 'bg-purple-900/40 text-purple-400 border-purple-500/30'} border rounded flex items-center justify-center gap-2`}>
                                         <span className="font-bold text-xs uppercase tracking-wider">{opponent?.rank || 'Bronze I'}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // PLACEHOLDER / SEARCHING BANNER
                            <div className={`absolute inset-0 border-y-[6px] border-neutral-800 bg-neutral-900/30 backdrop-blur-sm overflow-hidden flex flex-col items-center justify-center transition-all duration-500 ${searching ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="w-full h-full flex flex-col items-center justify-center relative">
                                    {searching && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-50 animate-pulse"></div>
                                    )}
                                    <div className="text-9xl font-black text-white/5 select-none">?</div>
                                    <div className="absolute bottom-24 text-sm font-bold text-neutral-600 uppercase tracking-widest bg-neutral-900/80 px-4 py-1 rounded-full border border-white/5">
                                        {searching ? 'SEARCHING...' : 'WAITING'}
                                    </div>
                                </div>
                                
                                {/* Custom Room Invite Button (Overlay) */}
                                {roomId && mode === 'custom' && !opponent && (
                                    <div className="absolute inset-0 flex items-center justify-center z-30">
                                         <button 
                                            onClick={() => setShowInviteModal(true)}
                                            className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center hover:border-white hover:bg-neutral-700 hover:scale-110 transition-all group"
                                         >
                                             <Plus size={32} className="text-gray-400 group-hover:text-white" />
                                         </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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

            {/* Bottom Bar: Action Buttons ONLY (Centered) */}
            <div className="border-t border-white/5 pt-8 pb-8 mt-auto shrink-0 flex items-center justify-center w-full relative z-20 bg-gradient-to-t from-black/50 to-transparent">
                 {/* Action Buttons Container - CENTERED */}
                 <div className="relative z-20 flex flex-col items-center gap-4 w-full max-w-md">
                        {/* Status Text - Fixed Height to prevent jump */}
                         <div className="text-center h-12 flex flex-col justify-end">
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
                                 <div className="text-sm font-black uppercase tracking-[0.2em] mb-1 text-gray-400">
                                     {searching ? 'Đang tìm đối thủ...' : 'Sẵn sàng'}
                                 </div>
                             )}
                            
                         </div>

                        {/* --- BUTTONS LOGIC - Fixed Container Height --- */}
                        <div className="w-full h-24 flex items-center justify-center">
                            {roomId && mode === 'custom' ? (
                                // CUSTOM ROOM BUTTONS
                                <div className="w-full space-y-4">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleCancelSearch}
                                            className="flex-1 py-4 rounded-2xl bg-red-950/30 hover:bg-red-900/50 text-red-500 font-bold uppercase tracking-wider transition-all border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] active:scale-95 backdrop-blur-md group text-sm"
                                        >
                                            <span className="group-hover:animate-pulse">Rời phòng</span>
                                        </button>

                                        {isHost ? (
                                            <button 
                                                onClick={handleStartGame}
                                                disabled={isStarting || participants.length < 2 || participants.some(p => !p.is_host && !p.is_ready)}
                                                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
                                            >
                                                {isStarting ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <Play size={20} fill="currentColor" />
                                                )}
                                                {isStarting ? 'Chuẩn bị...' : 'Bắt đầu'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleToggleReady}
                                                className={`flex-[2] py-4 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm ${
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
                                    <div className="w-full py-5 rounded-2xl bg-green-600/20 border border-green-500/30 flex flex-col items-center justify-center animate-pulse backdrop-blur-md">
                                        <div className="text-green-500 font-black uppercase tracking-wider text-xs mb-1">
                                            Game starting in
                                        </div>
                                        <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                            {matchCountdown !== null ? `${matchCountdown}s` : '...'}
                                        </div>
                                    </div>
                                ) : searching ? (
                                    <div className="flex flex-col w-full gap-2 animate-in fade-in slide-in-from-bottom-4">
                                        <button 
                                            onClick={handleCancelSearch}
                                            className="w-full py-6 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black uppercase tracking-[0.2em] border border-red-500/30 hover:border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)] active:scale-95 transition-all text-xl group relative overflow-hidden backdrop-blur-md"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                <X size={24} /> HUỶ TÌM TRẬN
                                            </span>
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleFindMatch}
                                        className={`w-full py-6 bg-gradient-to-r ${
                                            mode.toLowerCase() === 'bot' 
                                            ? 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(37,99,235,0.7)]'
                                            : mode.toLowerCase() === 'ranked'
                                                ? 'from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(220,38,38,0.7)]'
                                                : 'from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(168,85,247,0.7)]'
                                        } text-white font-black uppercase tracking-[0.25em] hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-xl group relative overflow-hidden`}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            <Swords size={28} className="group-hover:rotate-12 transition-transform duration-500" />
                                            <span>TÌM TRẬN</span>
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-200%] group-hover:animate-shine"></div>
                                    </button>
                                )
                            )}
                        </div>
                 </div>
            </div>
            
            {/* Top Glow RESTORED - Dynamic per Mode */}
            <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-50 z-0 transition-colors duration-1000 ${
                mode.toLowerCase() === 'bot' 
                ? 'bg-blue-600/30 animate-pulse' 
                : mode.toLowerCase() === 'ranked'
                    ? 'bg-red-600/20'
                    : 'bg-purple-600/20'
            }`}></div>
        </div>
    );
};

export default ArenaLobbyView;
