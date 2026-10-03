# Sąsiedzki

**Pomysł z okolicy. Wspólne działanie.**

Responsywna PWA pomagająca mieszkańcom Krakowa rozwijać pomysły okolicy: mapa → sprawdzenie terenu → poparcie sąsiadów → roboczy wniosek do Budżetu Obywatelskiego. Moduł usterek działa także poza sezonem BO. Prototyp obejmuje Kraków; lokalne formularze, reguły i źródła danych są w adapterze miasta.

## Stack

- React + TypeScript + Vite + Tailwind
- Leaflet / React Leaflet
- TanStack Query, React Hook Form, Zod, Lucide
- Supabase (Auth, Postgres/PostGIS, Storage, Edge Functions stub)
- Generator wniosku: mock lokalny (domyślnie) lub Edge Function + OpenAI gdy skonfigurowane
- PWA (vite-plugin-pwa)

## Role w repo

| Branch | Zakres |
|---|---|
| `main` / praca A | Frontend, mapa, UX |
| `feat/roles-b-c` | Backend/dane (B) + AI/prezentacja (C) |

Merge B+C → A na końcu hackathonu.

## Rozwój

```bash
cp .env.example .env.local   # VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
npm test
npm run build
```

App lokalnie: http://127.0.0.1:5173/

### Konta demo

| Rola | E-mail | Hasło |
|---|---|---|
| Autor | autor@example.com | SasiedzkiDemo2026! |
| Sąsiad | sasiad@example.com | SasiedzkiDemo2026! |

### Seed / reset (Supabase SQL Editor)

1. `supabase/seed/reset_demo.sql` (opcjonalnie)
2. `supabase/seed/demo_fake_profiles.sql` (~18 profili do lajków)
3. `supabase/seed/demo_scenario.sql` (pomysły, lajki z rekordów, komentarze)
4. `supabase/migrations/PASTE_ME_spatial_likers.sql` (RPC filtrów i likerów)
5. Wcześniejsze: schema, lat/lng, storage — patrz `supabase/migrations/`

Szczegóły: `supabase/seed/demo_accounts.md`.

## Ujawnienie AI

Aplikacja może przygotować **roboczą** treść projektu BO. W trybie domyślnym używany jest **deterministyczny generator mock** (bez wywołania OpenAI) — oznaczony w dokumencie (`generator: mock`). Gdy wdrożona jest Edge Function `generate-application` z sekretem `OPENAI_API_KEY`, treść redaguje model `gpt-4.1-mini` według promptu systemowego ze specyfikacji; **ceny i sumy pochodzą wyłącznie z katalogu miejskiego** (nie z modelu). Lajki nie są podpisami ani głosami. Oficjalne złożenie projektu odbywa się w systemie miasta.

## Dokumenty prezentacji

- `docs/presentation.md` — 10 slajdów
- `docs/backup-demo.md` — checklista nagrania zapasowego
- `specification of smartcity project.md` — pełny plan

## Architektura (skrót)

```
PWA → Supabase Auth / Data / Storage
    → CityAdapter (Kraków): szablon, cennik, demo land, WMS probe
    → generate-application (Edge lub mock)
    → land_checks cache ≤24h
```
