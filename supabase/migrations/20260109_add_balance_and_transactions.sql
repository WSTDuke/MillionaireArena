-- Add balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0;

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'clan_create', 'clan_update'
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Users can view their own transactions'
    ) THEN
        CREATE POLICY "Users can view their own transactions" ON public.transactions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Stored Procedure: Handle Transaction
CREATE OR REPLACE FUNCTION public.handle_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
    v_current_balance INTEGER;
BEGIN
    -- Lock the profile row for update
    SELECT balance INTO v_current_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    IF p_amount < 0 AND (v_current_balance + p_amount) < 0 THEN
        RAISE EXCEPTION 'Insufficient funds. Current balance: %, Required: %', v_current_balance, ABS(p_amount);
    END IF;

    -- Update balance
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- Insert transaction
    INSERT INTO public.transactions (user_id, amount, type, description, metadata)
    VALUES (p_user_id, p_amount, p_type, p_description, p_metadata);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create Clan with Payment
CREATE OR REPLACE FUNCTION public.create_clan_with_payment(
    p_name TEXT,
    p_tag TEXT,
    p_description TEXT,
    p_icon TEXT,
    p_color TEXT,
    p_cost INTEGER DEFAULT 1000
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_clan_id UUID;
    v_trx_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Deduct Money
    v_trx_result := public.handle_transaction(
        v_user_id, 
        -p_cost, 
        'clan_creation', 
        'Created clan ' || p_name
    );

    -- 2. Create Clan
    INSERT INTO public.clans (name, tag, description, icon, color, creator_id)
    VALUES (p_name, p_tag, p_description, p_icon, p_color, v_user_id)
    RETURNING id INTO v_clan_id;

    -- 3. Add creator as leader
    INSERT INTO public.clan_members (clan_id, user_id, role)
    VALUES (v_clan_id, v_user_id, 'leader');
    
    RETURN jsonb_build_object('success', true, 'clan_id', v_clan_id, 'new_balance', v_trx_result->'new_balance');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update Clan with Payment
CREATE OR REPLACE FUNCTION public.update_clan_with_payment(
    p_clan_id UUID,
    p_name TEXT,
    p_tag TEXT,
    p_description TEXT,
    p_icon TEXT,
    p_color TEXT,
    p_cost INTEGER DEFAULT 500
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_is_leader BOOLEAN;
    v_trx_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if user is leader
    SELECT EXISTS (
        SELECT 1 FROM public.clan_members 
        WHERE clan_id = p_clan_id 
        AND user_id = v_user_id 
        AND role = 'leader'
    ) INTO v_is_leader;
    
    IF NOT v_is_leader THEN
        RAISE EXCEPTION 'Not authorized. Only the clan leader can update clan settings.';
    END IF;

    -- Deduct Money
    v_trx_result := public.handle_transaction(
        v_user_id, 
        -p_cost, 
        'clan_update', 
        'Updated clan ' || p_name
    );

    -- Update Clan
    UPDATE public.clans
    SET name = p_name,
        tag = p_tag,
        description = p_description,
        icon = p_icon,
        color = p_color
    WHERE id = p_clan_id;

    RETURN jsonb_build_object('success', true, 'new_balance', v_trx_result->'new_balance');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
