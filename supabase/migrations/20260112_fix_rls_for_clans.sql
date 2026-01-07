-- Allow public viewing of clan members for detail pages
DROP POLICY IF EXISTS "Clan members are viewable by everyone" ON public.clan_members;
CREATE POLICY "Clan members are viewable by everyone" ON public.clan_members
  FOR SELECT USING (true);

-- Allow public viewing of clans
DROP POLICY IF EXISTS "Clans are viewable by everyone" ON public.clans;
CREATE POLICY "Clans are viewable by everyone" ON public.clans
  FOR SELECT USING (true);
