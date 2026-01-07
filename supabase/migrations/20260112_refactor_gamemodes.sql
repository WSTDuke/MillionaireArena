-- Migration: Refactor Game Modes (Blitz -> Bot)
-- Author: Antigravity
-- Date: 2026-01-08

-- Update game_history table to reflect the mode name change
UPDATE public.game_history
SET mode = 'Bot'
WHERE mode = 'Blitz';

-- Optional: If you have an enum for modes, you would check/update it here.
-- Currently 'mode' seems to be a text column based on application logic.
