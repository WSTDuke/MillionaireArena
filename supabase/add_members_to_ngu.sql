-- Add 4 members to Clan [NGU] Never Give Up
DO $$
DECLARE
    v_clan_id UUID;
    v_member_id UUID;
    v_count INTEGER;
    i INTEGER;
BEGIN
    -- 1. Get Clan ID (Case-insensitive)
    SELECT id INTO v_clan_id 
    FROM public.clans 
    WHERE tag ILIKE 'NGU' OR name ILIKE 'Never Give Up' 
    LIMIT 1;
    
    IF v_clan_id IS NULL THEN
        RAISE EXCEPTION 'KHÔNG TÌM THẤY CLAN: Hãy kiểm tra xem Clan [NGU] đã được tạo chưa.';
    END IF;

    -- 2. Add 4 members
    FOR i IN 1..4 LOOP
        -- Check if auth user exists
        v_member_id := NULL;
        SELECT id INTO v_member_id FROM auth.users WHERE email = 'ngu-member-' || i || '@mock.com' LIMIT 1;

        IF v_member_id IS NULL THEN
            v_member_id := gen_random_uuid();
            INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
            VALUES (
                v_member_id, 
                '00000000-0000-0000-0000-000000000000', 
                'ngu-member-' || i || '@mock.com', 
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

        -- Create/Update Profile
        INSERT INTO public.profiles (id, display_name, avatar_url, mmr, balance)
        VALUES (v_member_id, 'NGU Warrior ' || i, 'https://api.dicebear.com/7.x/avataaars/svg?seed=ngu' || i, 1200 + (i * 10), 5000)
        ON CONFLICT (id) DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url;

        -- Add to Clan (Ensure status is approved)
        INSERT INTO public.clan_members (clan_id, user_id, role, status)
        VALUES (v_clan_id, v_member_id, 'member', 'approved')
        ON CONFLICT (user_id) WHERE (status = 'approved') DO UPDATE SET
            clan_id = EXCLUDED.clan_id,
            role = EXCLUDED.role;
    END LOOP;
    
    -- 3. Sync member count manually just in case trigger is slow or not present
    UPDATE public.clans
    SET members_count = (
        SELECT count(*)
        FROM public.clan_members
        WHERE clan_id = v_clan_id AND status = 'approved'
    )
    WHERE id = v_clan_id;

    SELECT members_count INTO v_count FROM public.clans WHERE id = v_clan_id;
    RAISE NOTICE 'Hoàn tất! Clan hiện có % thành viên.', v_count;
END $$;
