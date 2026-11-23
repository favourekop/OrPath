-- Secure invite links for private OrPath study groups.
create table if not exists public.community_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 days'),
  max_uses integer not null default 50 check (max_uses between 1 and 500),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists community_group_invites_group_idx on public.community_group_invites(group_id, created_at desc);
alter table public.community_group_invites enable row level security;

create policy "Group owners manage their invite links" on public.community_group_invites
  for all to authenticated
  using (public.community_is_group_owner(group_id, (select auth.uid())))
  with check (
    created_by = (select auth.uid())
    and public.community_is_group_owner(group_id, (select auth.uid()))
  );

create or replace function public.community_join_group_by_invite(invite_token uuid)
returns table(joined_group_id uuid, joined_group_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row public.community_group_invites%rowtype;
  group_row public.community_groups%rowtype;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sign in to join this group.';
  end if;

  select * into invite_row
  from public.community_group_invites i
  where i.id = invite_token
  for update;

  if not found or not invite_row.active or invite_row.expires_at <= now() or invite_row.uses >= invite_row.max_uses then
    raise exception 'This group invitation is invalid or has expired.';
  end if;

  select * into group_row from public.community_groups g where g.id = invite_row.group_id;
  if not found then
    raise exception 'This group is no longer available.';
  end if;

  insert into public.community_group_members (group_id, user_id, role, status)
  values (group_row.id, current_user_id, 'member', 'active')
  on conflict (group_id, user_id)
  do update set status = 'active';

  update public.community_group_invites
  set uses = uses + 1
  where id = invite_token;

  return query select group_row.id, group_row.name;
end;
$$;

grant execute on function public.community_join_group_by_invite(uuid) to authenticated;
grant select, insert, update, delete on public.community_group_invites to authenticated;
