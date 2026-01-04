-- Create Clans Table
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    members_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Clan Members Table
CREATE TABLE IF NOT EXISTS public.clan_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

-- Clans Policies
DROP POLICY IF EXISTS "Clans are viewable by everyone" ON public.clans;
CREATE POLICY "Clans are viewable by everyone" ON public.clans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create a clan" ON public.clans;
CREATE POLICY "Authenticated users can create a clan" ON public.clans
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Clan Members Policies
DROP POLICY IF EXISTS "Clan members are viewable by everyone" ON public.clan_members;
CREATE POLICY "Clan members are viewable by everyone" ON public.clan_members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join a clan" ON public.clan_members;
CREATE POLICY "Users can join a clan" ON public.clan_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave their clan" ON public.clan_members;
CREATE POLICY "Users can leave their clan" ON public.clan_members
    FOR DELETE USING (auth.uid() = user_id);

-- RPC Functions to manage membership counts
CREATE OR REPLACE FUNCTION public.increment_clan_members(clan_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.clans
    SET members_count = members_count + 1
    WHERE id = clan_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_clan_members(clan_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.clans
    SET members_count = GREATEST(0, members_count - 1)
    WHERE id = clan_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'clans'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE clans;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'clan_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE clan_members;
    END IF;
END $$;
