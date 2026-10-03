# Deploy — Cloudflare Pages + Supabase Edge

## Frontend (Cloudflare Pages)

1. Połącz repo z Cloudflare Pages.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables (Production):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Po deployu skopiuj HTTPS URL → `public/qr.html` / slajd 10.

## Edge Function (opcjonalnie, klucz AI na końcu)

```bash
supabase functions deploy generate-application
supabase secrets set OPENAI_API_KEY=sk-...
```

Bez sekretu klient używa mocka lokalnego. Z sekretem edge woła `gpt-4.1-mini-2025-04-14` (Structured Outputs); ceny tylko z katalogu.

## SQL w projekcie Supabase (kolejność)

1. `20261003180000_init_schema.sql`
2. `20261003183000_ideas_lat_lng.sql`
3. `PASTE_ME_storage_notifications.sql` (lub timestamped)
4. `PASTE_ME_spatial_likers.sql`
5. `PASTE_ME_fault_history_land_cache.sql`
6. Konta Auth: autor / sasiad
7. `demo_fake_profiles.sql` → `demo_scenario.sql`

## Auth demo

Confirm email **OFF** na czas hackathonu. Przed pilotażem — włączyć + SMTP.
