-- OrPath Community foundation: authenticated community, privacy-aware prayer wall and study groups.
-- Apply this migration in the Supabase SQL Editor before enabling the Community route.

create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'OrPath member',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 3000),
  post_type text not null default 'reflection' check (post_type in ('reflection','testimony','question','encouragement')),
  scripture_reference text,
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'amen' check (reaction in ('amen','love','pray')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.community_prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Prayer request',
  body text not null check (char_length(trim(body)) between 1 and 2000),
  visibility text not null default 'public' check (visibility in ('public','anonymous','private')),
  status text not null default 'active' check (status in ('active','answered','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 3 and 70),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin')),
  status text not null default 'active' check (status in ('pending','active')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','prayer','group','member')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists community_posts_created_idx on public.community_posts(status, created_at desc);
create index if not exists community_comments_post_idx on public.community_comments(post_id, created_at asc);
create index if not exists community_reactions_post_idx on public.community_reactions(post_id);
create index if not exists community_prayers_feed_idx on public.community_prayer_requests(status, visibility, created_at desc);
create index if not exists community_groups_visibility_idx on public.community_groups(visibility, created_at desc);
create index if not exists community_members_user_idx on public.community_group_members(user_id, status);

alter table public.community_profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_prayer_requests enable row level security;
alter table public.community_groups enable row level security;
alter table public.community_group_members enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_blocks enable row level security;

-- Community is available to every authenticated OrPath member.
create policy "Authenticated members can view community profiles" on public.community_profiles
  for select to authenticated using (true);
create policy "Members create their own community profile" on public.community_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members update their own community profile" on public.community_profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Members view published community posts" on public.community_posts
  for select to authenticated using (
    status = 'published'
    and not exists (select 1 from public.community_blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = author_id)
    and not exists (select 1 from public.community_blocks b where b.blocker_id = author_id and b.blocked_id = (select auth.uid()))
  );
create policy "Members create their own community posts" on public.community_posts
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Authors update their own community posts" on public.community_posts
  for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Authors delete their own community posts" on public.community_posts
  for delete to authenticated using ((select auth.uid()) = author_id);

create policy "Members read comments on visible posts" on public.community_comments
  for select to authenticated using (exists (
    select 1 from public.community_posts p where p.id = post_id and p.status = 'published'
  ));
create policy "Members comment as themselves" on public.community_comments
  for insert to authenticated with check (
    (select auth.uid()) = author_id
    and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
  );
create policy "Authors delete their own comments" on public.community_comments
  for delete to authenticated using ((select auth.uid()) = author_id);

create policy "Members read reactions on visible posts" on public.community_reactions
  for select to authenticated using (exists (
    select 1 from public.community_posts p where p.id = post_id and p.status = 'published'
  ));
create policy "Members react as themselves" on public.community_reactions
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
  );
create policy "Members remove their own reactions" on public.community_reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Public requests appear in the prayer wall. Anonymous requests appear without identity.
-- Private requests are visible only to their author.
create policy "Members view public prayer requests and their own" on public.community_prayer_requests
  for select to authenticated using (
    (visibility in ('public','anonymous') and status in ('active','answered'))
    or (select auth.uid()) = author_id
  );
create policy "Members create their own prayer requests" on public.community_prayer_requests
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Authors update their own prayer requests" on public.community_prayer_requests
  for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Authors delete their own prayer requests" on public.community_prayer_requests
  for delete to authenticated using ((select auth.uid()) = author_id);

-- Public groups are discoverable by every member. Private groups are visible only to
-- their creator, active members, or users with a pending join request.
create policy "Members discover public and joined groups" on public.community_groups
  for select to authenticated using (
    visibility = 'public'
    or created_by = (select auth.uid())
    or exists (
      select 1 from public.community_group_members m
      where m.group_id = id and m.user_id = (select auth.uid())
    )
  );
create policy "Members create groups" on public.community_groups
  for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "Group owners update their groups" on public.community_groups
  for update to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);
create policy "Group owners delete their groups" on public.community_groups
  for delete to authenticated using ((select auth.uid()) = created_by);

create policy "Members view their own group memberships" on public.community_group_members
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.community_groups g where g.id = group_id and g.created_by = (select auth.uid()))
    or exists (select 1 from public.community_group_members m where m.group_id = group_id and m.user_id = (select auth.uid()) and m.status = 'active')
  );
create policy "Members request or join groups" on public.community_group_members
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.community_groups g
      where g.id = group_id
      and (g.visibility = 'public' or g.created_by = (select auth.uid()))
      and (status = 'active' or status = 'pending')
    )
  );
create policy "Group owners approve pending members" on public.community_group_members
  for update to authenticated using (
    exists (select 1 from public.community_groups g where g.id = group_id and g.created_by = (select auth.uid()))
  ) with check (
    exists (select 1 from public.community_groups g where g.id = group_id and g.created_by = (select auth.uid()))
  );
create policy "Members leave groups or owners remove members" on public.community_group_members
  for delete to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.community_groups g where g.id = group_id and g.created_by = (select auth.uid()))
  );

create policy "Members submit community reports" on public.community_reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "Members view their own reports" on public.community_reports
  for select to authenticated using ((select auth.uid()) = reporter_id);

create policy "Members manage their own blocks" on public.community_blocks
  for all to authenticated using ((select auth.uid()) = blocker_id) with check ((select auth.uid()) = blocker_id);

-- New group creators are automatically owners/admins.
create or replace function public.community_add_group_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.community_group_members (group_id, user_id, role, status)
  values (new.id, new.created_by, 'admin', 'active')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists community_group_owner_membership on public.community_groups;
create trigger community_group_owner_membership
  after insert on public.community_groups
  for each row execute function public.community_add_group_owner();

grant select, insert, update on public.community_profiles to authenticated;
grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_comments to authenticated;
grant select, insert, delete on public.community_reactions to authenticated;
grant select, insert, update, delete on public.community_prayer_requests to authenticated;
grant select, insert, update, delete on public.community_groups to authenticated;
grant select, insert, update, delete on public.community_group_members to authenticated;
grant select, insert on public.community_reports to authenticated;
grant select, insert, delete on public.community_blocks to authenticated;
