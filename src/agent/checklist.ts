import type { BoAgentProposal } from './schema'

const INSTITUTION_RE =
  /szko[lł]|przedszkol|żłob|dom(?:u|em)?\s+kultury|bibliotek|obiekt(?:u|em)?\s+sportow|basen|hala\s+sport/i

export type ChecklistDraft = BoAgentProposal['checklist'][number]

/**
 * Deterministic "Required documents & next steps" module from agent_prompt.md,
 * aligned with Kraków BO practice + IMPULS land layer (GK).
 */
export function buildBoChecklist(parts: {
  title: string
  description: string
  justification: string
  location: string
}): ChecklistDraft[] {
  const blob = [parts.title, parts.description, parts.justification, parts.location].join(
    '\n',
  )

  const items: ChecklistDraft[] = [
    {
      id: 'msip_ownership',
      label:
        'Sprawdź własność działki w MSIP / warstwie „Grunty gminne” (tylko Gmina Miejska Kraków).',
      required: true,
      reason:
        'Regulamin BO: projekt na gruntach należących lub pozostających we władaniu Miasta; nie na prywatnych, spółdzielczych, PKP ani w UW/najem/dzierżawa.',
    },
    {
      id: 'support_list',
      label:
        'Wydrukuj i zbierz podpisy na oficjalnej „Liście poparcia” (lajki w IMPULS tego nie zastępują).',
      required: true,
      reason: 'Wymóg formalny BO po złożeniu projektu w systemie miasta.',
    },
    {
      id: 'official_submit',
      label:
        'Złóż projekt w oficjalnym systemie budzet.krakow.pl — niniejszy dokument to tylko przygotowana treść wniosku.',
      required: true,
      reason: 'Oficjalne złożenie następuje wyłącznie w systemie miejskim.',
    },
  ]

  if (INSTITUTION_RE.test(blob)) {
    items.push({
      id: 'institution_consent',
      label:
        'Dołącz „Oświadczenie o gotowości do współpracy” podpisane przez dyrektora / zarządcę placówki.',
      required: true,
      reason:
        'Wymagane, gdy lokalizacja dotyczy szkoły, przedszkola, domu kultury, biblioteki lub obiektu sportowego.',
    })
  }

  items.push({
    id: 'mpzp_check',
    label: 'Zweryfikuj przeznaczenie terenu (MPZP) jeśli lokalizacja jest inwestycyjna.',
    required: false,
    reason: 'Plan miejscowy może ograniczać zakres robót — ostatecznie ocenia miasto.',
  })

  return items
}
