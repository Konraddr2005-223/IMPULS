-- Storage bucket for idea/fault photos (public read for demo)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists media_auth_upload on storage.objects;
create policy media_auth_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in ('ideas', 'faults')
    and auth.uid()::text = (storage.foldername(name))[2]
  );

drop policy if exists media_auth_delete_own on storage.objects;
create policy media_auth_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- Notifications: allow self-insert for demo events
drop policy if exists notifications_insert_self on public.notifications;
create policy notifications_insert_self on public.notifications
  for insert to authenticated
  with check (auth.uid() = recipient_id);

-- interest_areas: plain lat/lng for clients (in addition to geography center)
alter table public.interest_areas
  add column if not exists lat double precision;

alter table public.interest_areas
  add column if not exists lng double precision;

create or replace function public.notify_threshold_reached(p_idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_title text;
  v_likes int;
  v_threshold int;
begin
  select author_id, title, likes_count, support_threshold
    into v_author, v_title, v_likes, v_threshold
  from public.ideas
  where id = p_idea_id;

  if v_author is null then
    return;
  end if;

  if v_likes < v_threshold then
    return;
  end if;

  insert into public.notifications (recipient_id, idea_id, type, event_key, payload)
  values (
    v_author,
    p_idea_id,
    'threshold_reached',
    'threshold:' || p_idea_id::text || ':' || v_threshold::text,
    jsonb_build_object('title', v_title, 'likes', v_likes, 'threshold', v_threshold)
  )
  on conflict (recipient_id, event_key) do nothing;
end;
$$;

grant execute on function public.notify_threshold_reached(uuid) to authenticated;
