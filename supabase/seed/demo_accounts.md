# Demo accounts (role B)

Create in Supabase Auth (Email provider, Confirm email OFF for demo):

| Rola | E-mail | Hasło |
|---|---|---|
| Autor | `autor@example.com` | `SasiedzkiDemo2026!` |
| Sąsiad | `sasiad@example.com` | `SasiedzkiDemo2026!` |

Then in SQL Editor (order matters):

1. `supabase/seed/reset_demo.sql` (optional clean slate)
2. `supabase/seed/demo_fake_profiles.sql` — ~18 fikcyjnych profili `demo.liker.01–18@example.com`
3. `supabase/seed/demo_scenario.sql` — 6 pomysłów, lajki z rekordów, 16 komentarzy, usterki, powiadomienia
4. `supabase/migrations/PASTE_ME_spatial_likers.sql` (RPC filtrów i likerów), jeśli jeszcze nie

Or from app: buttons **Autor** / **Sąsiad** create accounts on first login if Confirm email is disabled.

After full seed (§7):

| Pomysł | Lajki |
|---|---:|
| Zielony zakątek z ławkami | **2/3** (trzeci lajk odblokowuje generator) |
| Więcej cienia… | 18 |
| Miejsce odpoczynku dla seniorów | 12 |
| Sąsiedzkie warsztaty naprawcze | 8 |
| Piknik na terenie instytucji | 6 |
| Skwer na terenie innego podmiotu | 4 |

Fake liker password (unused in UI): `SasiedzkiDemo2026!`.

## Env checklist

See `.env.example`. Client needs only `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put service role in Vite.
