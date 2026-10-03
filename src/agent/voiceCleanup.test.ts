import { describe, expect, it } from 'vitest'
import { mockRunBoAgent } from './mockAgent'
import { polishProposal } from './polishProposal'
import type { BoAgentProposal } from './schema'
import {
  cleanupApplicationVoice,
  normalizeApplicationLocation,
  stripCoordinates,
  stripMetaVoice,
} from './voiceCleanup'

describe('stripCoordinates', () => {
  it('removes labeled and bare coordinate pairs', () => {
    expect(stripCoordinates('Dzielnica I · Współrzędne: 50.06143, 19.93722')).toBe(
      'Dzielnica I',
    )
    expect(stripCoordinates('50.0614, 19.9372')).toBe('')
  })
})

describe('stripMetaVoice', () => {
  it('removes autor-wskazał style phrases', () => {
    const cleaned = stripMetaVoice(
      'Autor wskazał lokalizację przy skwerze. Wskazane przez autora ławki.',
    )
    expect(cleaned.toLowerCase()).not.toMatch(/autor/)
    expect(cleaned.toLowerCase()).not.toMatch(/wskazan/)
  })
})

describe('normalizeApplicationLocation', () => {
  it('keeps human place names and rejects GPS-only blobs', () => {
    expect(normalizeApplicationLocation('Dzielnica Kazimierz')).toContain('Kazimierz')
    expect(normalizeApplicationLocation('Współrzędne: 50.06, 19.93')).toMatch(
      /okolica realizacji|Gminy Miejskiej/i,
    )
  })
})

describe('cleanupApplicationVoice', () => {
  it('strips meta voice and coordinates together', () => {
    const out = cleanupApplicationVoice(
      'Autor zgłosił pomysł przy 50.06143, 19.93722 w aplikacji Sąsiedzki.',
    )
    expect(out.toLowerCase()).not.toContain('autor')
    expect(out.toLowerCase()).not.toContain('sąsiedzki')
    expect(out).not.toMatch(/\d{2}\.\d{4}/)
  })
})

describe('proposal voice + location integration', () => {
  it('mock agent never emits autor-meta or GPS in location', () => {
    const proposal = mockRunBoAgent({
      ideaText: 'Zrobmy lawki dla mieszkancow',
      location: 'Współrzędne: 50.06143, 19.93722',
    })
    expect(proposal.location).not.toMatch(/\d{2}\.\d/)
    expect(proposal.location.toLowerCase()).not.toContain('współrzędne')
    const blob = `${proposal.description} ${proposal.justification} ${proposal.summary}`
    expect(blob.toLowerCase()).not.toMatch(/autor\s+wskazał/)
    expect(blob.toLowerCase()).not.toMatch(/przez autora/)
  })

  it('polishProposal strips meta voice and GPS from fields', () => {
    const polished = polishProposal({
      scope: 'district',
      projectType: 'investment',
      title: 'Ławki',
      summary:
        'Autor wskazał potrzebę ławek przy skwerze dla mieszkańców okolicy i seniorów.',
      location: 'Dzielnica: I · Współrzędne: 50.06143, 19.93722',
      description:
        'Wskazane przez autora ustawienie ławek przy głównej alei spacerowej w okolicy.',
      justification:
        'Zgodnie z pomysłem autora zadanie poprawi komfort mieszkańców przestrzeni publicznej.',
      targetGroups: ['Mieszkańcy'],
      accessibility:
        'Efekty zadania będą dostępne nieodpłatnie dla mieszkańców zgodnie z BO.',
      costItems: [],
      schedule: [
        { name: 'Montaż', description: 'Montaż ławek.', date: null },
        { name: 'Odbiór', description: 'Odbiór prac.', date: null },
      ],
      missingInformation: [],
      warnings: ['Sprawdź teren w MSIP'],
      checklist: [
        {
          id: 'a',
          label: 'placeholder a long enough',
          required: true,
          reason: 'placeholder reason long enough',
        },
        {
          id: 'b',
          label: 'placeholder b long enough',
          required: true,
          reason: 'placeholder reason two long enough',
        },
      ],
      generator: 'mock',
    } satisfies BoAgentProposal)

    expect(polished.location).not.toMatch(/\d{2}\.\d/)
    expect(polished.location.toLowerCase()).not.toContain('współrzędne')
    expect(polished.description.toLowerCase()).not.toMatch(/autor/)
    expect(polished.justification.toLowerCase()).not.toMatch(/autor/)
    expect(polished.summary.toLowerCase()).not.toMatch(/autor/)
  })
})
