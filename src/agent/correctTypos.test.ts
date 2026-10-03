import { describe, expect, it } from 'vitest'
import { correctTypos } from './correctTypos'
import { mockRunBoAgent } from './mockAgent'

describe('correctTypos', () => {
  it('fixes common Polish BO misspellings', () => {
    expect(correctTypos('inizjatywa lokalna')).toContain('inicjatywa')
    expect(correctTypos('budzet obywatelski')).toContain('budżet')
    expect(correctTypos('dwie lawki i sciezka')).toMatch(/ławki/)
    expect(correctTypos('dwie lawki i sciezka')).toMatch(/ścieżk/)
    expect(correctTypos('mieszkancow Krakowa')).toContain('mieszkańców')
    expect(correctTypos('plac zabab na kazimiezu')).toMatch(/plac zabaw/)
    expect(correctTypos('plac zabab na kazimiezu')).toMatch(/Kazimierzu/)
  })
})

describe('mockRunBoAgent typo path', () => {
  it('does not keep user typos in formal fields', () => {
    const proposal = mockRunBoAgent({
      ideaText: 'Zrobmy dwie lawki i sciezke dla mieszkancow na kazimiezu',
      location: 'kazimierz',
    })
    const blob = `${proposal.title} ${proposal.summary} ${proposal.description}`.toLowerCase()
    expect(blob).not.toContain('lawki')
    expect(blob).not.toContain('mieszkancow')
    expect(blob).not.toContain('inizjatyw')
    expect(proposal.schedule.length).toBeGreaterThanOrEqual(2)
    expect(proposal.projectType).toBe('investment')
  })
})
