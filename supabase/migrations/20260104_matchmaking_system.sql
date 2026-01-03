-- Create Matchmaking Table
CREATE TABLE IF NOT EXISTS public.matchmaking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    participant_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.matchmaking ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can see their own matchmaking entry" ON public.matchmaking;
CREATE POLICY "Users can see their own matchmaking entry" ON public.matchmaking
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own matchmaking entry" ON public.matchmaking;
CREATE POLICY "Users can insert their own matchmaking entry" ON public.matchmaking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own matchmaking entry" ON public.matchmaking;
CREATE POLICY "Users can update their own matchmaking entry" ON public.matchmaking
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own matchmaking entry" ON public.matchmaking;
CREATE POLICY "Users can delete their own matchmaking entry" ON public.matchmaking
    FOR DELETE USING (auth.uid() = user_id);

-- Function to find or create match
CREATE OR REPLACE FUNCTION public.find_or_create_match(
    p_user_id UUID,
    p_mode TEXT,
    p_participant_data JSONB
) RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
    v_opponent_id UUID;
    v_opponent_data JSONB;
BEGIN
    -- 1. Try to find an existing player in the same mode
    SELECT user_id, participant_data INTO v_opponent_id, v_opponent_data
    FROM public.matchmaking
    WHERE mode = p_mode AND room_id IS NULL AND user_id != p_user_id
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_opponent_id IS NOT NULL THEN
        -- 2. Found an opponent! Create a new room.
        INSERT INTO public.rooms (
            host_id,
            mode,
            status,
            name,
            settings,
            participants,
            current_players
        ) VALUES (
            v_opponent_id, -- Original researcher as host
            p_mode,
            'waiting',
            p_mode, -- Use pure mode name (Normal, Ranked, Blitzmatch)
            jsonb_build_object(
                'format', CASE WHEN p_mode = 'Ranked' THEN 'Bo5' ELSE 'Bo3' END,
                'questions_per_round', CASE WHEN p_mode = 'Blitzmatch' THEN 5 ELSE 10 END
            ),
            jsonb_build_array(v_opponent_data, p_participant_data),
            2
        ) RETURNING id INTO v_room_id;

        -- 3. Update both entries in matchmaking to point to the room
        -- Update opponent
        UPDATE public.matchmaking SET room_id = v_room_id WHERE user_id = v_opponent_id;
        
        -- 4. Delete self if exists (or we'll handle in frontend)
        RETURN v_room_id;
    ELSE
        -- 5. No opponent found, add self to queue if not already there
        INSERT INTO public.matchmaking (user_id, mode, participant_data)
        VALUES (p_user_id, p_mode, p_participant_data)
        ON CONFLICT (user_id) DO UPDATE 
        SET mode = p_mode, participant_data = p_participant_data, room_id = NULL, created_at = now();
        
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'matchmaking'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking;
    END IF;
END $$;
