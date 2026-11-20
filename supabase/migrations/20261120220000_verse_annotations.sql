-- OrPath verse highlights and private study notes.
-- Run once in the Supabase SQL Editor after the existing user-data migrations.

create table if not exists public.verse_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bible_id text not null,
  verse_id text not null,
  reference text not null,
  verse_text text not null,
  highlight_color text check (highlight_color in ('yellow','green','blue','pink')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, bible_id, verse_id),
  constraint verse_annotations_has_content check (highlight_color is not null or nullif(trim(note), '') is not null)
);

create index if not exists verse_annotations_user_updated_idx
  on public.verse_annotations(user_id, updated_at desc);

alter table public.verse_annotations enable row level security;

drop policy if exists "Users manage their own verse annotations" on public.verse_annotations;
create policy "Users manage their own verse annotations"
  on public.verse_annotations
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

