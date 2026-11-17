-- OrPath Admin Content Studio
-- Run once in Supabase SQL Editor for the OrPath project.
create table if not exists public.orpath_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('daily_verse','devotional','featured_scripture','reading_journey','announcement')),
  title text not null,
  body text not null default '',
  scripture_reference text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  publish_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orpath_content_status_type_updated_idx
  on public.orpath_content (status, content_type, updated_at desc);

create index if not exists orpath_content_publish_at_idx
  on public.orpath_content (publish_at)
  where status = 'published';

alter table public.orpath_content enable row level security;

-- Content Studio accesses this table through the server-side service role
-- after checking that the signed-in user's profiles.role is 'admin'.
-- No browser/anon table policies are intentionally created.

notify pgrst, 'reload schema';
