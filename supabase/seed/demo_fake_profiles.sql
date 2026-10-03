-- PASTE in Supabase SQL Editor.
-- Creates 10 sample user accounts with profiles.
-- Password for all: SasiedzkiDemo2026!
-- Safe to re-run: upserts by email.

create extension if not exists pgcrypto;

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
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000';
  end if;

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

  raise notice '10 sample profiles created/verified (password: SasiedzkiDemo2026!)';
end $$;
