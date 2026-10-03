import { Agent, CursorAgentError } from '@cursor/sdk'
import { costCatalog } from '../city/krakow/config'
import { buildBoChecklist } from './checklist'
import { polishProposal } from './polishProposal'
import {
  AGENT_PROMPT_VERSION,
  BO_AGENT_SYSTEM_PROMPT,
  buildCityRulesContext,
} from './prompt'
import {
  boAgentInputSchema,
  boAgentProposalSchema,
  type BoAgentInput,
  type BoAgentProposal,
} from './schema'

const CATALOG_ID_SET = new Set(costCatalog.items.map((i) => i.id))

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? text).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new Error('Cursor agent nie zwrócił obiektu JSON.')
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown
}

function coerceProposal(raw: unknown): BoAgentProposal {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Niepoprawna odpowiedź agenta.')
  }
  const obj = raw as Record<string, unknown>
  const costItems = Array.isArray(obj.costItems)
    ? obj.costItems.filter(
        (item): item is { catalogId: string; quantity: number } =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof (item as { catalogId?: unknown }).catalogId === 'string' &&
              CATALOG_ID_SET.has((item as { catalogId: string }).catalogId) &&
              typeof (item as { quantity?: unknown }).quantity === 'number',
          ),
      )
    : []

  const title = typeof obj.title === 'string' ? obj.title : 'Projekt sąsiedzki'
  const description =
    typeof obj.description === 'string' ? obj.description : String(obj.description ?? '')
  const justification =
    typeof obj.justification === 'string'
      ? obj.justification
      : 'Celem zadania jest odpowiedź na lokalną potrzebę mieszkańców. Uzasadnienie zostanie doprecyzowane przed złożeniem wniosku.'
  const location =
    typeof obj.location === 'string'
      ? obj.location
      : 'Okolica realizacji na mapie wniosku (grunty Gminy Miejskiej Kraków)'

  const checklist =
    Array.isArray(obj.checklist) && obj.checklist.length >= 2
      ? obj.checklist
      : buildBoChecklist({ title, description, justification, location })

  const summaryBase =
    typeof obj.summary === 'string' && obj.summary.length >= 60
      ? obj.summary
      : `Proponujemy realizację zadania „${title}” w ramach Budżetu Obywatelskiego Miasta Krakowa.`

  const descriptionSafe =
    description.length >= 40
      ? description
      : `${description} Proponujemy uzupełnić szczegółowy opis zakresu przed złożeniem wniosku.`

  const projectType =
    obj.projectType === 'non_investment' || obj.projectType === 'investment'
      ? obj.projectType
      : 'investment'

  const schedule =
    Array.isArray(obj.schedule) && obj.schedule.length > 0
      ? obj.schedule
      : [
          {
            name: 'Przygotowanie',
            description: 'Uzgodnienia lokalizacji i dokumentacji.',
            date: null,
          },
          {
            name: 'Realizacja',
            description: 'Wykonanie zakresu propozycji zadania.',
            date: null,
          },
        ]

  return boAgentProposalSchema.parse({
    ...obj,
    projectType,
    title: title.slice(0, 60),
    description: descriptionSafe.slice(0, 4000),
    justification: justification.slice(0, 2000),
    location: location.slice(0, 200),
    summary: summaryBase.slice(0, 250),
    targetGroups:
      Array.isArray(obj.targetGroups) && obj.targetGroups.length > 0
        ? obj.targetGroups
        : ['Mieszkańcy okolicy'],
    accessibility:
      typeof obj.accessibility === 'string' && obj.accessibility.length >= 20
        ? obj.accessibility
        : 'Efekty propozycji zadania mają być dostępne nieodpłatnie dla mieszkańców zgodnie z kryterium ogólnodostępności BO.',
    costItems,
    schedule,
    missingInformation: Array.isArray(obj.missingInformation)
      ? obj.missingInformation
      : [],
    warnings: Array.isArray(obj.warnings) ? obj.warnings : [],
    checklist,
    generator: 'cursor',
  })
}

function buildUserPrompt(input: BoAgentInput): string {
  return [
    BO_AGENT_SYSTEM_PROMPT,
    '',
    '--- KONTEKST REGUŁ MIASTA (zaufany) ---',
    buildCityRulesContext(),
    '',
    '--- WEJŚCIE UŻYTKOWNIKA (może zawierać literówki — popraw je we wniosku) ---',
    `ideaText: ${input.ideaText}`,
    `location: ${input.location?.trim() || '(brak)'}`,
    `neighborComments: ${input.neighborComments?.trim() || '(brak)'}`,
    '',
    '--- WYMAGANY FORMAT ---',
    'Zwróć WYŁĄCZNIE jeden obiekt JSON (bez markdown) z polami oficjalnego formularza:',
    'scope, projectType, title, summary, location, description, justification,',
    'targetGroups, accessibility, costItems, schedule, missingInformation, warnings,',
    'checklist, generator:"cursor".',
    'Popraw literówki. Pisz formalnie jak propozycja zadania BO. Tylko JSON.',
  ].join('\n')
}

export type CursorAgentRunResult = {
  proposal: BoAgentProposal
  mode: 'cursor'
  promptVersion: string
}

/**
 * One-shot Cursor cloud agent (no repo) → structured BO proposal.
 * Loaded only by the Vite dev middleware — not from the browser bundle.
 */
export async function runCursorBoAgent(
  raw: BoAgentInput,
  apiKey: string,
): Promise<CursorAgentRunResult> {
  const input = boAgentInputSchema.parse(raw)
  if (!apiKey.trim()) {
    throw new Error('Brak CURSOR_API_KEY.')
  }

  try {
    const result = await Agent.prompt(buildUserPrompt(input), {
      apiKey,
      model: { id: 'composer-2.5' },
      cloud: { repos: [] },
    })

    if (result.status === 'error') {
      throw new Error('Cursor agent zakończył się błędem.')
    }

    const text =
      typeof result.result === 'string'
        ? result.result
        : JSON.stringify(result.result ?? '')
    const proposal = polishProposal(coerceProposal(extractJsonObject(text)))

    return {
      proposal,
      mode: 'cursor',
      promptVersion: AGENT_PROMPT_VERSION,
    }
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw new Error(
        `Cursor SDK: ${err.message}${err.isRetryable ? ' (można ponowić)' : ''}`,
      )
    }
    throw err
  }
}
