import { krakowAdapter } from '../city'
import type { IdeaRecord } from '../ideas/types'
import type { ApplicationContent } from './types'

export type GenerateInput = {
  idea: IdeaRecord
  selectedComments: { id: string; body: string }[]
  costItems: { catalogId: string; quantity: number }[]
  landNote?: string
}

/** Deterministic mock — replaces OpenAI until a real edge function is wired. */
export function mockGenerateApplication(input: GenerateInput): ApplicationContent {
  const template = krakowAdapter.getApplicationTemplate()
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

  return {
    title: input.idea.title.slice(0, template.fields.find((f) => f.id === 'title')?.maxLength ?? 60),
    summary,
    location: `${input.idea.district_code ?? 'Kraków'} (${input.idea.lat.toFixed(5)}, ${input.idea.lng.toFixed(5)})`,
    description: [
      input.idea.description.trim(),
      commentNotes.length
        ? `Uwagi sąsiadów uwzględnione przez autora: ${commentNotes.join(' | ')}`
        : 'Brak wybranych komentarzy do uwzględnienia.',
    ].join('\n\n'),
    justification:
      'Propozycja odpowiada na lokalną potrzebę użytkowników aplikacji Sąsiedzki i ma charakter ogólnodostępny. Wymaga potwierdzenia warunków realizacji przez miasto.',
    accessibility:
      'Zakres dotyczy przestrzeni ogólnodostępnej. Szczegóły dostępności wymagać będą weryfikacji w terenie.',
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
    costItems: input.costItems,
    missingInformation: [
      'Koszt przygotowania terenu',
      'Koszt dokumentacji i późniejszego utrzymania',
    ],
    warnings: [
      'Wstępny szacunek, do weryfikacji.',
      'Dokument wygenerowany w trybie mock (bez OpenAI).',
      calendar.simulationLabel,
      ...(input.landNote ? [input.landNote] : []),
    ],
    usedCommentIds: input.selectedComments.map((c) => c.id),
    generator: 'mock',
  }
}

export function hashInput(parts: unknown): string {
  const raw = JSON.stringify(parts)
  let h = 0
  for (let i = 0; i < raw.length; i += 1) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0
  }
  return `h${(h >>> 0).toString(16)}`
}
