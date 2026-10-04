# Scenariusz dema 1 min — Sąsiedzki

Nagranie ~60–65 s. Narracja: **145 słów** (tempo ok. 2,3 słowa/s — czytaj spokojnie, bez pośpiechu).
Dłuższa wersja 4 min: `specification of smartcity project.md` §9. Checklista nagrania zapasowego: `docs/backup-demo.md`.

Film opowiada trzy problemy i trzy odpowiedzi aplikacji:

| Problem | Odpowiedź w aplikacji | Ekran |
|---|---|---|
| Nie wiem, co się dzieje w mojej okolicy | **Moje okolice** — wielokąt lub dzielnica, filtr mapy i listy | `Moje → Moje okolice`, chip `Moje okolice` |
| Mam pomysł, ale odstrasza mnie papierologia | Lajki jako pierwszy sygnał → generator roboczej treści wniosku | Karta pomysłu, `Generuj wniosek BO (+ PDF)` |
| ~60% wniosków odpada, bo teren nie jest gminny | Sprawdzenie władania z danych MSIP **przed** pisaniem wniosku | Warstwa `Grunty gminne`, `Karta terenu` |

---

## 1. Przygotowanie przed nagraniem

1. Konta (Confirm email **OFF**): `autor@example.com` i `sasiad@example.com`, hasło `SasiedzkiDemo2026!`.
2. SQL w kolejności z `README.md` → `demo_fake_profiles.sql` → `demo_scenario.sql`.
3. **Prep SQL poniżej** — ustawia „Zielony zakątek" na **2/3**, żeby trzeci lajk padł na żywo w kadrze, oraz wstawia pełny łańcuch powiadomień u sąsiada.
4. Dwa okna: **lewe/duże = Autor** (desktop), **prawe/wąskie = Sąsiad** (szerokość telefonu). Sąsiad zalogowany, zakładka `Powiadomienia` otwarta — odświeża się co 5 s.
5. Na mapie zostaw włączone `Grunty gminne`, wyłącz `Dzielnice` (mniej szumu).
6. Ustaw mapę na Krowodrzę, zoom taki, żeby w kadrze były oba punkty klikane w filmie.

### Prep SQL (Supabase SQL Editor)

```sql
do $$
declare
  v_u1 uuid; v_u2 uuid; v_idea1 uuid;
begin
  select id into v_u1 from auth.users where email = 'autor@example.com';
  select id into v_u2 from auth.users where email = 'sasiad@example.com';
  select id into v_idea1 from public.ideas
    where title = 'Zielony zakątek z ławkami i drzewami' limit 1;

  -- 2/3: zostaw lajki autora i Anny, zdejmij resztę (w tym sąsiada)
  delete from public.idea_likes
  where idea_id = v_idea1 and user_id <> v_u1
    and user_id <> (select id from auth.users where email = 'anna.wisniewska@example.com');

  -- powiadomienie o progu ma pojawić się na żywo
  delete from public.notifications where idea_id = v_idea1 and type = 'threshold_reached';

  -- łańcuch powiadomień u sąsiada (kadr „Powiadomienia")
  insert into public.notifications (recipient_id, idea_id, type, event_key, payload, read_at) values
    (v_u2, v_idea1, 'application_summary', 'demo:summary:' || v_idea1::text,
     jsonb_build_object('title', 'Zielony zakątek z ławkami i drzewami',
       'message', 'Autor przygotował projekt wniosku.'), null),
    (v_u2, v_idea1, 'submitted', 'demo:submitted:' || v_idea1::text,
     jsonb_build_object('title', 'Zielony zakątek z ławkami i drzewami',
       'message', 'Autor zgłosił złożenie projektu. Sprawdź instrukcję podpisów.'), null),
    (v_u2, v_idea1, 'signatures', 'demo:signatures:' || v_idea1::text,
     jsonb_build_object('title', 'Zielony zakątek z ławkami i drzewami',
       'message', 'Według autora wymagana lista poparcia została zebrana.'), null),
    (v_u2, v_idea1, 'voting_reminder', 'demo:voting:' || v_idea1::text,
     jsonb_build_object('title', 'Zielony zakątek z ławkami i drzewami',
       'message', 'Przypomnienie demonstracyjne o głosowaniu.'), null)
  on conflict (recipient_id, event_key) do nothing;
end $$;
```

