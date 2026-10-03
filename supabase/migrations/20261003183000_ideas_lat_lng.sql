-- Expose lat/lng for PostgREST clients (geography often returns EWKB, not GeoJSON).

alter table public.ideas
  add column if not exists lat double precision
    generated always as (st_y(location::geometry)) stored;

alter table public.ideas
  add column if not exists lng double precision
    generated always as (st_x(location::geometry)) stored;

alter table public.faults
  add column if not exists lat double precision
    generated always as (st_y(location::geometry)) stored;

alter table public.faults
  add column if not exists lng double precision
    generated always as (st_x(location::geometry)) stored;
