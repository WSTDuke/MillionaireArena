import { supabase } from './supabase';

export interface Participant {
    id: string;
    display_name: string;
    avatar_url: string;
    is_ready: boolean;
    is_host: boolean;
    rank?: string;
}

/**
 * Handle logic when a player leaves a room.
 * Uses a Postgres RPC to ensure atomicity and prevent race conditions.
 */
export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    if (!roomId || !userId) return;

    try {
        const { error } = await supabase.rpc('leave_room', {
            p_room_id: roomId,
            p_user_id: userId
        });

        if (error) {
            console.error("RPC leave_room failed:", error);
        }
    } catch (err) {
        console.error("Unexpected error in leaveRoom:", err);
    }
};
