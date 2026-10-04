# Sąsiedzki

**Pomysł z okolicy. Wspólne działanie.**

Responsywna PWA pomagająca mieszkańcom Krakowa rozwijać pomysły okolicy: mapa → sprawdzenie terenu → poparcie sąsiadów → roboczy wniosek do Budżetu Obywatelskiego. Moduł usterek działa także poza sezonem BO. Prototyp obejmuje Kraków; lokalne formularze, reguły i źródła danych są w adapterze miasta.

## Stack

- React + TypeScript + Vite + Tailwind
- Leaflet / React Leaflet
- TanStack Query, React Hook Form, Zod, Lucide
- Supabase (Auth, Postgres/PostGIS, Storage, Edge Functions)
- Generator wniosku: **mock lokalny** domyślnie; Edge + OpenAI po ustawieniu `OPENAI_API_KEY`
- PWA (vite-plugin-pwa)

## Status brancha `feat/roles-b-c`

| Obszar | Stan |
|---|---|
| Schema, RLS, lajki, usterki + historia statusu, obszary, powiadomienia | Gotowe w kodzie |
| Seed §7 (~20 profili, lajki z rekordów, komentarze) | SQL gotowy — wkleić w Dashboard |
| Adapter Kraków, 12 lokalizacji demo, cennik, filtry listy | Gotowe |
| Mock generator, edytor, kopiuj/druk, przykład awaryjny, warianty BO | Gotowe |
| Edge `generate-application` | Gotowe na klucz (bez klucza → mock) |
| Prezentacja HTML→PDF, QR helper, deploy docs | `docs/presentation.html`, `public/qr.html`, `docs/deploy.md` |
| Cloudflare Pages URL + nagranie zapasowe | Do uzupełnienia po deployu / nagraniu |
| Osoba A (dopieszczenie UI) / merge | Osobno |

## Rozwój

```bash
cp .env.example .env.local   # VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
npm test
npm run build
```

App lokalnie: http://127.0.0.1:5173/

### Auth (Dashboard)

- Email provider ON
- **Confirm email OFF** na demo (włączyć przed publicznym pilotażem)

### Konta demo

| Rola | E-mail | Hasło |
|---|---|---|
| Autor | autor@example.com | SasiedzkiDemo2026! |
| Sąsiad | sasiad@example.com | SasiedzkiDemo2026! |

Utwórz konta **przed** seedem scenariusza.

### SQL (kolejność w Supabase SQL Editor)

1. `supabase/migrations/20261003180000_init_schema.sql`
2. `supabase/migrations/20261003183000_ideas_lat_lng.sql`
3. `supabase/migrations/PASTE_ME_storage_notifications.sql`
4. `supabase/migrations/PASTE_ME_spatial_likers.sql`
5. `supabase/migrations/PASTE_ME_fault_history_land_cache.sql`
6. `supabase/seed/demo_fake_profiles.sql`
7. `supabase/seed/demo_scenario.sql`

Szczegóły: `supabase/seed/demo_accounts.md`, `docs/deploy.md`.

## Hosting i QR

Zobacz `docs/deploy.md`. Po HTTPS URL: otwórz `/qr.html`, wklej adres, wygeneruj QR dla jury.

## Ujawnienie AI

Aplikacja przygotowuje **roboczą** treść projektu BO. Domyślnie: deterministyczny **mock** (`generator: mock`). Po `supabase secrets set OPENAI_API_KEY=…` i deployu Edge Function treść redaguje `gpt-4.1-mini`; **ceny wyłącznie z katalogu miejskiego**. Lajki ≠ podpisy BO. Złożenie oficjalne — w systemie miasta.

## Dokumenty prezentacji

- `docs/presentation.html` — 10 slajdów → Drukuj → PDF
- `docs/presentation.md` — skrót narracji
- `docs/demo-script-1min.md` — scenariusz filmiku 1 min (narracja + klikanie + prep SQL)
- `docs/backup-demo.md` — checklista nagrania zapasowego
- `specification of smartcity project.md` — pełny plan

## Architektura (skrót)

```
PWA → Supabase Auth / Data / Storage
    → CityAdapter (Kraków): szablon, cennik, demo land, WMS probe
    → generate-application (Edge+OpenAI lub mock)
    → land_checks cache ≤24h (tylko live)
    → fault_status_events (historia)
```

Map tiles: © OpenStreetMap contributors.
