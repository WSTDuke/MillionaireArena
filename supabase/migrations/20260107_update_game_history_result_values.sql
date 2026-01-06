-- Update game_history table to accept Vietnamese result values
-- Drop old constraint
ALTER TABLE public.game_history 
DROP CONSTRAINT IF EXISTS game_history_result_check;

-- Add new constraint with Vietnamese values
ALTER TABLE public.game_history 
ADD CONSTRAINT game_history_result_check 
CHECK (result IN ('Chiến thắng', 'Thất bại', 'Hòa'));

-- Update existing data from English to Vietnamese (if any exists)
UPDATE public.game_history 
SET result = CASE 
    WHEN result = 'win' THEN 'Chiến thắng'
    WHEN result = 'loss' THEN 'Thất bại'
    WHEN result = 'draw' THEN 'Hòa'
    ELSE result
END
WHERE result IN ('win', 'loss', 'draw');
