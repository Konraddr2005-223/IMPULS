-- PASTE in Supabase SQL Editor (role B).
-- Creates ~18 fikcyjnych kont do seedowania lajków (§7: ~20 profili z autor/sasiad).
-- Safe to re-run: upserts by email. Password for all: SasiedzkiDemo2026!

create extension if not exists pgcrypto;

do $$
declare
  v_instance uuid;
  v_email text;
  v_id uuid;
  v_i int;
  v_name text;
  v_names text[] := array[
    'Anna Kowalska', 'Piotr Nowak', 'Magdalena Wiśniewska', 'Tomasz Wójcik',
    'Katarzyna Kamińska', 'Michał Lewandowski', 'Joanna Zielińska', 'Paweł Szymański',
    'Agnieszka Woźniak', 'Krzysztof Dąbrowski', 'Ewa Kozłowska', 'Marcin Jankowski',
    'Natalia Mazur', 'Jakub Krawczyk', 'Monika Piotrowska', 'Adam Grabowski',
    'Karolina Pawłowska', 'Bartosz Michalski'
  ];
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000';
  end if;

  for v_i in 1..18 loop
    v_email := format('demo.liker.%s@example.com', lpad(v_i::text, 2, '0'));
    v_name := v_names[v_i];

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

  raise notice 'Fake liker profiles OK (18 users demo.liker.01–18@example.com)';
end $$;
