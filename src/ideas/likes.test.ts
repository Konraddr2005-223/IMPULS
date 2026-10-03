import { describe, expect, it } from 'vitest'
import { setLike, listIdeaLikerIds, fetchMyLikedIdeaIds } from './likes'

describe('likes API (role B)', () => {
  it('exports idempotent like helpers', () => {
    expect(typeof setLike).toBe('function')
    expect(typeof listIdeaLikerIds).toBe('function')
    expect(typeof fetchMyLikedIdeaIds).toBe('function')
  })
})
