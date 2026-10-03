-- ============================================================================
-- SĄSIEDZKI — KOMPLETNY SKRYPT PRZYKŁADOWYCH DANYCH DLA SUPABASE
-- Zawiera:
--   - 10 użytkowników z profilami i hasłami (SasiedzkiDemo2026!)
--   - 6 pomysłów w Krakowie (różne dzielnice, kategorie)
--   - Lajki (rozdzielone wg pomysłów — część osiąga próg poparcia, część nie)
--   - Komentarze dyskusyjne
--   - "Moje okolice" (interest_areas: dzielnice oraz promienie) dla każdego użytkownika
--   - 0 usterek ("bez usterek")
--
-- Wklej cały ten skrypt w Supabase SQL Editor i kliknij "RUN".
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;

do $$
declare
  v_instance uuid;
  v_i int;
  v_id uuid;
  v_email text;
  v_name text;
  v_users jsonb := '[
    {"email": "autor@example.com", "name": "Jan Kowalski (Autor)"},
    {"email": "sasiad@example.com", "name": "Piotr Nowak (Sąsiad)"},
    {"email": "anna.wisniewska@example.com", "name": "Anna Wiśniewska"},
    {"email": "tomasz.wojcik@example.com", "name": "Tomasz Wójcik"},
    {"email": "katarzyna.kaminska@example.com", "name": "Katarzyna Kamińska"},
    {"email": "michal.lewandowski@example.com", "name": "Michał Lewandowski"},
    {"email": "magdalena.zielinska@example.com", "name": "Magdalena Zielińska"},
    {"email": "pawel.szymanski@example.com", "name": "Paweł Szymański"},
    {"email": "agnieszka.wozniak@example.com", "name": "Agnieszka Woźniak"},
    {"email": "jakub.dabrowski@example.com", "name": "Jakub Dąbrowski"}
  ]'::jsonb;

  v_u1 uuid;  v_u2 uuid;  v_u3 uuid;  v_u4 uuid;  v_u5 uuid;
  v_u6 uuid;  v_u7 uuid;  v_u8 uuid;  v_u9 uuid;  v_u10 uuid;

  v_idea1 uuid;  v_idea2 uuid;  v_idea3 uuid;
  v_idea4 uuid;  v_idea5 uuid;  v_idea6 uuid;
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000';
  end if;

  -- 1. Tworzenie 10 kont użytkowników (jeśli jeszcze nie istnieją)
  for v_i in 0..jsonb_array_length(v_users) - 1 loop
    v_email := v_users->v_i->>'email';
    v_name := v_users->v_i->>'name';

    select id into v_id from auth.users where email = v_email limit 1;

    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) values (
        v_instance, v_id, 'authenticated', 'authenticated', v_email,
        crypt('SasiedzkiDemo2026!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', v_name),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email', v_id::text,
        now(), now(), now()
      )
      on conflict do nothing;
    end if;

    insert into public.profiles (id, display_name)
    values (v_id, v_name)
    on conflict (id) do update set display_name = excluded.display_name;
  end loop;

  -- Pobieranie ID 10 użytkowników
  select id into v_u1 from auth.users where email = 'autor@example.com' limit 1;
  select id into v_u2 from auth.users where email = 'sasiad@example.com' limit 1;
  select id into v_u3 from auth.users where email = 'anna.wisniewska@example.com' limit 1;
  select id into v_u4 from auth.users where email = 'tomasz.wojcik@example.com' limit 1;
  select id into v_u5 from auth.users where email = 'katarzyna.kaminska@example.com' limit 1;
  select id into v_u6 from auth.users where email = 'michal.lewandowski@example.com' limit 1;
  select id into v_u7 from auth.users where email = 'magdalena.zielinska@example.com' limit 1;
  select id into v_u8 from auth.users where email = 'pawel.szymanski@example.com' limit 1;
  select id into v_u9 from auth.users where email = 'agnieszka.wozniak@example.com' limit 1;
  select id into v_u10 from auth.users where email = 'jakub.dabrowski@example.com' limit 1;

  -- 2. Upewnij się, że miasto 'krakow' istnieje
  insert into public.cities (id, name, adapter_key, active_edition, rules_version)
  values ('krakow', 'Kraków', 'krakow', '2026-demo', 'krakow-bo-2026-v1')
  on conflict (id) do update set
    name = excluded.name,
    adapter_key = excluded.adapter_key,
    active_edition = excluded.active_edition,
    rules_version = excluded.rules_version,
    updated_at = now();

  -- 3. Czyszczenie poprzednich powiązań demonstracyjnych
  delete from public.notifications where recipient_id in (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10);
  delete from public.comments where author_id in (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10);
  delete from public.idea_likes where user_id in (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10);
  delete from public.applications where author_id in (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10);
  delete from public.interest_areas where user_id in (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10);
  delete from public.ideas where author_id in (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10);

  -- "Bez usterek" — upewniamy się, że tabela faults jest pusta
  delete from public.faults where city_id = 'krakow';

  -- 4. Pomysły (6 pomysłów w Krakowie)
  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_u1,
    'Zielony zakątek z ławkami i drzewami',
    'Nasadzenie 4 drzew miododajnych oraz montaż 2 ławek parkowych z oparciami przy ciągu pieszym. Stworzenie zielonego miejsca odpoczynku dla spacerowiczów i rodziców z dziećmi.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.9185, 50.0712), 4326)::geography,
    'Krowodrza', 3, 'published'
  ) returning id into v_idea1;

  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_u3,
    'Zacieniona aleja spacerowa wzdłuż Wisły',
    'Dosadzenie szpaleru drzew liściastych wzdłuż trasy pieszo-rowerowej oraz instalacja dodatkowych koszy na śmieci. Naturalny cień podczas letnich upałów.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.9620, 50.0558), 4326)::geography,
    'Grzegórzki', 5, 'published'
  ) returning id into v_idea2;

  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_u4,
    'Sąsiedzkie warsztaty naprawcze i wymiana książek',
    'Cykl bezpłatnych warsztatów DIY ''Zrób to sam'' dla mieszkańców oraz montaż plenerowej szafki bookcrossingowej do sąsiedzkiej wymiany książek.',
    'non_investment',
    ST_SetSRID(ST_MakePoint(20.0380, 50.0725), 4326)::geography,
    'Nowa Huta', 5, 'published'
  ) returning id into v_idea3;

  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_u5,
    'Strefa odpoczynku i zieleń dla seniorów',
    'Wygodne ławki z poręczami i ergonomicznym oparciem, stół do gry w szachy oraz podwyższone rabaty z kwiatami ułatwiające kontakt z zielenią.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.9485, 50.0452), 4326)::geography,
    'Podgórze', 5, 'published'
  ) returning id into v_idea4;

  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_u6,
    'Bezpieczne doświetlenie skweru i latarnie solarne',
    'Instalacja 3 energooszczędnych latarni solarnych LED przy głównym przejściu pieszym przez skwer, znacząco zwiększających poczucie bezpieczeństwa po zmroku.',
    'investment',
    ST_SetSRID(ST_MakePoint(19.9452, 50.0754), 4326)::geography,
    'Prądnik Czerwony', 5, 'published'
  ) returning id into v_idea5;

  insert into public.ideas (
    id, city_id, author_id, title, description, category, location,
    district_code, support_threshold, status
  ) values (
    gen_random_uuid(), 'krakow', v_u7,
    'Ogród społeczny i strefa integracji mieszkańców',
    'Utworzenie otwartego ogrodu warzywno-ziołowego w podwyższonych drewnianych skrzyniach oraz organizacja sąsiedzkiego dnia wspólnego sadzenia roślin.',
    'non_investment',
    ST_SetSRID(ST_MakePoint(19.9240, 50.0490), 4326)::geography,
    'Dębniki', 5, 'published'
  ) returning id into v_idea6;

  -- 5. Lajki (przypisanie głosów poparcia)
  -- Idea 1: 7 lajków (próg 3 -> przekroczony!)
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea1, v_u1), (v_idea1, v_u2), (v_idea1, v_u3),
    (v_idea1, v_u4), (v_idea1, v_u5), (v_idea1, v_u6), (v_idea1, v_u7)
  on conflict do nothing;

  -- Idea 2: 8 lajków (próg 5 -> przekroczony!)
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea2, v_u1), (v_idea2, v_u2), (v_idea2, v_u3), (v_idea2, v_u4),
    (v_idea2, v_u5), (v_idea2, v_u6), (v_idea2, v_u8), (v_idea2, v_u9)
  on conflict do nothing;

  -- Idea 3: 6 lajków (próg 5 -> przekroczony!)
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea3, v_u1), (v_idea3, v_u2), (v_idea3, v_u4),
    (v_idea3, v_u5), (v_idea3, v_u8), (v_idea3, v_u10)
  on conflict do nothing;

  -- Idea 4: 4 lajki (próg 5 -> 4/5, blisko celu!)
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea4, v_u2), (v_idea4, v_u5), (v_idea4, v_u6), (v_idea4, v_u7)
  on conflict do nothing;

  -- Idea 5: 3 lajki (próg 5 -> 3/5)
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea5, v_u6), (v_idea5, v_u7), (v_idea5, v_u8)
  on conflict do nothing;

  -- Idea 6: 2 lajki (próg 5 -> 2/5)
  insert into public.idea_likes (idea_id, user_id) values
    (v_idea6, v_u7), (v_idea6, v_u9)
  on conflict do nothing;

  -- 6. Komentarze
  insert into public.comments (idea_id, author_id, body, status) values
    (v_idea1, v_u2, 'Fajnie, gdyby ławki miały oparcie i były w cieniu drzew.', 'visible'),
    (v_idea1, v_u1, 'Celujemy w 4 drzewa miododajne z katalogu BO, które szybko dadzą cień.', 'visible'),
    (v_idea1, v_u3, 'Bardzo popieram — brakuje tu zielonych miejsc do odpoczynku!', 'visible'),
    (v_idea2, v_u1, 'Cień latem przy trasie spacerowej to absolutna konieczność.', 'visible'),
    (v_idea2, v_u4, 'Warto dobrać gatunki odporne na warunki miejskie i suszę.', 'visible'),
    (v_idea3, v_u5, 'Chętnie poprowadzę warsztaty z podstaw renowacji mebli.', 'visible'),
    (v_idea3, v_u8, 'Bookcrossing na Placu Centralnym to strzał w dziesiątkę!', 'visible'),
    (v_idea4, v_u2, 'Dla seniorów kluczowe są poręcze ułatwiające wstawanie.', 'visible'),
    (v_idea4, v_u10, 'Ważne, by dojście było równe i bez barier architektonicznych.', 'visible'),
    (v_idea5, v_u7, 'Po zmroku ten skwer bywa nieprzyjemny, oświetlenie bardzo pomoże.', 'visible'),
    (v_idea6, v_u9, 'Mogę zorganizować sadzonki mięty, lawendy i ziół na otwarcie.', 'visible');

  -- 7. "Moje okolice" (interest_areas dla 10 użytkowników)
  insert into public.interest_areas (user_id, city_id, name, kind, district_code, lat, lng, radius_m, center) values
    -- Użytkownik 1: Jan Kowalski (Krowodrza + promień wokół domu)
    (v_u1, 'krakow', 'Krowodrza', 'district', 'Krowodrza', null, null, null, null),
    (v_u1, 'krakow', 'Wokół domu - Młynówka', 'radius', null, 50.0710, 19.9180, 600,
     ST_SetSRID(ST_MakePoint(19.9180, 50.0710), 4326)::geography),

    -- Użytkownik 2: Piotr Nowak (Krowodrza, Grzegórzki + Błonia)
    (v_u2, 'krakow', 'Krowodrza', 'district', 'Krowodrza', null, null, null, null),
    (v_u2, 'krakow', 'Grzegórzki (praca)', 'district', 'Grzegórzki', null, null, null, null),
    (v_u2, 'krakow', 'Błonia Krakowskie', 'radius', null, 50.0600, 19.9100, 1000,
     ST_SetSRID(ST_MakePoint(19.9100, 50.0600), 4326)::geography),

    -- Użytkownik 3: Anna Wiśniewska (Grzegórzki + Bulwary)
    (v_u3, 'krakow', 'Grzegórzki', 'district', 'Grzegórzki', null, null, null, null),
    (v_u3, 'krakow', 'Bulwary Wiślane', 'radius', null, 50.0550, 19.9600, 800,
     ST_SetSRID(ST_MakePoint(19.9600, 50.0550), 4326)::geography),

    -- Użytkownik 4: Tomasz Wójcik (Nowa Huta + Plac Centralny)
    (v_u4, 'krakow', 'Nowa Huta', 'district', 'Nowa Huta', null, null, null, null),
    (v_u4, 'krakow', 'Plac Centralny i Łąki', 'radius', null, 50.0720, 20.0370, 850,
     ST_SetSRID(ST_MakePoint(20.0370, 50.0720), 4326)::geography),

    -- Użytkownik 5: Katarzyna Kamińska (Podgórze + Park Bednarskiego)
    (v_u5, 'krakow', 'Podgórze', 'district', 'Podgórze', null, null, null, null),
    (v_u5, 'krakow', 'Park Bednarskiego', 'radius', null, 50.0450, 19.9480, 500,
     ST_SetSRID(ST_MakePoint(19.9480, 50.0450), 4326)::geography),

    -- Użytkownik 6: Michał Lewandowski (Prądnik Czerwony + Park)
    (v_u6, 'krakow', 'Prądnik Czerwony', 'district', 'Prądnik Czerwony', null, null, null, null),
    (v_u6, 'krakow', 'Park Zaczarowanej Dorożki', 'radius', null, 50.0760, 19.9460, 700,
     ST_SetSRID(ST_MakePoint(19.9460, 50.0760), 4326)::geography),

    -- Użytkownik 7: Magdalena Zielińska (Dębniki + Zakrzówek)
    (v_u7, 'krakow', 'Dębniki', 'district', 'Dębniki', null, null, null, null),
    (v_u7, 'krakow', 'Okolice Zakrzówka', 'radius', null, 50.0420, 19.9150, 1200,
     ST_SetSRID(ST_MakePoint(19.9150, 50.0420), 4326)::geography),

    -- Użytkownik 8: Paweł Szymański (Stare Miasto + Planty)
    (v_u8, 'krakow', 'Stare Miasto', 'district', 'Stare Miasto', null, null, null, null),
    (v_u8, 'krakow', 'Planty Krakowskie', 'radius', null, 50.0620, 19.9380, 900,
     ST_SetSRID(ST_MakePoint(19.9380, 50.0620), 4326)::geography),

    -- Użytkownik 9: Agnieszka Woźniak (Zwierzyniec + Park Jordana)
    (v_u9, 'krakow', 'Zwierzyniec', 'district', 'Zwierzyniec', null, null, null, null),
    (v_u9, 'krakow', 'Park Jordana i Błonia', 'radius', null, 50.0610, 19.9050, 750,
     ST_SetSRID(ST_MakePoint(19.9050, 50.0610), 4326)::geography),

    -- Użytkownik 10: Jakub Dąbrowski (Bronowice + Młynówka)
    (v_u10, 'krakow', 'Bronowice', 'district', 'Bronowice', null, null, null, null),
    (v_u10, 'krakow', 'Młynówka Królewska - Bronowice', 'radius', null, 50.0780, 19.8950, 700,
     ST_SetSRID(ST_MakePoint(19.8950, 50.0780), 4326)::geography);

  -- 8. Powiadomienia
  insert into public.notifications (recipient_id, idea_id, type, event_key, payload, read_at)
  values
  (
    v_u1, v_idea1, 'threshold_reached', 'threshold:' || v_idea1::text || ':3',
    jsonb_build_object(
      'title', 'Zielony zakątek z ławkami i drzewami',
      'message', 'Twój pomysł osiągnął próg poparcia (7/3)! Możesz teraz przygotować wniosek BO.'
    ),
    now()
  ),
  (
    v_u2, v_idea1, 'threshold_reached', 'neighbor:' || v_idea1::text || ':reached',
    jsonb_build_object(
      'title', 'Zielony zakątek z ławkami i drzewami',
      'message', 'Pomysł w Twojej okolicy zebrał wymagane poparcie.'
    ),
    null
  )
  on conflict (recipient_id, event_key) do nothing;

  raise notice 'Kompletny seed zakończony sukcesem!';
  raise notice '10 użytkowników, 6 pomysłów, lajki przypisane, "Moje okolice" skonfigurowane, 0 usterek.';
end $$;
