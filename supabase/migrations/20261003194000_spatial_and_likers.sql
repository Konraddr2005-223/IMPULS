-- Spatial helpers for role B (list ideas in interest areas — OR semantics)

create or replace function public.ideas_matching_user_areas(p_user_id uuid)
returns setof public.ideas
language sql
stable
security invoker
set search_path = public
as $$
  select i.*
  from public.ideas i
  where i.status = 'published'
    and (
      not exists (
        select 1 from public.interest_areas a where a.user_id = p_user_id
      )
      or exists (
        select 1
        from public.interest_areas a
        where a.user_id = p_user_id
          and a.kind = 'district'
          and a.district_code is not null
          and i.district_code is not null
          and lower(i.district_code) = lower(a.district_code)
      )
      or exists (
        select 1
        from public.interest_areas a
        where a.user_id = p_user_id
          and a.kind = 'radius'
          and a.center is not null
          and a.radius_m is not null
          and ST_DWithin(i.location, a.center, a.radius_m)
      )
    )
  order by i.likes_count desc, i.created_at desc, i.id asc;
$$;

grant execute on function public.ideas_matching_user_areas(uuid) to authenticated, anon;

-- Fan-out: notify users who liked an idea (used after publish/submit)
create or replace function public.list_idea_liker_ids(p_idea_id uuid)
returns table (user_id uuid)
language sql
stable
security invoker
set search_path = public
as $$
  select il.user_id
  from public.idea_likes il
  where il.idea_id = p_idea_id;
$$;

grant execute on function public.list_idea_liker_ids(uuid) to authenticated;
