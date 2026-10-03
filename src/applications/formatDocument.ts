import { calculateCosts, formatPlnRange } from './costs'
import type { ApplicationContent } from './types'

/** Plain-text export for clipboard copy (role C). */
export function formatApplicationPlainText(content: ApplicationContent): string {
  const costs = calculateCosts(content.costItems)
  const lines: string[] = [
    content.title,
    '',
    'Krótki opis:',
    content.summary,
    '',
    'Lokalizacja:',
    content.location,
    '',
    'Opis szczegółowy:',
    content.description,
    '',
    'Uzasadnienie:',
    content.justification,
    '',
    'Ogólnodostępność:',
    content.accessibility,
  ]

  if (content.projectType === 'non_investment') {
    if (content.participants?.trim()) {
      lines.push('', 'Uczestnicy / odbiorcy:', content.participants.trim())
    }
    if (content.equipment?.trim()) {
      lines.push('', 'Materiały i sprzęt:', content.equipment.trim())
    }
  }

  lines.push('', 'Harmonogram:')
  for (const step of content.schedule) {
    lines.push(`- ${step.name}: ${step.description}`)
  }

  lines.push('', 'Kosztorys (katalog):')
  for (const line of costs.lines) {
    lines.push(
      `- ${line.quantity} × ${line.label}: ${formatPlnRange(line.lineMinPln, line.lineMaxPln)}`,
    )
  }
  lines.push(
    `Suma rozpoznanych pozycji: ${formatPlnRange(costs.totalMinPln, costs.totalMaxPln)}.`,
    costs.disclaimer,
    '',
    'Braki informacji:',
    ...content.missingInformation.map((m) => `- ${m}`),
    '',
    'Ostrzeżenia:',
    ...content.warnings.map((w) => `- ${w}`),
    '',
    `Generator: ${content.generator}`,
  )

  return lines.join('\n')
}

export async function copyApplicationToClipboard(
  content: ApplicationContent,
): Promise<void> {
  const text = formatApplicationPlainText(content)
  if (!navigator.clipboard?.writeText) {
    throw new Error('Schowek niedostępny w tej przeglądarce.')
  }
  await navigator.clipboard.writeText(text)
}
