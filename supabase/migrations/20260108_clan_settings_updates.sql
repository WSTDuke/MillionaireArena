-- Migration: Add gold column and update_clan_settings RPC

-- Add gold column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 1000;

-- RPC to update clan settings and deduct gold
CREATE OR REPLACE FUNCTION update_clan_settings(
    p_clan_id UUID,
    p_user_id UUID,
    p_name TEXT,
    p_tag TEXT,
    p_description TEXT,
    p_icon TEXT,
    p_color TEXT,
    p_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_gold INTEGER;
    v_is_leader BOOLEAN;
BEGIN
    -- 1. Check if user is leader of the clan
    SELECT (role = 'leader') INTO v_is_leader
    FROM public.clan_members
    WHERE clan_id = p_clan_id AND user_id = p_user_id;

    IF NOT v_is_leader OR v_is_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Chỉ trưởng nhóm mới có quyền thay đổi cài đặt clan.');
    END IF;

    -- 2. Check gold balance
    SELECT gold INTO v_current_gold
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_current_gold < p_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bạn không đủ vàng để thực hiện thay đổi này.');
    END IF;

    -- 3. Check if new name or tag is already taken by ANOTHER clan
    IF EXISTS (SELECT 1 FROM public.clans WHERE name = p_name AND id != p_clan_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tên Clan này đã được sử dụng.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.clans WHERE tag = p_tag AND id != p_clan_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tag Clan này đã được sử dụng.');
    END IF;

    -- 4. Update clan info
    UPDATE public.clans
    SET 
        name = p_name,
        tag = p_tag,
        description = p_description,
        icon = p_icon,
        color = p_color
    WHERE id = p_clan_id;

    -- 5. Deduct gold
    UPDATE public.profiles
    SET gold = gold - p_cost
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Cập nhật Clan thành công!');
END;
$$;
