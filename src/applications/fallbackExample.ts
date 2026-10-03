import type { ApplicationContent } from './types'

/**
 * Pre-saved emergency example (§8): use when AI/edge fails.
 * Marked in warnings — never presented as a live generation.
 */
export const FALLBACK_EXAMPLE_APPLICATION: ApplicationContent = {
  title: 'Zielony zakątek z ławkami (przykład)',
  summary:
    'Przykładowy roboczy opis dwóch ławek z oparciem i czterech drzew przy trasie spacerowej. Dokument awaryjny na wypadek braku generatora — wymaga ręcznej edycji przed złożeniem w systemie miasta.',
  location: 'Krowodrza (50.07000, 19.91000)',
  description:
    'Zakres demonstracyjny: dwie ławki z oparciem oraz cztery nasadzenia drzew z katalogu kosztów BO. Treść jest zapisana lokalnie jako przykład awaryjny i nie pochodzi z bieżącego wywołania modelu.',
  justification:
    'Lokalna potrzeba miejsc odpoczynku przy trasie spacerowej. Projekt ma charakter ogólnodostępny i wymaga potwierdzenia warunków realizacji przez miasto.',
  accessibility:
    'Przestrzeń ogólnodostępna. Szczegóły dostępności (dojście, nawierzchnia) wymagają weryfikacji w terenie.',
  schedule: [
    {
      name: 'Przygotowanie i uzgodnienia',
      description: 'Potwierdzenie lokalizacji i zakresu.',
      date: null,
    },
    {
      name: 'Realizacja',
      description: 'Wykonanie zakresu po ewentualnym wyborze w BO.',
      date: null,
    },
  ],
  costItems: [
    { catalogId: 'bench_backrest_installation', quantity: 2 },
    { catalogId: 'tree_16_18_planting', quantity: 4 },
  ],
  missingInformation: [
    'Koszt przygotowania terenu',
    'Koszt dokumentacji i późniejszego utrzymania',
  ],
  warnings: [
    'PRZYKŁAD AWARYJNY — nie jest wynikiem bieżącego generowania AI.',
    'Wstępny szacunek, do weryfikacji.',
    'Symulacja procesu według zasad 2026.',
  ],
  usedCommentIds: [],
  generator: 'mock',
  projectType: 'investment',
  participants: undefined,
  equipment: undefined,
}

export function isFallbackExample(content: ApplicationContent): boolean {
  return content.warnings.some((w) =>
    w.toLowerCase().includes('przykład awaryjny'),
  )
}
