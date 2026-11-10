-- OrPath roles and dashboard access.
-- Apply once in Supabase SQL Editor after the initial user-data migration.

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

-- Admin checks run with the function owner's privileges to avoid RLS recursion.
create or replace function public.is_orpath_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_orpath_admin() from public;
grant execute on function public.is_orpath_admin() to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users and admins can read profiles"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id or (select public.is_orpath_admin()));

-- Restrict profile writes to non-privileged columns. Admin assignment is done
-- by the project owner in the Supabase SQL Editor, never by the browser client.
revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name, avatar_url) on public.profiles to authenticated;
grant update (display_name, avatar_url, updated_at) on public.profiles to authenticated;

-- Platform-wide aggregate metrics are exposed only through this admin-checked RPC.
create or replace function public.orpath_admin_dashboard_stats()
returns table (
  total_users bigint,
  total_saved_verses bigint,
  total_prayer_entries bigint,
  total_reading_plans bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_orpath_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select
      (select count(*) from public.profiles),
      (select count(*) from public.saved_verses),
      (select count(*) from public.prayer_entries),
      (select count(*) from public.user_reading_plans);
end;
$$;

revoke all on function public.orpath_admin_dashboard_stats() from public;
grant execute on function public.orpath_admin_dashboard_stats() to authenticated;
