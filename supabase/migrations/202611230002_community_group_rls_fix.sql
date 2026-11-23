-- Remove recursive membership policies and support private-group join requests safely.
create or replace function public.community_is_group_member(target_group uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_group_members m
    where m.group_id = target_group and m.user_id = target_user
  );
$$;

create or replace function public.community_is_group_owner(target_group uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_groups g
    where g.id = target_group and g.created_by = target_user
  );
$$;

drop policy if exists "Members discover public and joined groups" on public.community_groups;
create policy "Members discover public and joined groups" on public.community_groups
  for select to authenticated using (
    visibility = 'public'
    or created_by = (select auth.uid())
    or public.community_is_group_member(id, (select auth.uid()))
  );

drop policy if exists "Members view their own group memberships" on public.community_group_members;
create policy "Members view their own group memberships" on public.community_group_members
  for select to authenticated using (
    user_id = (select auth.uid())
    or public.community_is_group_owner(group_id, (select auth.uid()))
    or public.community_is_group_member(group_id, (select auth.uid()))
  );

drop policy if exists "Members request or join groups" on public.community_group_members;
create policy "Members request or join groups" on public.community_group_members
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and (
      (status = 'active' and exists (select 1 from public.community_groups g where g.id = group_id and g.visibility = 'public'))
      or (status = 'pending' and exists (select 1 from public.community_groups g where g.id = group_id and g.visibility = 'private'))
      or public.community_is_group_owner(group_id, (select auth.uid()))
    )
  );

drop policy if exists "Group owners approve pending members" on public.community_group_members;
create policy "Group owners approve pending members" on public.community_group_members
  for update to authenticated using (
    public.community_is_group_owner(group_id, (select auth.uid()))
  ) with check (
    public.community_is_group_owner(group_id, (select auth.uid()))
  );

drop policy if exists "Members leave groups or owners remove members" on public.community_group_members;
create policy "Members leave groups or owners remove members" on public.community_group_members
  for delete to authenticated using (
    user_id = (select auth.uid())
    or public.community_is_group_owner(group_id, (select auth.uid()))
  );

grant execute on function public.community_is_group_member(uuid, uuid) to authenticated;
grant execute on function public.community_is_group_owner(uuid, uuid) to authenticated;
