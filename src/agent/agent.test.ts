import { describe, expect, it } from 'vitest'
import { buildBoChecklist } from './checklist'
import { mockRunBoAgent } from './mockAgent'
import { boAgentProposalSchema } from './schema'

describe('buildBoChecklist', () => {
  it('always requires MSIP ownership check and support list', () => {
    const items = buildBoChecklist({
      title: 'Ławki w parku',
      description: 'Dwie ławki przy ścieżce.',
      justification: 'Potrzeba odpoczynku.',
      location: 'Park Jordana',
    })
    expect(items.map((i) => i.id)).toEqual(
      expect.arrayContaining(['msip_ownership', 'support_list', 'official_submit']),
    )
    expect(items.find((i) => i.id === 'institution_consent')).toBeUndefined()
  })

  it('adds institution consent when school is mentioned', () => {
    const items = buildBoChecklist({
      title: 'Warsztaty w szkole',
      description: 'Zajęcia w szkole podstawowej.',
      justification: 'Edukacja lokalna.',
      location: 'SP 12',
    })
    expect(items.some((i) => i.id === 'institution_consent')).toBe(true)
  })
})

describe('mockRunBoAgent', () => {
  it('returns schema-valid proposal with navy-safe catalog costs', () => {
    const proposal = mockRunBoAgent({
      ideaText: 'Zróbmy dwie ławki i cztery drzewa przy skwerze na Kazimierzu',
      location: 'Kazimierz',
      neighborComments: 'Zostaw miejsce na wózek',
    })
    expect(() => boAgentProposalSchema.parse(proposal)).not.toThrow()
    expect(proposal.generator).toBe('mock')
    expect(proposal.scope).toBe('district')
    expect(proposal.costItems.some((c) => c.catalogId === 'bench_backrest_installation')).toBe(
      true,
    )
    expect(proposal.costItems.some((c) => c.catalogId === 'tree_16_18_planting')).toBe(true)
    expect(proposal.checklist.length).toBeGreaterThanOrEqual(3)
    expect(proposal.summary.length).toBeGreaterThanOrEqual(60)
  })

  it('flags institution consent for przedszkole projects', () => {
    const proposal = mockRunBoAgent({
      ideaText: 'Warsztaty ogrodnicze przy przedszkolu na Prądniku',
    })
    expect(proposal.checklist.some((c) => c.id === 'institution_consent')).toBe(true)
  })
})
