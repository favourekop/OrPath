-- OrPath admin engagement and opt-in streak leaderboard.
-- Apply after the Community foundation and roles/dashboard migrations.
-- Streak days are based on UTC calendar dates and completed Bible chapters only.

alter table public.profiles
  add column if not exists streak_leaderboard_opt_in boolean not null default false;

-- Preserve owner-only profile updates while allowing members to change this one preference.
grant update (streak_leaderboard_opt_in) on public.profiles to authenticated;

create or replace function public.orpath_admin_engagement_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_orpath_admin() then
    raise exception 'Not authorized';
  end if;

  with daily_days as (
    select rp.user_id, (rp.completed_at at time zone 'UTC')::date as reading_day
    from public.reading_progress rp
    group by rp.user_id, (rp.completed_at at time zone 'UTC')::date
  ),
  numbered_days as (
    select user_id, reading_day,
      reading_day - (row_number() over (partition by user_id order by reading_day))::int as streak_group
    from daily_days
  ),
  streak_runs as (
    select user_id, min(reading_day) as run_start, max(reading_day) as run_end, count(*)::int as run_length
    from numbered_days
    group by user_id, streak_group
  ),
  streak_totals as (
    select user_id,
      max(run_length) as longest_streak,
      coalesce(max(run_length) filter (
        where run_end = (timezone('UTC', now()))::date
           or run_end = (timezone('UTC', now()))::date - 1
      ), 0) as current_streak
    from streak_runs
    group by user_id
  ),
  leaderboard as (
    select p.display_name, coalesce(s.current_streak, 0) as current_streak,
      coalesce(s.longest_streak, 0) as longest_streak
    from public.profiles p
    join streak_totals s on s.user_id = p.id
    where p.streak_leaderboard_opt_in = true
      and (coalesce(s.current_streak, 0) > 0 or coalesce(s.longest_streak, 0) > 0)
    order by s.current_streak desc, s.longest_streak desc
    limit 20
  )
  select jsonb_build_object(
    'active_readers_7d', (
      select count(distinct user_id) from daily_days
      where reading_day >= (timezone('UTC', now()))::date - 6
    ),
    'active_readers_30d', (
      select count(distinct user_id) from daily_days
      where reading_day >= (timezone('UTC', now()))::date - 29
    ),
    'completed_chapters', (select count(*) from public.reading_progress),
    'community_posts', (select count(*) from public.community_posts where status = 'published'),
    'community_comments', (select count(*) from public.community_comments),
    'community_reactions', (select count(*) from public.community_reactions),
    'prayer_requests_total', (select count(*) from public.community_prayer_requests),
    'prayer_requests_answered', (select count(*) from public.community_prayer_requests where status = 'answered'),
    'study_groups', (select count(*) from public.community_groups),
    'group_memberships', (select count(*) from public.community_group_members where status = 'active'),
    'open_reports', (select count(*) from public.community_reports where status in ('open','reviewing')),
    'streak_leaderboard', coalesce((select jsonb_agg(to_jsonb(leaderboard)) from leaderboard), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.orpath_admin_engagement_stats() from public;
grant execute on function public.orpath_admin_engagement_stats() to authenticated;
