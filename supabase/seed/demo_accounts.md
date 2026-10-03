# Dane demonstracyjne — 10 użytkowników, pomysły, lajki i „Moje okolice”

## Lista 10 użytkowników demonstracyjnych

Wszystkie konta posiadają hasło: **`SasiedzkiDemo2026!`**

| # | Rola / Nazwa | E-mail | Zapisane „Moje okolice” |
|---|---|---|---|
| 1 | **Jan Kowalski (Autor)** | `autor@example.com` | Dzielnica: Krowodrza, Promień: Wokół domu - Młynówka (600 m) |
| 2 | **Piotr Nowak (Sąsiad)** | `sasiad@example.com` | Dzielnice: Krowodrza, Grzegórzki (praca), Promień: Błonia Krakowskie (1000 m) |
| 3 | **Anna Wiśniewska** | `anna.wisniewska@example.com` | Dzielnica: Grzegórzki, Promień: Bulwary Wiślane (800 m) |
| 4 | **Tomasz Wójcik** | `tomasz.wojcik@example.com` | Dzielnica: Nowa Huta, Promień: Plac Centralny i Łąki (850 m) |
| 5 | **Katarzyna Kamińska** | `katarzyna.kaminska@example.com` | Dzielnica: Podgórze, Promień: Park Bednarskiego (500 m) |
| 6 | **Michał Lewandowski** | `michal.lewandowski@example.com` | Dzielnica: Prądnik Czerwony, Promień: Park Zaczarowanej Dorożki (700 m) |
| 7 | **Magdalena Zielińska** | `magdalena.zielinska@example.com` | Dzielnica: Dębniki, Promień: Okolice Zakrzówka (1200 m) |
| 8 | **Paweł Szymański** | `pawel.szymanski@example.com` | Dzielnica: Stare Miasto, Promień: Planty Krakowskie (900 m) |
| 9 | **Agnieszka Woźniak** | `agnieszka.wozniak@example.com` | Dzielnica: Zwierzyniec, Promień: Park Jordana i Błonia (750 m) |
| 10 | **Jakub Dąbrowski** | `jakub.dabrowski@example.com` | Dzielnica: Bronowice, Promień: Młynówka Królewska - Bronowice (700 m) |

Każde z powyższych kont można wybrać bezpośrednio z okna logowania w aplikacji (sekcja *Szybkie konta demonstracyjne*).

---

## Przykładowe pomysły i stan poparcia

| Pomysł | Dzielnica | Kategoria | Poparcie (lajki) | Status progu |
|---|---|---|:---:|:---:|
| **Zielony zakątek z ławkami i drzewami** | Krowodrza | Inwestycyjny | **7 / 3** | Przekroczony (odblokowany generator) |
| **Zacieniona aleja spacerowa wzdłuż Wisły** | Grzegórzki | Inwestycyjny | **8 / 5** | Przekroczony |
| **Sąsiedzkie warsztaty naprawcze i wymiana książek** | Nowa Huta | Nieinwestycyjny | **6 / 5** | Przekroczony |
| **Strefa odpoczynku i zieleń dla seniorów** | Podgórze | Inwestycyjny | **4 / 5** | W toku (brakuje 1 lajka) |
| **Bezpieczne doświetlenie skweru i latarnie solarne** | Prądnik Czerwony | Inwestycyjny | **3 / 5** | W toku |
| **Ogród społeczny i strefa integracji mieszkańców** | Dębniki | Nieinwestycyjny | **2 / 5** | W toku |

> [!NOTE]
> Zgodnie z założeniem: **0 usterek w bazie danych**. Tabela `faults` pozostaje czysta.

---

## Jak wgrać dane do Supabase

### Sposób 1 (Najszybszy — 1 kliknięcie)
Wklej i uruchom w Supabase SQL Editor plik:
- **`supabase/seed/seed_10_users_sample_data.sql`**

### Sposób 2 (Krok po kroku)
1. `supabase/seed/reset_demo.sql` (opcjonalnie wyczyszczenie poprzednich danych)
2. `supabase/seed/demo_fake_profiles.sql` (utworzenie 10 użytkowników w auth.users i profiles)
3. `supabase/seed/demo_scenario.sql` (wgranie pomysłów, lajków, komentarzy i „Moich okolic”)