### Punkty do klikania na mapie

| Cel w filmie | Współrzędne | Co pokaże `Karta terenu` |
|---|---|---|
| Teren **nie** gminny (problem 60%) | `50.064, 19.923` (Demo — Piasek) | `Wymaga weryfikacji` + `Władanie osób prawnych (opis demonstracyjny)` |
| Teren gminny (zielone światło) | `50.07, 19.91` (Demo — Krowodrza) | `Wstępnie bez wykrytej przeszkody (demo)` + `Grunt gminny (scenariusz demo)` |

> Uwaga: marker pomysłu „Zielony zakątek" stoi na `50.0712, 19.9185`, czyli ~600 m od punktu demo gminnego. Klik w sam marker **nie** pokaże scenariusza gminnego — klikaj w mapę w okolicy `50.07, 19.91`.

---

## 2. Scenariusz — obraz i narracja

### 0:00–0:11 · Problem

**Obraz:** mapa Krakowa z markerami pomysłów, wolny zoom w stronę Krowodrzy.

> „Budżet obywatelski ma dwa ciche problemy. Mieszkańcy nie wiedzą, jakie projekty powstają w ich okolicy. A ci, którzy mają pomysł, nie zgłaszają go, bo odstrasza ich papierologia."

### 0:11–0:21 · Moje okolice

**Obraz:** `Moje` → `Moje okolice` (widoczna zapisana okolica: wielokąt + `Dzielnica: Krowodrza`) → powrót na `Mapa` → klik w chip **`Moje okolice`**; lista `Topowe pomysły` zawęża się do okolicy.

> „W Sąsiedzkim zaczynasz od wyznaczenia swojej okolicy — wielokątem na mapie albo całą dzielnicą. Od tej chwili widzisz tylko pomysły i usterki ze swojego terenu."

### 0:21–0:36 · Lajki i łańcuch powiadomień

**Obraz:** karta „Zielony zakątek z ławkami i drzewami", `Poparcie sąsiadów: 2 z 3 głosów` → w oknie sąsiada klik **`Popieram ten pomysł`** → licznik `3 z 3`, pasek na zielono, status **`✓ Odblokowany BO`** → cięcie na zakładkę `Powiadomienia` sąsiada: cztery wpisy w kolejności (streszczenie → złożenie i podpisy → podpisy zebrane → przypomnienie o głosowaniu).

> „Pomysł zbiera lajki sąsiadów. Lajk to nie podpis — to sygnał. Gdy próg pęknie, każdy, kto polubił, dostaje powiadomienie: najpierw jak i gdzie złożyć podpis, potem że podpisy się zebrały, a przed wyborami — przypomnienie o głosowaniu."

Trzymaj kadr tak, by na sekundę dało się przeczytać disclaimer `Popieram pomysł. To nie jest podpis na liście BO.`

### 0:36–0:49 · Teren — skąd się biorą odrzucenia

**Obraz:** mapa z włączoną warstwą `Grunty gminne` (granatowe poligony = `Grunty Gminy Kraków (GK)`) → klik w `50.064, 19.923`, czyli **poza** granatowym obszarem → `Karta terenu`: `Wymaga weryfikacji`, sekcja `1. Status i kategoria gruntu` → `Władanie osób prawnych (opis demonstracyjny)`.

> „Sześćdziesiąt procent wniosków odpada od razu, bo teren nie należy do gminy. Dlatego pytamy API miasta jeszcze przed pisaniem wniosku — tu od razu widać, że to nie jest grunt gminny."

### 0:49–1:03 · Wniosek i zamknięcie

