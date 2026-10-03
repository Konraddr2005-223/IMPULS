-- PASTE in Supabase SQL Editor after:
--   1) auth users autor@example.com + sasiad@example.com
--   2) demo_fake_profiles.sql (~18 likerów)
-- Seeds presentation scenario (§7). Safe to re-run after reset_demo.sql.
-- Like counts MUST come from idea_likes rows (not independent counters).

do $$
declare
  v_autor uuid;
  v_sasiad uuid;
  v_idea1 uuid;
  v_idea2 uuid;
  v_idea3 uuid;
  v_idea4 uuid;
  v_idea5 uuid;
  v_idea6 uuid;
  v_likers uuid[];
  v_n int;
begin
  select id into v_autor from auth.users where email = 'autor@example.com' limit 1;
  select id into v_sasiad from auth.users where email = 'sasiad@example.com' limit 1;

  if v_autor is null or v_sasiad is null then
    raise exception 'Create demo auth users autor@example.com and sasiad@example.com first';
  end if;

  select array_agg(u.id order by u.email)
  into v_likers
  from auth.users u
  where u.email like 'demo.liker.%@example.com';

  if v_likers is null or coalesce(array_length(v_likers, 1), 0) < 18 then
    raise exception 'Run demo_fake_profiles.sql first (need 18 demo.liker.* users, got %)',
      coalesce(array_length(v_likers, 1), 0);
  end if;

  insert into public.profiles (id, display_name)
  values
    (v_autor, 'Autor demo'),
    (v_sasiad, 'Sąsiad demo')
  on conflict (id) do update set display_name = excluded.display_name;

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
      and title in (
        'Zielony zakątek z ławkami',
        'Więcej cienia przy trasie spacerowej',
        'Miejsce odpoczynku dla seniorów',
        'Sąsiedzkie warsztaty naprawcze',
        'Piknik na terenie instytucji',
        'Skwer na terenie innego podmiotu'
      )
  );

  delete from public.applications where author_id = v_autor;

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
  where title = 'Miejsce odpoczynku dla seniorów' and author_id = v_autor limit 1;
  select id into v_idea4 from public.ideas
  where title = 'Sąsiedzkie warsztaty naprawcze' and author_id = v_autor limit 1;
  select id into v_idea5 from public.ideas
  where title = 'Piknik na terenie instytucji' and author_id = v_autor limit 1;
  select id into v_idea6 from public.ideas
  where title = 'Skwer na terenie innego podmiotu' and author_id = v_autor limit 1;

  -- Main: 2/3 (autor + sasiad) — third like unlocks generator
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea1, v_autor),
    (v_idea1, v_sasiad)
  on conflict do nothing;

  -- Spec §7 targets: 18 / 12 / 8 / 6 / 4 from fake likers
  for v_n in 1..18 loop
    insert into public.idea_likes (idea_id, user_id)
    values (v_idea2, v_likers[v_n])
    on conflict do nothing;
  end loop;

  for v_n in 1..12 loop
    insert into public.idea_likes (idea_id, user_id)
    values (v_idea3, v_likers[v_n])
    on conflict do nothing;
  end loop;

  for v_n in 1..8 loop
    insert into public.idea_likes (idea_id, user_id)
    values (v_idea4, v_likers[v_n])
    on conflict do nothing;
  end loop;

  for v_n in 1..6 loop
    insert into public.idea_likes (idea_id, user_id)
    values (v_idea5, v_likers[v_n])
    on conflict do nothing;
  end loop;

  for v_n in 1..4 loop
    insert into public.idea_likes (idea_id, user_id)
    values (v_idea6, v_likers[v_n])
    on conflict do nothing;
  end loop;

  -- 16 comments across ideas (§7: 12–20)
  insert into public.comments (idea_id, author_id, body, status) values
    (v_idea1, v_sasiad, 'Fajnie, gdyby ławki miały oparcie i były w cieniu.', 'visible'),
    (v_idea1, v_autor, 'Celujemy w dwie ławki i cztery drzewa z katalogu BO.', 'visible'),
    (v_idea1, v_sasiad, 'Przydałby się też kosz — ale to osobny koszt.', 'visible'),
    (v_idea1, v_likers[1], 'Popieram — brakuje miejsc do odpoczynku na trasie.', 'visible'),
    (v_idea2, v_likers[2], 'Cień latem jest pilniejszy niż kolejne donice.', 'visible'),
    (v_idea2, v_likers[3], 'Warto dobrać gatunki odporne na warunki miejskie.', 'visible'),
    (v_idea2, v_sasiad, 'Ranking zieleni — ten pomysł powinien być wysoko.', 'visible'),
    (v_idea3, v_likers[4], 'Seniorzy potrzebują ławki z oparciem i poręczami.', 'visible'),
    (v_idea3, v_likers[5], 'Dobrze, jeśli dojście będzie równe i bez wysokich krawężników.', 'visible'),
    (v_idea3, v_autor, 'Uwzględnimy dostępność w opisie wniosku.', 'visible'),
    (v_idea4, v_likers[6], 'Warsztaty bez inwestycji budowlanej — super dla Nowej Huty.', 'visible'),
    (v_idea4, v_likers[7], 'Potrzebna sala i narzędzia — bez trwałej zabudowy.', 'visible'),
    (v_idea5, v_likers[8], 'Trzeba uzgodnić współpracę z instytucją gospodarującą terenem.', 'visible'),
    (v_idea5, v_sasiad, 'Piknik tylko po pisemnej zgodzie — dopiszcie to do wniosku.', 'visible'),
    (v_idea6, v_sasiad, 'Tu grunt wygląda na problematyczny — warto ostrzec.', 'visible'),
    (v_idea6, v_likers[9], 'Przenieście lokalizację na grunt gminny z demo B.', 'visible');

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

  raise notice 'Demo seed OK. Main=% (2/3), cień=18, seniorzy=12, warsztaty=8, piknik=6, skwer=4',
    v_idea1;
end $$;
