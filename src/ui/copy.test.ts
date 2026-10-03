import { describe, expect, it } from 'vitest'
import { copy } from './copy'

describe('UI copy from specification §5', () => {
  it('includes required disclaimers', () => {
    expect(copy.likeDisclaimer).toMatch(/nie jest podpis/i)
    expect(copy.documentDisclaimer).toMatch(/miejskim systemie/i)
    expect(copy.landDisclaimer).toMatch(/poglądowa/i)
    expect(copy.faultDisclaimer).toMatch(/nie zostało przekazane/i)
  })
})
