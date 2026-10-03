import { describe, expect, it } from 'vitest'
import { brand, colors, radii, typography } from './tokens'

describe('design tokens', () => {
  it('matches the Urban Civic Pulse visual style', () => {
    expect(colors.background).toBe('#f8f9ff')
    expect(colors.text).toBe('#0b1c30')
    expect(colors.primary).toBe('#eab308')
    expect(colors.ideas).toBe('#006c49')
    expect(colors.action).toBe('#0284c7')
    expect(radii.cardPx).toBe(12)
    expect(typography.baseFontSizePx).toBe(16)
  })

  it('exposes the product brand and tagline', () => {
    expect(brand.name).toBe('Sąsiedzki')
    expect(brand.tagline).toBe('Pomysł z okolicy. Wspólne działanie.')
  })
})
