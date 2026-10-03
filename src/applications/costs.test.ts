import { describe, expect, it } from 'vitest'
import { calculateCosts, formatPlnRange } from './costs'

describe('calculateCosts', () => {
  it('matches the spec example for two benches and four trees', () => {
    const summary = calculateCosts([
      { catalogId: 'bench_backrest_installation', quantity: 2 },
      { catalogId: 'tree_16_18_planting', quantity: 4 },
    ])
    expect(summary.totalMinPln).toBe(9795)
    expect(summary.totalMaxPln).toBe(16700)
    expect(formatPlnRange(summary.totalMinPln, summary.totalMaxPln)).toContain('9')
  })

  it('skips unknown catalog ids without inventing prices', () => {
    const summary = calculateCosts([
      { catalogId: 'unknown_widget', quantity: 10 },
      { catalogId: 'tree_16_18_planting', quantity: 1 },
    ])
    expect(summary.lines.map((l) => l.catalogId)).toEqual(['tree_16_18_planting'])
    expect(summary.totalMinPln).toBe(1500)
    expect(summary.totalMaxPln).toBe(1700)
  })
})
