-- Reset presentation tables (keeps auth users + cities + profiles).
-- Then re-run demo_scenario.sql.

truncate table
  public.notifications,
  public.land_checks,
  public.applications,
  public.comments,
  public.idea_likes,
  public.faults,
  public.interest_areas,
  public.ideas
restart identity cascade;

-- Keep cities.krakow
insert into public.cities (id, name, adapter_key, active_edition, rules_version)
values ('krakow', 'Kraków', 'krakow', '2026-demo', 'krakow-bo-2026-v1')
on conflict (id) do update set
  name = excluded.name,
  adapter_key = excluded.adapter_key,
  active_edition = excluded.active_edition,
  rules_version = excluded.rules_version,
  updated_at = now();
