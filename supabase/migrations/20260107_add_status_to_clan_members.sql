-- Create a new ENUM type for member status
CREATE TYPE public.member_status AS ENUM ('pending', 'approved', 'rejected');

-- Add the 'status' column to the clan_members table with a default
ALTER TABLE public.clan_members ADD COLUMN status public.member_status NOT NULL DEFAULT 'approved';

-- Remove the old UNIQUE constraint on user_id
ALTER TABLE public.clan_members DROP CONSTRAINT IF EXISTS clan_members_user_id_key;

-- Create a partial unique index to ensure a user is an 'approved' member of only one clan
CREATE UNIQUE INDEX one_approved_clan_per_user_idx
ON public.clan_members (user_id)
WHERE (status = 'approved');

-- Update existing rows to have 'approved' status
UPDATE public.clan_members SET status = 'approved';

-- Modify policies to account for the new status
DROP POLICY IF EXISTS "Users can join a clan" ON public.clan_members;
CREATE POLICY "Users can request to join a clan" ON public.clan_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave their clan" ON public.clan_members;
CREATE POLICY "Users can leave their clan" ON public.clan_members
    FOR DELETE USING (auth.uid() = user_id AND status = 'approved');

-- Add a new policy for leaders to manage join requests
CREATE POLICY "Clan leaders can manage join requests" ON public.clan_members
    FOR UPDATE USING (
        (
            (status = 'pending' AND (SELECT role FROM clan_members WHERE clan_id = clan_members.clan_id AND user_id = auth.uid()) = 'leader')
        )
    )
    WITH CHECK (
        (
            (status = 'pending' AND (SELECT role FROM clan_members WHERE clan_id = clan_members.clan_id AND user_id = auth.uid()) = 'leader')
        )
    );

-- Add a new policy for users to cancel their own pending requests
CREATE POLICY "Users can cancel their join request" ON public.clan_members
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');
