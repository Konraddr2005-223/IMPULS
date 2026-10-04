import { krakowAdapter } from '../city'
import type { IdeaRecord } from '../ideas/types'
import type { ApplicationContent } from './types'

export type GenerateInput = {
  idea: IdeaRecord
  selectedComments: { id: string; body: string }[]
  costItems: { catalogId: string; quantity: number }[]
  landNote?: string
}

function projectTypeOf(
  idea: IdeaRecord,
): 'investment' | 'non_investment' {
  return idea.category === 'non_investment' ? 'non_investment' : 'investment'
}

/** Deterministic mock — replaces OpenAI until a real edge function is wired. */
export function mockGenerateApplication(input: GenerateInput): ApplicationContent {
  const projectType = projectTypeOf(input.idea)
  const template = krakowAdapter.getApplicationTemplate(projectType)
  const calendar = krakowAdapter.getCalendar()
  const commentNotes = input.selectedComments
    .slice(0, 20)
    .map((c) => c.body.trim())
    .filter(Boolean)

  const summaryBase = `${input.idea.description.trim()} ${commentNotes[0] ?? ''}`.trim()
  const summary =
    summaryBase.length >= 60
      ? summaryBase.slice(0, 250)
      : `${summaryBase} Propozycja sąsiedzka do dalszego dopracowania w ramach ${calendar.simulationLabel}.`.slice(
          0,
          250,
        )

  const titleMax = template.fields.find((f) => f.id === 'title')?.maxLength ?? 60

  const base: ApplicationContent = {
    title: input.idea.title.slice(0, titleMax),
    summary,
    location: `${input.idea.district_code ?? 'Kraków'} (${input.idea.lat.toFixed(5)}, ${input.idea.lng.toFixed(5)})`,
    description: [
      input.idea.description.trim(),
      commentNotes.length
        ? `Uwagi sąsiadów uwzględnione przez autora: ${commentNotes.join(' | ')}`
        : 'Brak wybranych komentarzy do uwzględnienia.',
    ].join('\n\n'),
    justification:
      projectType === 'non_investment'
        ? 'Propozycja nieinwestycyjna odpowiada na lokalną potrzebę mieszkańców i nie wymaga trwałej zabudowy. Wymaga potwierdzenia warunków realizacji przez miasto.'
        : 'Propozycja odpowiada na lokalną potrzebę użytkowników aplikacji IMPULS i ma charakter ogólnodostępny. Wymaga potwierdzenia warunków realizacji przez miasto.',
    accessibility:
      'Zakres dotyczy przestrzeni ogólnodostępnej. Szczegóły dostępności wymagać będą weryfikacji w terenie.',
    schedule:
      projectType === 'investment'
        ? [
            {
              name: 'Przygotowanie i uzgodnienia',
              description: 'Potwierdzenie lokalizacji i zakresu robót.',
              date: null,
            },
            {
              name: 'Realizacja',
              description: 'Wykonanie zakresu po ewentualnym wyborze w BO.',
              date: null,
            },
          ]
        : [
            {
              name: 'Organizacja',
              description: 'Rekrutacja uczestników i rezerwacja miejsca.',
              date: null,
            },
            {
              name: 'Przeprowadzenie działań',
              description: 'Cykl spotkań / warsztatów bez inwestycji budowlanej.',
              date: null,
            },
          ],
    costItems: input.costItems,
    missingInformation:
      projectType === 'investment'
        ? [
            'Koszt przygotowania terenu',
            'Koszt dokumentacji i późniejszego utrzymania',
          ]
        : [
            'Koszt wynajmu sali (jeśli wymagany)',
            'Koszt materiałów zużywalnych poza katalogiem',
          ],
    warnings: [
      'Wstępny szacunek, do weryfikacji.',
      'Dokument wygenerowany w trybie mock (bez OpenAI).',
      calendar.simulationLabel,
      projectType === 'non_investment'
        ? 'Wariant formularza: projekt nieinwestycyjny.'
        : 'Wariant formularza: projekt inwestycyjny.',
      ...(input.landNote ? [input.landNote] : []),
    ],
    usedCommentIds: input.selectedComments.map((c) => c.id),
    generator: 'mock',
    projectType,
  }

  if (projectType === 'non_investment') {
    base.participants =
      'Mieszkańcy okolicy — dokładna liczba do uzupełnienia przez autora.'
    base.equipment =
      'Materiały i sprzęt bez trwałej zabudowy — lista do doprecyzowania.'
    if (input.costItems.length === 0) {
      base.warnings.push('Brak pozycji z katalogu — typowe dla części projektów nieinwestycyjnych.')
    }
  }

  return base
}

export function hashInput(parts: unknown): string {
  const raw = JSON.stringify(parts)
  let h = 0
  for (let i = 0; i < raw.length; i += 1) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0
  }
  return `h${(h >>> 0).toString(16)}`
}
