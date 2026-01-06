-- Add round_scores to game_history
ALTER TABLE public.game_history 
ADD COLUMN IF NOT EXISTS round_scores JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.game_history.round_scores IS 'Array of scores per round for the user, e.g., [4, 5, 9]';
