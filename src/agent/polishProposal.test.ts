import { describe, expect, it } from 'vitest'
import { polishProposal } from './polishProposal'
import type { BoAgentProposal } from './schema'

function base(overrides: Partial<BoAgentProposal> = {}): BoAgentProposal {
  return {
    scope: 'district',
    projectType: 'investment',
    title: 'zróbmy lawki w parku',
    summary:
      'Chcemy postawic lawki w parku dla mieszkancow okolicy spacerujących z dziećmi i seniorami.',
    location: 'Park Jordana',
    description:
      'W parku brakuje miejsc do odpoczynku. Planujemy ustawienie lawek z oparciem przy glownej alei spacerowej, z zachowaniem ogolnodostepnosci.',
    justification:
      'Projekt odpowiada na lokalną potrzebę odpoczynku i integracji mieszkancow w przestrzeni publicznej.',
    targetGroups: ['Mieszkancy okolicy', 'Seniorzy'],
    accessibility:
      'Efekty projektu będą dostępne nieodpłatnie dla wszystkich mieszkancow.',
    costItems: [{ catalogId: 'bench_backrest_installation', quantity: 2 }],
    schedule: [
      {
        name: 'Montaz',
        description: 'Montaz lawek w lokalizacji.',
        date: null,
      },
    ],
    missingInformation: ['Numer dzialki'],
    warnings: [
      'Cursor SDK cloud warning',
      'Dokument roboczy z trybu mock (bez OpenAI)',
      'Sprawdź własność terenu w MSIP',
    ],
    checklist: [
      {
        id: 'x',
        label: 'placeholder',
        required: true,
        reason: 'placeholder reason for schema',
      },
      {
        id: 'y',
        label: 'placeholder2',
        required: false,
        reason: 'placeholder reason two for schema',
      },
    ],
    generator: 'mock',
    ...overrides,
  }
}

describe('polishProposal', () => {
  it('formalizes slang title, fixes typos, and replaces checklist', () => {
    const polished = polishProposal(base())
    expect(polished.title.toLowerCase()).not.toContain('zróbmy')
    expect(polished.title.toLowerCase()).toContain('ławk')
    expect(polished.description.toLowerCase()).toContain('ławek')
    expect(polished.targetGroups.join(' ').toLowerCase()).toContain('mieszkań')
    expect(polished.schedule.length).toBeGreaterThanOrEqual(1)
    expect(polished.checklist.map((c) => c.id)).toEqual(
      expect.arrayContaining(['msip_ownership', 'support_list', 'official_submit']),
    )
    expect(polished.warnings.some((w) => /cursor sdk/i.test(w))).toBe(false)
    expect(polished.warnings.some((w) => /mock/i.test(w))).toBe(false)
  })
})
