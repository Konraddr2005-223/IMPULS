import { buildBoChecklist } from './checklist'
import { correctTypos, correctTyposInFields } from './correctTypos'
import { boAgentProposalSchema, type BoAgentProposal } from './schema'
import {
  cleanupApplicationVoice,
  normalizeApplicationLocation,
} from './voiceCleanup'

const SLANG_START =
  /^(zróbmy|zrób|chcemy|chciał[aeaby]bym|dajcie|poprośmy|zrobimy|trzeba|może)\s+/i

function cleanSpaces(text: string): string {
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function formalizeTitle(raw: string): string {
  let t = cleanSpaces(correctTypos(raw))
  t = cleanupApplicationVoice(t)
  t = t.replace(SLANG_START, '')
  t = t.replace(/[.!?…]+$/g, '')
  if (!t) t = 'Propozycja zadania sąsiedzkiego'
  t = t.charAt(0).toUpperCase() + t.slice(1)
  if (t.length > 60) t = `${t.slice(0, 57).trim()}…`
  return t
}

function userFacingWarnings(warnings: string[]): string[] {
  return warnings
    .map((w) => cleanupApplicationVoice(correctTypos(w)))
    .filter((w) => {
      const lower = w.toLowerCase()
      if (!w) return false
      if (lower.includes('cursor sdk')) return false
      if (lower.includes('trybu mock')) return false
      if (lower.includes('bez openai')) return false
      if (lower.includes('promptversion')) return false
      if (lower.includes('autor')) return false
      return true
    })
}

function defaultSchedule(projectType: 'investment' | 'non_investment') {
  if (projectType === 'non_investment') {
    return [
      {
        name: 'Przygotowanie i promocja',
        description:
          'Ustalenie terminów, rekrutacja uczestników, rezerwacja sali lub terenu.',
        date: null,
      },
      {
        name: 'Realizacja działań',
        description: 'Przeprowadzenie zaplanowanych zajęć lub wydarzeń.',
        date: null,
      },
      {
        name: 'Podsumowanie',
        description:
          'Ewaluacja i rozliczenie zgodnie z wymogami realizatora miejskiego.',
        date: null,
      },
    ]
  }
  return [
    {
      name: 'Przygotowanie dokumentacji',
      description:
        'Weryfikacja lokalizacji, uzgodnienia z dysponentem terenu, dokumentacja techniczna (jeśli wymagana).',
      date: null,
    },
    {
      name: 'Zakup i montaż',
      description: 'Dostawa urządzeń lub materiałów oraz montaż na miejscu realizacji.',
      date: null,
    },
    {
      name: 'Odbiór i udostępnienie',
      description:
        'Odbiór prac i udostępnienie efektów mieszkańcom zgodnie z zasadami ogólnodostępności BO.',
      date: null,
    },
  ]
}

function guessProjectType(blob: string): 'investment' | 'non_investment' {
  if (
    /warsztat|zajęcia|kurs|szkolen|wydarzen|piknik|festyn|koncert|spotkan/i.test(
      blob,
    )
  ) {
    return 'non_investment'
  }
  return 'investment'
}

/**
 * Normalize agent/mock output into a cleaner official BO draft:
 * typo fix, applicant voice, no GPS in location, deterministic checklist.
 */
export function polishProposal(proposal: BoAgentProposal): BoAgentProposal {
  const typed = correctTyposInFields(
    {
      title: proposal.title,
      summary: proposal.summary,
      location: proposal.location,
      description: proposal.description,
      justification: proposal.justification,
      accessibility: proposal.accessibility,
      targetGroups: proposal.targetGroups,
      missingInformation: proposal.missingInformation,
      warnings: proposal.warnings,
    },
    [
      'title',
      'summary',
      'location',
      'description',
      'justification',
      'accessibility',
      'targetGroups',
      'missingInformation',
      'warnings',
    ],
  )

  const title = formalizeTitle(typed.title)
  const description = cleanSpaces(cleanupApplicationVoice(typed.description))
  const justification = cleanSpaces(
    cleanupApplicationVoice(typed.justification),
  )
  const location = normalizeApplicationLocation(typed.location)
  const summary = cleanSpaces(cleanupApplicationVoice(typed.summary))
  const accessibility = cleanSpaces(
    cleanupApplicationVoice(typed.accessibility),
  )

  const projectType =
    proposal.projectType ??
    guessProjectType([title, description, justification].join('\n'))

  const schedule =
    Array.isArray(proposal.schedule) && proposal.schedule.length > 0
      ? proposal.schedule.map((s) => ({
          name: cleanSpaces(correctTypos(s.name)),
          description: cleanSpaces(
            cleanupApplicationVoice(correctTypos(s.description)),
          ),
          date: s.date,
        }))
      : defaultSchedule(projectType)

  const checklist = buildBoChecklist({
    title,
    description,
    justification,
    location,
  })

  const summarySafe =
    summary.length >= 60
      ? summary.slice(0, 250)
      : `Proponujemy realizację zadania „${title}” w ramach Budżetu Obywatelskiego Miasta Krakowa. Miejsce: ${location}.`.slice(
          0,
          250,
        )

  return boAgentProposalSchema.parse({
    ...proposal,
    projectType,
    title,
    summary: summarySafe,
    location,
    description:
      description.length >= 40
        ? description
        : `${description} Proponujemy uzupełnić szczegółowy opis zakresu przed złożeniem wniosku.`.slice(
            0,
            4000,
          ),
    justification:
      justification.length >= 40
        ? justification
        : `${justification} Zadanie odpowiada na lokalną potrzebę mieszkańców i ma charakter ogólnodostępny.`.slice(
            0,
            2000,
          ),
    targetGroups: typed.targetGroups
      .map((g) => cleanSpaces(correctTypos(g)))
      .filter(Boolean)
      .slice(0, 8),
    accessibility:
      accessibility.length >= 20
        ? accessibility
        : 'Efekty zadania będą dostępne nieodpłatnie dla mieszkańców zgodnie z kryterium ogólnodostępności Budżetu Obywatelskiego.',
    schedule,
    missingInformation: typed.missingInformation
      .map((i) => cleanSpaces(cleanupApplicationVoice(correctTypos(i))))
      .filter(Boolean),
    warnings: userFacingWarnings(typed.warnings),
    checklist,
  })
}
