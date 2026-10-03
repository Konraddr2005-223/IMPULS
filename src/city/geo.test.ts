import { describe, expect, it } from 'vitest'
import { distanceMeters } from './geo'

describe('distanceMeters', () => {
  it('returns ~0 for identical points', () => {
    expect(distanceMeters({ lat: 50.06, lng: 19.94 }, { lat: 50.06, lng: 19.94 })).toBe(0)
  })

  it('measures a short Kraków offset in tens of metres', () => {
    const a = { lat: 50.06143, lng: 19.93658 }
    const b = { lat: 50.06143, lng: 19.93758 }
    const d = distanceMeters(a, b)
    expect(d).toBeGreaterThan(50)
    expect(d).toBeLessThan(120)
  })
})
