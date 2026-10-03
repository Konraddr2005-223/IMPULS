import { describe, expect, it } from 'vitest'
import { setLike, fetchMyLikedIdeaIds } from './likes'

describe('likes API surface', () => {
  it('exports setLike and fetchMyLikedIdeaIds', () => {
    expect(typeof setLike).toBe('function')
    expect(typeof fetchMyLikedIdeaIds).toBe('function')
  })
})
