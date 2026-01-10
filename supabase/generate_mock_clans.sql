-- Mock Data Generation: 8 Clans, 5 Members each, all registered for Tournament
-- Target Tournament ID: community-weekly-cup-42

-- 0. Ensure Schema Exists (Safety)
CREATE TABLE IF NOT EXISTS public.tournaments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    entry_fee INTEGER DEFAULT 0,
    max_participants INTEGER DEFAULT 16,
    status TEXT DEFAULT 'Upcoming',
    image_url TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tournament_id, clan_id)
);

DO $$
DECLARE
    v_tournament_id TEXT := 'community-weekly-cup-42';
    v_clan_id UUID;
    v_leader_id UUID;
    v_member_id UUID;
    v_clan_names TEXT[] := ARRAY['Dragon Slayers', 'Shadow Ninjas', 'Cyber Phantoms', 'Midnight Wolves', 'Neon Specters', 'Iron Titans', 'Frost Giants', 'Storm Chasers'];
    v_clan_tags TEXT[] := ARRAY['DRG', 'SHD', 'CYB', 'MDN', 'NEO', 'IRN', 'FRT', 'STM'];
    v_clan_icons TEXT[] := ARRAY['Shield', 'Swords', 'Trophy', 'Target', 'Award', 'Shield', 'Swords', 'Trophy'];
    v_clan_colors TEXT[] := ARRAY['#d946ef', '#3b82f6', '#06b6d4', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#f43f5e'];
    v_has_payment_col BOOLEAN;
    i INTEGER;
    j INTEGER;
BEGIN
    -- 1. Ensure Tournament Exists
    INSERT INTO public.tournaments (id, title, description, entry_fee, max_participants, status, image_url)
    VALUES (v_tournament_id, 'Community Weekly Cup #42', 'Giải đấu thường niên dành cho cộng đồng MillionMind.', 500, 16, 'Đang diễn ra', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')
    ON CONFLICT (id) DO UPDATE SET status = 'Đang diễn ra';

    FOR i IN 1..8 LOOP
        -- 1. Create/Get Leader Auth User
        v_leader_id := NULL;
        SELECT id INTO v_leader_id FROM auth.users WHERE email = 'leader-' || i || '@mock.com' LIMIT 1;
        
        IF v_leader_id IS NULL THEN
            v_leader_id := gen_random_uuid();
            INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
            VALUES (
                v_leader_id, 
                '00000000-0000-0000-0000-000000000000', 
                'leader-' || i || '@mock.com', 
                '$2a$10$abcdefghijklmnopqrstuv', 
                now(), 
                '{"provider":"email","providers":["email"]}', 
                '{}', 
                now(), 
                now(), 
                'authenticated', 
                'authenticated'
            );
        END IF;

        -- 2. Create/Update Leader Profile
        INSERT INTO public.profiles (id, display_name, avatar_url, mmr, balance)
        VALUES (v_leader_id, v_clan_names[i] || ' Leader', 'https://api.dicebear.com/7.x/avataaars/svg?seed=leader' || i, 1500 + (i * 100), 10000)
        ON CONFLICT (id) DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            mmr = EXCLUDED.mmr,
            balance = EXCLUDED.balance;

        -- 3. Create/Update Clan
        INSERT INTO public.clans (name, tag, description, icon, color, creator_id, members_count)
        VALUES (v_clan_names[i], v_clan_tags[i], 'Hội quy tụ các cao thủ ' || v_clan_names[i] || '.', v_clan_icons[i], v_clan_colors[i], v_leader_id, 5)
        ON CONFLICT (name) DO UPDATE SET
            tag = EXCLUDED.tag,
            description = EXCLUDED.description,
            icon = EXCLUDED.icon,
            color = EXCLUDED.color,
            members_count = 5
        RETURNING id INTO v_clan_id;

        -- 4. Add Leader as Member
        INSERT INTO public.clan_members (clan_id, user_id, role, status)
        VALUES (v_clan_id, v_leader_id, 'leader', 'approved')
        ON CONFLICT (user_id) WHERE (status = 'approved') DO UPDATE SET
            clan_id = EXCLUDED.clan_id,
            role = EXCLUDED.role;

        -- 5. Create 4 more members
        FOR j IN 1..4 LOOP
            v_member_id := NULL;
            SELECT id INTO v_member_id FROM auth.users WHERE email = 'member-' || i || '-' || j || '@mock.com' LIMIT 1;

            IF v_member_id IS NULL THEN
                v_member_id := gen_random_uuid();
                INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
                VALUES (
                    v_member_id, 
                    '00000000-0000-0000-0000-000000000000', 
                    'member-' || i || '-' || j || '@mock.com', 
                    '$2a$10$abcdefghijklmnopqrstuv', 
                    now(), 
                    '{"provider":"email","providers":["email"]}', 
                    '{}', 
                    now(), 
                    now(), 
                    'authenticated', 
                    'authenticated'
                );
            END IF;

            INSERT INTO public.profiles (id, display_name, avatar_url, mmr, balance)
            VALUES (v_member_id, v_clan_names[i] || ' Member ' || j, 'https://api.dicebear.com/7.x/avataaars/svg?seed=member' || i || j, 1000 + (j * 50), 5000)
            ON CONFLICT (id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                avatar_url = EXCLUDED.avatar_url,
                mmr = EXCLUDED.mmr,
                balance = EXCLUDED.balance;

            INSERT INTO public.clan_members (clan_id, user_id, role, status)
            VALUES (v_clan_id, v_member_id, 'member', 'approved')
            ON CONFLICT (user_id) WHERE (status = 'approved') DO UPDATE SET
                clan_id = EXCLUDED.clan_id,
                role = EXCLUDED.role;
        END LOOP;

        -- 6. Register Clan for Tournament
        BEGIN
            IF v_has_payment_col IS NULL THEN
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tournament_registrations' AND column_name = 'payment_status'
                ) INTO v_has_payment_col;
            END IF;

            IF v_has_payment_col THEN
                EXECUTE '
                    INSERT INTO public.tournament_registrations (tournament_id, clan_id, status, payment_status)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (tournament_id, clan_id) DO UPDATE SET status = $3, payment_status = $4' 
                USING v_tournament_id, v_clan_id, 'approved', 'paid';
            ELSE
                EXECUTE '
                    INSERT INTO public.tournament_registrations (tournament_id, clan_id, status)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (tournament_id, clan_id) DO UPDATE SET status = $3' 
                USING v_tournament_id, v_clan_id, 'approved';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to register clan %: %', v_clan_names[i], SQLERRM;
        END;
    END LOOP;
END $$;
