# Asystent BO — prompt i architektura (Sąsiedzki)

Dostosowana wersja `agent_prompt.md` pod aplikację **Sąsiedzki** (HackYeah / Kraków BO 2026).

## Stack (nie zmieniać)

- Frontend: React + TypeScript + Vite
- Backend AI (dev): Vite middleware `POST /api/bo-agent` → **Cursor SDK** (`Agent.prompt`, cloud `repos: []`) + `CURSOR_API_KEY` w `.env.local` (bez `VITE_*`)
- Fallback bez klucza / gdy API padnie: lokalny `mockRunBoAgent`
- Opcjonalnie później: Supabase Edge + OpenAI Structured Outputs
- **Bez RAG / Chroma / LangChain** — reguły miasta i katalog kosztów wstrzykujemy jako zaufany kontekst (`buildCityRulesContext`)

## Cel agenta

Z krótkiego, nieformalnego opisu pomysłu mieszkańca wygenerować **roboczą treść wniosku BO** + checklistę formalności — bez halucynowania faktów urzędowych.

## Wejście

```ts
{
  ideaText: string          // wymagane
  location?: string
  neighborComments?: string
}
```

## Wyjście (Zod: `boAgentProposalSchema`)

- `scope`: `district` | `city`
- `title`, `summary`, `location`, `description`, `justification`
- `targetGroups`, `accessibility`
- `costItems`: tylko `{ catalogId, quantity }` z katalogu miasta (ceny liczy backend)
- `missingInformation`, `warnings`
- `checklist`: dokumenty i następne kroki
- `generator`: `mock` | `openai`

## Checklist (moduł reguł)

Zawsze:

1. Sprawdzenie własności (MSIP / warstwa „Grunty gminne” — Gmina Miejska Kraków)
2. Oficjalna lista poparcia (lajki ≠ podpisy)
3. Złożenie w `budzet.krakow.pl` (Sąsiedzki nie składa wniosku)

Warunkowo:

- szkoła / przedszkole / dom kultury / biblioteka / obiekt sportowy → **Oświadczenie o gotowości do współpracy**

## System prompt

Źródło kodu: `src/agent/prompt.ts` → `BO_AGENT_SYSTEM_PROMPT`  
Wersja: `AGENT_PROMPT_VERSION = sasiedzki-bo-agent-2026-v4`
(układ = oficjalny formularz BO Kraków 2026; głos wnioskodawcy; bez GPS w lokalizacji;
literówki: `correctTypos` + `voiceCleanup` + prompt)

## Pliki

| Plik | Rola |
|---|---|
| `src/agent/prompt.ts` | System prompt + kontekst reguł |
| `src/agent/schema.ts` | Zod |
| `src/agent/checklist.ts` | Checklist formalności |
| `src/agent/mockAgent.ts` | Deterministic mock |
| `src/agent/api.ts` | `runBoAgent()` → `/api/bo-agent` lub mock |
| `src/agent/runCursorAgent.ts` | Cursor SDK → JSON wniosku |
| `vite-plugin-bo-agent.ts` | Dev endpoint `/api/bo-agent` |
| `src/agent/MapAgentPanel.tsx` | Panel wniosku na mapie (autor pomysłu) |
| `src/agent/AgentScreen.tsx` | Opcjonalny chat (nie w nawigacji) |

## UI

Na mapie: karta pomysłu → **Generuj wniosek BO (+ PDF)** (tylko autor, po progu poparć).
