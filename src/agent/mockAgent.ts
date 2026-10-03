import { calculateCosts, formatPlnRange } from '../applications/costs'
import { correctTypos } from './correctTypos'
import { polishProposal } from './polishProposal'
import { AGENT_PROMPT_VERSION, buildCityRulesContext } from './prompt'
import {
  boAgentInputSchema,
  type BoAgentInput,
  type BoAgentProposal,
} from './schema'
import { normalizeApplicationLocation } from './voiceCleanup'

function guessScope(text: string): 'district' | 'city' {
  if (/\b(cał(e|y)\s+miasto|ogólnomiejsk|wszystkie dzielnic)/i.test(text)) {
    return 'city'
  }
  return 'district'
}

function guessProjectType(text: string): 'investment' | 'non_investment' {
  if (
    /warsztat|zajęcia|kurs|szkolen|wydarzen|piknik|festyn|koncert|spotkan/i.test(
      text,
    )
  ) {
    return 'non_investment'
  }
  return 'investment'
}

function guessCostItems(text: string): BoAgentProposal['costItems'] {
  const items: BoAgentProposal['costItems'] = []
  const lower = text.toLowerCase()

  if (/ławk/.test(lower)) {
    const n = lower.match(/(\d+)\s*ław/)?.[1]
    items.push({
      catalogId: 'bench_backrest_installation',
      quantity: Math.min(Number(n) || 2, 20),
    })
  }
  if (/drzew|nasadz|zieleń|zielon/.test(lower)) {
    const n = lower.match(/(\d+)\s*drzew/)?.[1]
    items.push({
      catalogId: 'tree_16_18_planting',
      quantity: Math.min(Number(n) || 4, 40),
    })
  }
  if (/kosz|śmietnik/.test(lower)) {
    items.push({ catalogId: 'bin_50l_installation', quantity: 2 })
  }
  if (/rower|stojak/.test(lower)) {
    items.push({ catalogId: 'bike_rack', quantity: 2 })
  }
  if (
    /plac zabaw|huśtawk|piaskownic|wybieg.*ps|psie|workout|siłownia zewnętrz/.test(
      lower,
    )
  ) {
    items.push({ catalogId: 'playground_element', quantity: 1 })
  }
  if (/ścieżk|chodnik|nawierzchn/.test(lower)) {
    items.push({ catalogId: 'path_surface_m2', quantity: 40 })
  }
  if (/oświetl|latarn/.test(lower)) {
    items.push({ catalogId: 'lighting_pole', quantity: 2 })
  }
  if (/donic|skrzyn/.test(lower)) {
    items.push({ catalogId: 'planter_box', quantity: 4 })
  }

  return items
}

function stripCasualLead(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /^(zróbmy|zrób|chcemy|chciał[aeaby]bym|dajcie|poprośmy|zrobimy|trzeba|może)\s+/i,
      '',
    )
}

function formalTitle(ideaText: string): string {
  let t = stripCasualLead(ideaText)
  t = t.split(/[.!?]/)[0] ?? t
  t = t.replace(/[.!?…]+$/g, '').trim()
  if (!t) t = 'Propozycja zadania sąsiedzkiego'
  t = t.charAt(0).toUpperCase() + t.slice(1)
  return t.slice(0, 60)
}

function formalSummary(title: string, ideaText: string, location: string): string {
  const core = stripCasualLead(ideaText).slice(0, 110)
  const loc = location.length > 70 ? `${location.slice(0, 67)}…` : location
  const text = `Proponujemy realizację zadania „${title}”: ${core.charAt(0).toLowerCase()}${core.slice(1)}. Miejsce realizacji: ${loc}.`
  return text.slice(0, 250)
}

/**
 * Deterministic BO assistant — used until Cursor/OpenAI path is available.
 * Writes in official applicant voice (no “autor wskazał”).
 */
