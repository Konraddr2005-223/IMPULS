import { describe, expect, it } from 'vitest'
import { brand, colors, radii, typography } from './tokens'

describe('design tokens', () => {
  it('matches the visual style from the specification', () => {
    expect(colors.background).toBe('#F7F8FA')
    expect(colors.text).toBe('#17212B')
    expect(colors.ideas).toBe('#176B4B')
    expect(colors.action).toBe('#2457D6')
    expect(radii.cardPx).toBe(12)
    expect(typography.baseFontSizePx).toBe(16)
  })

  it('exposes the product brand and tagline', () => {
    expect(brand.name).toBe('Sąsiedzki')
    expect(brand.tagline).toBe('Pomysł z okolicy. Wspólne działanie.')
  })
})
