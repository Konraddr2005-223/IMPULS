-- Sąsiedzki — initial schema + RLS (HackYeah / Kraków)
-- Apply in Supabase SQL Editor or via CLI. Requires PostGIS.

create extension if not exists postgis with schema extensions;

create table if not exists public.cities (
  id text primary key,
  name text not null,
  adapter_key text not null,
  active_edition text not null,
  rules_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  city_id text not null references public.cities (id),
  author_id uuid not null references public.profiles (id),
  title text not null,
  description text not null,
  category text,
  location geography(point, 4326) not null,
  district_code text,
  photo_path text,
  support_threshold integer not null default 3 check (support_threshold >= 1),
  likes_count integer not null default 0 check (likes_count >= 0),
  revision integer not null default 1 check (revision >= 1),
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_likes (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  idea_revision integer not null,
  template_version text not null,
  model text,
  prompt_version text,
  input_hash text,
  content_json jsonb,
  generation_status text not null default 'draft',
  generation_request_key text unique,
  summary_published boolean not null default false,
  official_project_id text,
  submitted_at timestamptz,
  signatures_reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faults (
  id uuid primary key default gen_random_uuid(),
  city_id text not null references public.cities (id),
  author_id uuid not null references public.profiles (id),
  category text not null,
  description text not null,
  location geography(point, 4326) not null,
  photo_path text,
  status text not null default 'new',
  status_source text not null default 'author',
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interest_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  city_id text not null references public.cities (id),
  name text not null,
  kind text not null check (kind in ('district', 'radius')),
  district_code text,
  center geography(point, 4326),
  radius_m integer check (radius_m is null or (radius_m between 50 and 2000)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  idea_id uuid references public.ideas (id) on delete set null,
  type text not null,
  event_key text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, event_key)
);

create table if not exists public.land_checks (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas (id) on delete set null,
  location geography(point, 4326) not null,
  source_mode text not null,
  ownership_json jsonb,
  planning_json jsonb,
  assessment text not null,
  ownership_updated_at text,
  planning_updated_at text,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ideas_location_gix on public.ideas using gist (location);
create index if not exists faults_location_gix on public.faults using gist (location);
create index if not exists comments_idea_id_idx on public.comments (idea_id);
create index if not exists notifications_recipient_read_idx
  on public.notifications (recipient_id, read_at);
create index if not exists ideas_ranking_idx
  on public.ideas (likes_count desc, created_at desc, id asc);

-- likes_count maintained only by trigger (clients must not update it)
create or replace function public.refresh_idea_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.idea_id, old.idea_id);
  perform set_config('app.updating_likes_count', 'on', true);
  update public.ideas
  set likes_count = (select count(*)::integer from public.idea_likes where idea_id = target),
      updated_at = now()
  where id = target;
  return null;
end;
$$;

drop trigger if exists idea_likes_count_trg on public.idea_likes;
create trigger idea_likes_count_trg
after insert or delete on public.idea_likes
for each row execute function public.refresh_idea_likes_count();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ideas_updated_at on public.ideas;
create trigger ideas_updated_at before update on public.ideas
for each row execute function public.set_updated_at();

drop trigger if exists faults_updated_at on public.faults;
create trigger faults_updated_at before update on public.faults
for each row execute function public.set_updated_at();

-- RLS
alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_likes enable row level security;
alter table public.comments enable row level security;
alter table public.applications enable row level security;
alter table public.faults enable row level security;
alter table public.interest_areas enable row level security;
alter table public.notifications enable row level security;
alter table public.land_checks enable row level security;

-- cities: public read
drop policy if exists cities_select on public.cities;
create policy cities_select on public.cities for select using (true);

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ideas: published readable; authors manage own
drop policy if exists ideas_select_published on public.ideas;
create policy ideas_select_published on public.ideas
  for select using (status = 'published' or author_id = auth.uid());
drop policy if exists ideas_insert_own on public.ideas;
create policy ideas_insert_own on public.ideas
  for insert with check (auth.uid() = author_id);
drop policy if exists ideas_update_own on public.ideas;
create policy ideas_update_own on public.ideas
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Guard likes_count against direct client updates (RLS alone does not protect columns)
create or replace function public.protect_idea_counters()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.updating_likes_count', true) = 'on' then
    return new;
  end if;
  new.likes_count := old.likes_count;
  return new;
end;
$$;

drop trigger if exists ideas_protect_counters on public.ideas;
create trigger ideas_protect_counters
before update on public.ideas
for each row execute function public.protect_idea_counters();

-- idea_likes: own rows only; public sees counts via ideas.likes_count
drop policy if exists idea_likes_select_own on public.idea_likes;
create policy idea_likes_select_own on public.idea_likes
  for select using (auth.uid() = user_id);
drop policy if exists idea_likes_insert_own on public.idea_likes;
create policy idea_likes_insert_own on public.idea_likes
  for insert with check (auth.uid() = user_id);
drop policy if exists idea_likes_delete_own on public.idea_likes;
create policy idea_likes_delete_own on public.idea_likes
  for delete using (auth.uid() = user_id);

-- comments
drop policy if exists comments_select_visible on public.comments;
create policy comments_select_visible on public.comments
  for select using (status = 'visible' or author_id = auth.uid());
drop policy if exists comments_insert_auth on public.comments;
create policy comments_insert_auth on public.comments
  for insert with check (auth.uid() = author_id);
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- applications: only author
drop policy if exists applications_select_own on public.applications;
create policy applications_select_own on public.applications
  for select using (
    auth.uid() = author_id
    or (summary_published = true)
  );
drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications
  for insert with check (auth.uid() = author_id);
drop policy if exists applications_update_own on public.applications;
create policy applications_update_own on public.applications
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- faults
drop policy if exists faults_select on public.faults;
create policy faults_select on public.faults for select using (true);
drop policy if exists faults_insert_own on public.faults;
create policy faults_insert_own on public.faults
  for insert with check (auth.uid() = author_id);
drop policy if exists faults_update_own on public.faults;
create policy faults_update_own on public.faults
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- interest areas: own only
drop policy if exists interest_areas_own on public.interest_areas;
create policy interest_areas_own on public.interest_areas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notifications: own only
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for select using (auth.uid() = recipient_id);
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- land checks: readable publicly for demo transparency; writes via service role / edge later
drop policy if exists land_checks_select on public.land_checks;
create policy land_checks_select on public.land_checks for select using (true);

insert into public.cities (id, name, adapter_key, active_edition, rules_version)
values ('krakow', 'Kraków', 'krakow', '2026-demo', 'krakow-bo-2026-v1')
on conflict (id) do update set
  name = excluded.name,
  adapter_key = excluded.adapter_key,
  active_edition = excluded.active_edition,
  rules_version = excluded.rules_version,
  updated_at = now();
