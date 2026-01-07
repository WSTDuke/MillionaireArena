-- Fix RLS for public profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Fix RLS for game history
-- Previously it was "Users can view their own history" with USING (auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can view their own history" ON public.game_history;
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.game_history;

CREATE POLICY "Matches are viewable by everyone" ON public.game_history
  FOR SELECT USING (true);

-- Ensure the email column is searchable if the previous migration was run
-- If you haven't run 20260110_sync_profile_emails.sql yet, do it now!
