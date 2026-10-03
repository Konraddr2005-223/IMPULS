-- Allow 'polygon' kind in interest_areas
alter table public.interest_areas
  drop constraint if exists interest_areas_kind_check;

alter table public.interest_areas
  add constraint interest_areas_kind_check check (kind in ('district', 'radius', 'polygon'));

-- Store polygon vertices as jsonb array of { lat, lng }
alter table public.interest_areas
  add column if not exists polygon_points jsonb;
