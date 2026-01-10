-- Migration: Automatic member count management
-- This trigger ensures that clans.members_count always reflects the number of 'approved' members.

-- 1. Create the function to update member count
CREATE OR REPLACE FUNCTION public.sync_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status = 'approved') THEN
            UPDATE public.clans
            SET members_count = (
                SELECT count(*)
                FROM public.clan_members
                WHERE clan_id = NEW.clan_id AND status = 'approved'
            )
            WHERE id = NEW.clan_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If status changed or clan changed (though clan shouldn't change normally)
        IF (OLD.status <> NEW.status OR OLD.clan_id <> NEW.clan_id) THEN
            -- Update old clan if changed
            IF (OLD.clan_id <> NEW.clan_id) THEN
                UPDATE public.clans
                SET members_count = (
                    SELECT count(*)
                    FROM public.clan_members
                    WHERE clan_id = OLD.clan_id AND status = 'approved'
                )
                WHERE id = OLD.clan_id;
            END IF;
            
            -- Update current/new clan
            UPDATE public.clans
            SET members_count = (
                SELECT count(*)
                FROM public.clan_members
                WHERE clan_id = NEW.clan_id AND status = 'approved'
            )
            WHERE id = NEW.clan_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'approved') THEN
            UPDATE public.clans
            SET members_count = (
                SELECT count(*)
                FROM public.clan_members
                WHERE clan_id = OLD.clan_id AND status = 'approved'
            )
            WHERE id = OLD.clan_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_clan_member_change ON public.clan_members;
CREATE TRIGGER on_clan_member_change
AFTER INSERT OR UPDATE OR DELETE ON public.clan_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_clan_member_count();

-- 3. Backfill existing counts
UPDATE public.clans c
SET members_count = (
    SELECT count(*)
    FROM public.clan_members cm
    WHERE cm.clan_id = c.id AND cm.status = 'approved'
);