**Obraz:** klik w `50.07, 19.91` → `Wstępnie bez wykrytej przeszkody (demo)` → powrót do karty pomysłu → **`Generuj wniosek BO (+ PDF)`** → szybkie przewinięcie dokumentu: opis, uzasadnienie, `Szacunkowe koszty realizacji propozycji zadania`, sekcja `Dokumenty i następne kroki (poza formularzem online)`.

> „Na gruncie gminnym aplikacja przygotowuje roboczą treść wniosku: opis, uzasadnienie i koszty z miejskiego cennika. Mieszkańcowi zostaje przeczytać i złożyć go w systemie miasta. Pomysł z okolicy — wspólne działanie."

---

## 3. Narracja ciągła (do promptera)

> Budżet obywatelski ma dwa ciche problemy. Mieszkańcy nie wiedzą, jakie projekty powstają w ich okolicy. A ci, którzy mają pomysł, nie zgłaszają go, bo odstrasza ich papierologia.
>
> W Sąsiedzkim zaczynasz od wyznaczenia swojej okolicy — wielokątem na mapie albo całą dzielnicą. Od tej chwili widzisz tylko pomysły i usterki ze swojego terenu.
>
> Pomysł zbiera lajki sąsiadów. Lajk to nie podpis — to sygnał. Gdy próg pęknie, każdy, kto polubił, dostaje powiadomienie: najpierw jak i gdzie złożyć podpis, potem że podpisy się zebrały, a przed wyborami — przypomnienie o głosowaniu.
>
> Sześćdziesiąt procent wniosków odpada od razu, bo teren nie należy do gminy. Dlatego pytamy API miasta jeszcze przed pisaniem wniosku — tu od razu widać, że to nie jest grunt gminny.
>
> Na gruncie gminnym aplikacja przygotowuje roboczą treść wniosku: opis, uzasadnienie i koszty z miejskiego cennika. Mieszkańcowi zostaje przeczytać i złożyć go w systemie miasta. Pomysł z okolicy — wspólne działanie.

## 4. Plansze / napisy na ekranie

Krótkie napisy pomagają, gdy ktoś obejrzy film bez dźwięku:

| Czas | Napis |
|---|---|
| 0:02 | `Nie wiesz, co powstaje obok? Papierologia zniechęca?` |
| 0:13 | `Moje okolice — wielokąt lub dzielnica` |
| 0:24 | `Lajk = sygnał, nie podpis` |
| 0:30 | `Powiadomienia: podpisy → zebrane → głosowanie` + mała adnotacja `w aplikacji; e-mail w pilotażu` |
| 0:38 | `~60% wniosków odpada: teren nie gminny` |
| 0:42 | `Dane MSIP Kraków — sprawdzane przed wnioskiem` |
| 0:52 | `Roboczy wniosek + koszty z miejskiego cennika` |

---

## 5. Co jest realne, a co symulowane — formułowania bezpieczne dla jury

Najkrótsza wersja: **nie mów „wysyłamy maila"**, mów **„dostaje powiadomienie"**. Powiadomienia działają jako zdarzenia w aplikacji (tabela `notifications`, odświeżanie co 5 s); kanał e-mail/push to następny krok i w repo nie ma jeszcze wysyłki SMTP.

