-- Atomic function to handle leaving a room
-- This prevents race conditions when multiple players leave simultaneously
CREATE OR REPLACE FUNCTION leave_room(p_room_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_participants JSONB;
    v_host_id UUID;
BEGIN
    -- Get current room state and lock the row to prevent concurrent modifications
    SELECT participants, host_id INTO v_participants, v_host_id
    FROM rooms
    WHERE id = p_room_id
    FOR UPDATE;

    -- If room not found, just return
    IF v_participants IS NULL THEN
        RETURN;
    END IF;

    -- Create new participants list excluding the leaving user
    v_participants := (
        SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
        FROM jsonb_array_elements(v_participants) AS p
        WHERE (p->>'id')::UUID != p_user_id
    );

    -- Check if room is now empty
    IF jsonb_array_length(v_participants) = 0 THEN
        DELETE FROM rooms WHERE id = p_room_id;
    ELSE
        -- If the leaving user was the host, assign a new host
        IF v_host_id = p_user_id THEN
            -- First remaining participant becomes host
            v_host_id := (v_participants->0->>'id')::UUID;
            v_participants := jsonb_set(
                v_participants,
                '{0, is_host}',
                'true'
            );
        END IF;

        UPDATE rooms
        SET 
            participants = v_participants,
            current_players = jsonb_array_length(v_participants),
            host_id = v_host_id
        WHERE id = p_room_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
