import { describe, expect, it } from 'vitest'
import { isSupabaseConfigured } from './supabase'

describe('supabase config', () => {
  it('reports configuration from Vite env (may be unset in CI)', () => {
    expect(typeof isSupabaseConfigured).toBe('boolean')
  })
})