| Element | Stan faktyczny | Jak o tym mówić |
|---|---|---|
| Moje okolice (wielokąt / dzielnica) + filtrowanie | Działa (`ideaMatchesAreas`) | „widzisz tylko pomysły ze swojego terenu" |
| Lajki, próg, odblokowanie generatora | Działa (trigger `likes_count`, `assertCanGenerate`) | „próg pęka i generator się odblokowuje" |
| Powiadomienie o progu do autora | Działa (`notify_threshold_reached`, security definer) | „autor dostaje powiadomienie" |
| Łańcuch powiadomień do lajkujących | Zdarzenia są w modelu, w filmie pokazywane z przygotowanych danych | „każdy, kto polubił, dostaje powiadomienie" |
| **E-mail / push** | **Nie zaimplementowane** | „ten sam event w pilotażu idzie mailem" — nigdy w czasie teraźniejszym |
| Powiadomienie przedwyborcze | `voting_reminder`, oznaczone w UI jako `Przypomnienie o głosowaniu (demo)` | „przypomnienie przed głosowaniem — u nas na razie jako symulacja" |
| Warstwa `Grunty gminne` | Realne dane MSIP Kraków (ArcGIS export, filtr `gr_wl_ag = 11`) | „warstwa gruntów Gminy Kraków wprost z MSIP" |
| Punktowy odczyt władania | WMS `GetFeatureInfo` + scenariusze demo (`Tryb: ...` widoczny w karcie) | „karta pokazuje źródło i tryb odczytu" |
| Treść wniosku | Domyślnie deterministyczny mock, OpenAI po kluczu | „roboczą treść" / „projekt treści", nigdy „gotowy wniosek" |
| Złożenie wniosku | Aplikacja **nie** składa — składa mieszkaniec w `budzet.krakow.pl` | „zostaje przeczytać i złożyć w systemie miasta" |
| 15 podpisów, 10 dni | Reguły z konfiguracji Krakowa 2026 | można podać jako liczby z regulaminu |

**Liczba 60%:** w repo nie ma jej źródła. Przed nagraniem podstaw konkretne źródło (raport z ewaluacji BO Kraków) i trzymaj je w zapasie na pytania jury — albo powiedz „większość wniosków odpada formalnie", jeśli nie chcesz podawać liczby bez odnośnika.

---

## 6. Ryzyka techniczne przy nagraniu

1. **Fan-out powiadomień do lajkujących.** `createNotification` wstawia wiersz z sesji autora, a polityka RLS `notifications_insert_self` dopuszcza tylko `auth.uid() = recipient_id`. Przycisk `Opublikuj streszczenie → sąsiedzi` może więc zwrócić błąd. Dlatego film pokazuje listę powiadomień sąsiada przygotowaną w Prep SQL. Jeśli chcesz kliknąć to na żywo, przed nagraniem dołóż funkcję `security definer` (wzór: `notify_threshold_reached`) i przetestuj.
2. **CORS na WMS.** Odczyt punktowy może polec w przeglądarce (`Odczyt WMS może być ograniczony przez CORS przeglądarki…`). Punkty z tabeli wyżej mają scenariusz demo, więc karta zawsze coś pokaże, ale miej otwartą zapasową kartę terenu.
3. **Czas generowania wniosku.** Przy mocku jest natychmiast; z `OPENAI_API_KEY` dochodzi kilka sekund — przy 60 s filmu wytnij to cięciem montażowym albo nagrywaj na mocku.
4. **Limit generowań:** 3 na pomysł w demo. Przy wielu próbach nagrania zrób reset (`supabase/seed/reset_demo.sql`).
5. **Dwa okna, jedna przeglądarka.** Użyj osobnego profilu albo okna incognito dla sąsiada — wspólna sesja Supabase wyloguje autora.

---

## 7. Wariant 90 s (jeśli limit czasu jest luźniejszy)

Wstaw dwie wstawki do scenariusza z sekcji 2:

- **po 0:21 (+12 s)** — komentarze sąsiadów pod pomysłem i wybór komentarza do wniosku:
  > „Pomysł dojrzewa w komentarzach — autor może wciągnąć uwagi sąsiadów do treści wniosku."
- **po 0:49 (+15 s)** — checklista formalności i rozróżnienie lajków od podpisów:
  > „Do tego checklista: własność działki, oficjalna lista piętnastu podpisów i złożenie w systemie miasta. Aplikacja mówi wprost, czego jeszcze brakuje."

Opcjonalnie zamiast powyższych — moduł usterek jako odpowiedź na „co robicie poza sezonem BO" (+10 s):
> „Poza sezonem budżetu ta sama mapa służy do zgłaszania usterek w okolicy."
