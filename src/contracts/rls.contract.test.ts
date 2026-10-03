import { describe, expect, it } from 'vitest'
import initSql from '../../supabase/migrations/20261003180000_init_schema.sql?raw'

/**
 * Contract checks for role B RLS expectations.
 * Parses committed SQL so CI fails if critical policies disappear.
 */
describe('Supabase RLS contracts (role B)', () => {
  it('enables RLS on core tables', () => {
    const lower = initSql.toLowerCase()
    for (const table of [
      'ideas',
      'idea_likes',
      'comments',
      'faults',
      'applications',
      'interest_areas',
      'notifications',
      'profiles',
    ]) {
      expect(lower).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it('scopes idea updates to author', () => {
    expect(initSql.toLowerCase()).toMatch(/ideas[\s\S]*author_id\s*=\s*auth\.uid\(\)/)
  })

  it('keeps idea likes unique per user', () => {
    expect(initSql.toLowerCase()).toMatch(
      /idea_likes[\s\S]*primary key\s*\(\s*idea_id\s*,\s*user_id\s*\)/,
    )
  })

  it('restricts application reads to author by default', () => {
    const lower = initSql.toLowerCase()
    expect(lower).toContain('applications')
    expect(lower).toMatch(/applications[\s\S]*author_id\s*=\s*auth\.uid\(\)/)
  })
})
