# Demo accounts (role B)

Create in Supabase Auth (Email provider, Confirm email OFF for demo):

| Rola | E-mail | Hasło |
|---|---|---|
| Autor | `autor@example.com` | `SasiedzkiDemo2026!` |
| Sąsiad | `sasiad@example.com` | `SasiedzkiDemo2026!` |

Then in SQL Editor:

1. `supabase/seed/reset_demo.sql` (optional clean slate)
2. `supabase/seed/demo_scenario.sql`

Or from app: buttons **Autor** / **Sąsiad** create accounts on first login if Confirm email is disabled.

After seed, main idea „Zielony zakątek z ławkami” should show **2/3** likes. Third like (from a fresh session / additional click path) unlocks mock/live generator for the author.
