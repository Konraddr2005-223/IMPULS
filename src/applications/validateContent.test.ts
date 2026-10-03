import { describe, expect, it } from 'vitest'
import { mockGenerateApplication } from './mockGenerate'
import { validateApplicationContent } from './validateContent'
import type { IdeaRecord } from '../ideas/types'
import { BO_SYSTEM_PROMPT } from './systemPrompt'
import { MAX_GENERATIONS_PER_IDEA, MAX_SELECTED_COMMENTS } from './api'

const idea: IdeaRecord = {
  id: 'i1',
  city_id: 'krakow',
  author_id: 'a1',
  title: 'Zielony zakątek z ławkami',
  description: 'Dwie ławki i cztery drzewa przy trasie spacerowej w Krowodrzy.',
  category: 'investment',
  district_code: 'Krowodrza',
  photo_path: null,
  support_threshold: 3,
  likes_count: 3,
  revision: 1,
  status: 'published',
  lat: 50.07,
  lng: 19.91,
  created_at: '2026-10-03T00:00:00Z',
}

describe('role C generator controls', () => {
  it('exposes BO system prompt and generation limits', () => {
    expect(BO_SYSTEM_PROMPT).toMatch(/Budżetu Obywatelskiego/)
    expect(MAX_GENERATIONS_PER_IDEA).toBe(3)
    expect(MAX_SELECTED_COMMENTS).toBe(20)
  })

  it('validates title and summary limits from Kraków template', () => {
    const doc = mockGenerateApplication({
      idea,
      selectedComments: [],
      costItems: [{ catalogId: 'bench_backrest_installation', quantity: 2 }],
    })
    const ok = validateApplicationContent(doc)
    expect(ok.ok).toBe(true)

    const bad = validateApplicationContent({
      ...doc,
      title: 'x'.repeat(61),
      summary: 'za krótki',
    })
    expect(bad.ok).toBe(false)
    expect(bad.errors.length).toBeGreaterThan(0)
  })
})