export function mockRunBoAgent(raw: BoAgentInput): BoAgentProposal {
  const input = boAgentInputSchema.parse(raw)
  const ideaClean = correctTypos(input.ideaText)
  const comments = input.neighborComments
    ? correctTypos(input.neighborComments.trim())
    : undefined
  const location = normalizeApplicationLocation(
    input.location ? correctTypos(input.location) : undefined,
  )

  const scope = guessScope(ideaClean)
  const projectType = guessProjectType(ideaClean)
  const costItems = guessCostItems(ideaClean)
  const title = formalTitle(ideaClean)
  const summary = formalSummary(title, ideaClean, location)

  const scopePhrase = stripCasualLead(ideaClean)
  const description = [
    `W okolicy realizacji zadania brakuje elementów małej architektury i zagospodarowania odpowiadających potrzebom mieszkańców.`,
    `Proponujemy zakres obejmujący: ${scopePhrase.charAt(0).toLowerCase()}${scopePhrase.slice(1)}. Efekty będą ogólnodostępne i nieodpłatne.`,
    comments
      ? `W projekcie uwzględniamy potrzeby mieszkańców okolicy, w tym: ${comments}`
      : `Zadanie wzmocni jakość przestrzeni wspólnej i codzienny komfort korzystania z niej.`,
    `Szczegółowy zakres, potwierdzenie lokalizacji na gruntach Gminy Miejskiej Kraków oraz koszty utrzymania zostaną doprecyzowane na etapie weryfikacji miejskiej.`,
  ].join('\n\n')

  const justification =
    scope === 'city'
      ? 'Celem zadania jest poprawa jakości ogólnodostępnej infrastruktury lub oferty społecznej służącej mieszkańcom wielu części Krakowa. Zadanie ma charakter nieodpłatny i otwarty.'
      : 'Celem zadania jest odpowiedź na lokalną potrzebę mieszkańców okolicy. Propozycja ma charakter ogólnodostępny i nieodpłatny. Teren realizacji powinien należeć lub pozostawać we władaniu Gminy Miejskiej Kraków.'

  void buildCityRulesContext()
  void AGENT_PROMPT_VERSION

  const proposal = polishProposal({
    scope,
    projectType,
    title,
    summary:
      summary.length >= 60
        ? summary
        : `Proponujemy realizację zadania „${title}” w miejscu: ${location}.`.slice(
            0,
            250,
          ),
    location,
    description,
    justification,
    targetGroups: ['Mieszkańcy okolicy', 'Rodziny z dziećmi', 'Seniorzy'],
    accessibility:
      'Efekty zadania będą dostępne nieodpłatnie dla mieszkańców zgodnie z kryterium ogólnodostępności Budżetu Obywatelskiego.',
    costItems,
    schedule: [
      {
        name: 'Przygotowanie',
        description: 'Uzgodnienia lokalizacji i przygotowanie dokumentacji.',
        date: null,
      },
      {
        name: 'Realizacja',
        description: 'Wykonanie zakresu propozycji zadania.',
        date: null,
      },
    ],
    missingInformation: [
      ...(costItems.length === 0
        ? ['Brak rozpoznanych pozycji z katalogu — uzupełnij kosztorys']
        : []),
      'Koszt przygotowania terenu / dokumentacji (jeśli inwestycja)',
      'Koszt utrzymania po realizacji',
      'Dokładny numer działki po sprawdzeniu w MSIP',
    ],
    warnings: [
      'Przed złożeniem potwierdź w MSIP, że teren należy lub pozostaje we władaniu Gminy Miejskiej Kraków.',
      'Lajki w aplikacji nie zastępują podpisów na oficjalnej liście poparcia.',
    ],
    checklist: [
      {
        id: 'tmp_a',
        label: 'placeholder',
        required: true,
        reason: 'Zastępowane przez polishProposal / buildBoChecklist.',
      },
      {
        id: 'tmp_b',
        label: 'placeholder',
        required: true,
        reason: 'Zastępowane przez polishProposal / buildBoChecklist.',
      },
    ],
    generator: 'mock',
  })

  if (proposal.costItems.length > 0) {
    const costs = calculateCosts(proposal.costItems)
    proposal.warnings.push(
      `Szacunek z katalogu: ${formatPlnRange(costs.totalMinPln, costs.totalMaxPln)}. ${costs.disclaimer}`,
    )
  }

  return proposal
}
