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
})
