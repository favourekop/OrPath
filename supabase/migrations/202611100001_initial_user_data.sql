-- OrPath private user data foundation.
-- Run this migration in the Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bible_id text,
  verse_id text not null,
  reference text not null,
  verse_text text,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, bible_id, verse_id)
);

create table if not exists public.prayer_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  is_answered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bible_id text not null,
  book_id text not null,
  chapter_id text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, bible_id, chapter_id)
);

create table if not exists public.user_reading_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_slug text not null,
  started_at timestamptz not null default now(),
  completed_days integer[] not null default '{}',
  unique (user_id, plan_slug)
);

create index if not exists saved_verses_user_created_idx on public.saved_verses(user_id, created_at desc);
create index if not exists prayer_entries_user_created_idx on public.prayer_entries(user_id, created_at desc);
create index if not exists reading_progress_user_completed_idx on public.reading_progress(user_id, completed_at desc);

alter table public.profiles enable row level security;
alter table public.saved_verses enable row level security;
alter table public.prayer_entries enable row level security;
alter table public.reading_progress enable row level security;
alter table public.user_reading_plans enable row level security;

create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users manage their own saved verses" on public.saved_verses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own prayer entries" on public.prayer_entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own reading progress" on public.reading_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own reading plans" on public.user_reading_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

