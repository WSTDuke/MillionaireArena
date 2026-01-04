-- transfer_clan_leadership.sql
create or replace function transfer_clan_leadership(
  p_clan_id uuid,
  old_leader_id uuid,
  new_leader_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the old leader is actually the leader
  if not exists (
    select 1
    from clan_members
    where clan_id = p_clan_id
      and user_id = old_leader_id
      and role = 'leader'
  ) then
    raise exception 'You are not the leader of this clan.';
  end if;

  -- Demote the old leader to 'member'
  update clan_members
  set role = 'member'
  where clan_id = p_clan_id
    and user_id = old_leader_id;

  -- Promote the new member to 'leader'
  update clan_members
  set role = 'leader'
  where clan_id = p_clan_id
    and user_id = new_leader_id;
end;
$$;
