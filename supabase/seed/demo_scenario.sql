-- PASTE in Supabase SQL Editor after profiles for autor/sasiad exist.
-- Seeds presentation scenario (§7). Safe to re-run after reset_demo.sql.

-- Requires: cities.krakow, auth users for autor@example.com and sasiad@example.com
-- with matching public.profiles rows.

do $$
declare
  v_autor uuid;
  v_sasiad uuid;
  v_idea1 uuid;
  v_idea2 uuid;
  v_idea3 uuid;
begin
  select id into v_autor from auth.users where email = 'autor@example.com' limit 1;
  select id into v_sasiad from auth.users where email = 'sasiad@example.com' limit 1;

  if v_autor is null or v_sasiad is null then
    raise exception 'Create demo auth users autor@example.com and sasiad@example.com first';
  end if;

  insert into public.profiles (id, display_name)
  values
    (v_autor, 'Autor demo'),
    (v_sasiad, 'Sąsiad demo')
  on conflict (id) do update set display_name = excluded.display_name;

  -- Clear previous demo-tagged content (by known titles / demo flag in description prefix)
  delete from public.notifications
  where recipient_id in (v_autor, v_sasiad)
    and event_key like 'demo:%';

  delete from public.idea_likes
  where idea_id in (
    select id from public.ideas
    where author_id in (v_autor, v_sasiad)
      and title in (
        'Zielony zakątek z ławkami',
        'Więcej cienia przy trasie spacerowej',
        'Miejsce odpoczynku dla seniorów',
        'Sąsiedzkie warsztaty naprawcze',
        'Piknik na terenie instytucji',
        'Skwer na terenie innego podmiotu'
      )
  );

  delete from public.comments
  where idea_id in (
    select id from public.ideas
    where author_id = v_autor
      and title = 'Zielony zakątek z ławkami'
  );

  delete from public.applications
  where author_id = v_autor;

  delete from public.faults
  where author_id in (v_autor, v_sasiad)
    and description like 'DEMO:%';

  delete from public.ideas
  where author_id = v_autor
    and title in (
      'Zielony zakątek z ławkami',
      'Więcej cienia przy trasie spacerowej',
      'Miejsce odpoczynku dla seniorów',
      'Sąsiedzkie warsztaty naprawcze',
      'Piknik na terenie instytucji',
      'Skwer na terenie innego podmiotu'
    );

  -- Main scenario idea (presentation-B municipal point near Krowodrza demo)
  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_autor,
    'Zielony zakątek z ławkami',
    'Dwie ławki i cztery drzewa przy trasie spacerowej. Wpis demonstracyjny — nie opisuje rzeczywistego problemu lokalnego.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.91, 50.07), 4326)::geography,
    'Krowodrza', 3, 'published'
  ) returning id into v_idea1;

  insert into public.ideas (
    city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values
  (
    'krakow', v_autor,
    'Więcej cienia przy trasie spacerowej',
    'Nasadzenia wzdłuż trasy spacerowej. Wpis demonstracyjny.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.96, 50.055), 4326)::geography,
    'Grzegórzki', 10, 'published'
  ),
  (
    'krakow', v_autor,
    'Miejsce odpoczynku dla seniorów',
    'Ławki i zacienione miejsce odpoczynku. Wpis demonstracyjny.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.949, 50.045), 4326)::geography,
    'Podgórze', 10, 'published'
  ),
  (
    'krakow', v_autor,
    'Sąsiedzkie warsztaty naprawcze',
    'Cykl nieodpłatnych warsztatów dla mieszkańców. Wpis demonstracyjny.',
    'non_investment',
    ST_SetSRID(ST_MakePoint(20.037, 50.072), 4326)::geography,
    'Nowa Huta', 5, 'published'
  ),
  (
    'krakow', v_autor,
    'Piknik na terenie instytucji',
    'Sąsiedzkie spotkanie wymagające uzgodnienia współpracy. Wpis demonstracyjny.',
    'non_investment',
    ST_SetSRID(ST_MakePoint(19.945, 50.075), 4326)::geography,
    'Prądnik Czerwony', 5, 'published'
  ),
  (
    'krakow', v_autor,
    'Skwer na terenie innego podmiotu',
    'Propozycja skweru — scenariusz ostrzeżenia o gruncie (presentation-A). Wpis demonstracyjny.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.923, 50.064), 4326)::geography,
    'Zabłocie', 5, 'published'
  );

  select id into v_idea2 from public.ideas
  where title = 'Więcej cienia przy trasie spacerowej' and author_id = v_autor limit 1;
  select id into v_idea3 from public.ideas
  where title = 'Skwer na terenie innego podmiotu' and author_id = v_autor limit 1;

  -- Likes: main idea 2/3 (autor + sasiad) — third like unlocks AI in demo
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea1, v_autor),
    (v_idea1, v_sasiad)
  on conflict do nothing;

  -- Extra likes on secondary ideas
  insert into public.idea_likes (idea_id, user_id)
  select v_idea2, v_sasiad
  on conflict do nothing;

  -- Comments on main idea
  insert into public.comments (idea_id, author_id, body, status) values
    (v_idea1, v_sasiad, 'Fajnie, gdyby ławki miały oparcie i były w cieniu.', 'visible'),
    (v_idea1, v_autor, 'Celujemy w dwie ławki i cztery drzewa z katalogu BO.', 'visible'),
    (v_idea1, v_sasiad, 'Przydałby się też kosz — ale to osobny koszt.', 'visible'),
    (v_idea3, v_sasiad, 'Tu grunt wygląda na problematyczny — warto ostrzec.', 'visible');

  -- Faults
  insert into public.faults (
    city_id, author_id, category, description, location, status, status_source
  ) values
  (
    'krakow', v_autor, 'street_furniture',
    'DEMO: Uszkodzona ławka przy skwerze.',
    ST_SetSRID(ST_MakePoint(19.937, 50.0614), 4326)::geography,
    'new', 'author'
  ),
  (
    'krakow', v_sasiad, 'waste',
    'DEMO: Przepełniony kosz.',
    ST_SetSRID(ST_MakePoint(19.944, 50.052), 4326)::geography,
    'community_confirmed', 'author'
  ),
  (
    'krakow', v_autor, 'lighting',
    'DEMO: Niesprawna latarnia.',
    ST_SetSRID(ST_MakePoint(19.923, 50.064), 4326)::geography,
    'author_resolved', 'author'
  ),
  (
    'krakow', v_sasiad, 'pavement',
    'DEMO: Uszkodzona nawierzchnia.',
    ST_SetSRID(ST_MakePoint(19.93, 50.04), 4326)::geography,
    'new', 'author'
  );

  -- Notifications: one unread for neighbor, one read for author
  insert into public.notifications (recipient_id, idea_id, type, event_key, payload, read_at)
  values
  (
    v_sasiad, v_idea1, 'threshold_reached', 'demo:unread:neighbor',
    jsonb_build_object(
      'title', 'Zielony zakątek z ławkami',
      'message', 'W okolicy pojawił się pomysł bliski progu poparcia.'
    ),
    null
  ),
  (
    v_autor, v_idea1, 'application_summary', 'demo:read:author',
    jsonb_build_object(
      'title', 'Zielony zakątek z ławkami',
      'message', 'Przypomnienie demonstracyjne o przygotowaniu wniosku.'
    ),
    now()
  )
  on conflict (recipient_id, event_key) do nothing;

  raise notice 'Demo seed OK. Main idea id=% (likes should be 2/3)', v_idea1;
end $$;
