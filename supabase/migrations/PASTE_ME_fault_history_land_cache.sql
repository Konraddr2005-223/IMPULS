-- PASTE in Supabase SQL Editor (role B): fault history + land_checks insert policy

create table if not exists public.fault_status_events (
  id uuid primary key default gen_random_uuid(),
  fault_id uuid not null references public.faults (id) on delete cascade,
  from_status text,
  to_status text not null,
  source text not null default 'author',
  actor_id uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists fault_status_events_fault_idx
  on public.fault_status_events (fault_id, created_at desc);

alter table public.fault_status_events enable row level security;

drop policy if exists fault_status_events_select on public.fault_status_events;
create policy fault_status_events_select on public.fault_status_events
  for select using (true);

drop policy if exists fault_status_events_insert_auth on public.fault_status_events;
create policy fault_status_events_insert_auth on public.fault_status_events
  for insert with check (auth.uid() = actor_id);

drop policy if exists land_checks_insert_auth on public.land_checks;
create policy land_checks_insert_auth on public.land_checks
  for insert with check (auth.role() = 'authenticated' or auth.role() = 'anon');

create or replace function public.log_fault_created_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.fault_status_events (fault_id, from_status, to_status, source, actor_id, note)
  values (new.id, null, new.status, new.status_source, new.author_id, 'Utworzenie zgłoszenia');
  return new;
end;
$$;

drop trigger if exists faults_log_created_status on public.faults;
create trigger faults_log_created_status
after insert on public.faults
for each row execute function public.log_fault_created_status();
