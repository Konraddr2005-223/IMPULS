-- Wklej w Supabase SQL Editor:
alter table public.interest_areas
  drop constraint if exists interest_areas_kind_check;

alter table public.interest_areas
  add constraint interest_areas_kind_check check (kind in ('district', 'radius', 'polygon'));

alter table public.interest_areas
  add column if not exists polygon_points jsonb;
