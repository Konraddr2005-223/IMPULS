import { krakowAdapter } from '../city'
import type { ApplicationContent } from './types'

export type ContentValidation = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function validateApplicationContent(
  content: ApplicationContent,
): ContentValidation {
  const template = krakowAdapter.getApplicationTemplate()
  const errors: string[] = []
  const warnings: string[] = [...content.warnings]

  const titleField = template.fields.find((f) => f.id === 'title')
  const summaryField = template.fields.find((f) => f.id === 'summary')

  if (titleField?.maxLength && content.title.length > titleField.maxLength) {
    errors.push(`Tytuł przekracza ${titleField.maxLength} znaków.`)
  }
  if (!content.title.trim()) errors.push('Tytuł jest wymagany.')

  if (summaryField?.minLength && content.summary.length < summaryField.minLength) {
    errors.push(`Krótki opis musi mieć min. ${summaryField.minLength} znaków.`)
  }
  if (summaryField?.maxLength && content.summary.length > summaryField.maxLength) {
    errors.push(`Krótki opis przekracza ${summaryField.maxLength} znaków.`)
  }

  for (const id of ['description', 'justification', 'accessibility', 'location'] as const) {
    if (!content[id]?.trim()) errors.push(`Pole „${id}” jest wymagane.`)
  }

  if (content.costItems.length === 0) {
    warnings.push('Brak pozycji kosztorysu z katalogu.')
  }

  warnings.push(
    'Symulacja procesu według zasad 2026. Dokument nie jest oficjalnym wnioskiem.',
  )

  return { ok: errors.length === 0, errors, warnings }
}
