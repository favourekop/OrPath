-- OrPath Admin CMS: managed content for the public experience.
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
create index if not exists orpath_content_type_status_idx on public.orpath_content(content_type,status,publish_at desc);
alter table public.orpath_content enable row level security;
drop policy if exists "Public can read published OrPath content" on public.orpath_content;
create policy "Public can read published OrPath content" on public.orpath_content
 for select to anon, authenticated using (status = 'published' and (publish_at is null or publish_at <= now()));
drop policy if exists "Admins manage OrPath content" on public.orpath_content;
create policy "Admins manage OrPath content" on public.orpath_content
 for all to authenticated using ((select public.is_orpath_admin())) with check ((select public.is_orpath_admin()));
grant select on public.orpath_content to anon, authenticated;
grant insert, update, delete on public.orpath_content to authenticated;
