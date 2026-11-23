-- Expose anonymous prayer requests without exposing their author UUID.
create or replace view public.community_prayer_wall
with (security_invoker = true)
as
select
  id,
  case when visibility = 'anonymous' then null::uuid else author_id end as author_id,
  (author_id = (select auth.uid())) as is_mine,
  title,
  body,
  visibility,
  status,
  created_at
from public.community_prayer_requests;

grant select on public.community_prayer_wall to authenticated;
