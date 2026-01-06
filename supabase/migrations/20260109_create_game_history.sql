-- Create game_history table
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    opponent_id UUID REFERENCES public.profiles(id),
    room_id UUID, -- No FK to rooms as rooms are deleted
    result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
    score_user INT DEFAULT 0,
    score_opponent INT DEFAULT 0,
    mode TEXT DEFAULT 'Normal',
    mmr_change INT DEFAULT 0,
    played_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own history" 
ON public.game_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" 
ON public.game_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);
