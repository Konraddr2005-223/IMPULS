import { describe, expect, it } from 'vitest'
import { FALLBACK_EXAMPLE_APPLICATION, isFallbackExample } from './fallbackExample'
import { formatApplicationPlainText } from './formatDocument'
import { mockGenerateApplication } from './mockGenerate'
import type { IdeaRecord } from '../ideas/types'

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

describe('formatApplicationPlainText', () => {
  it('includes title, summary and cost lines for clipboard export', () => {
    const doc = mockGenerateApplication({
      idea,
      selectedComments: [],
      costItems: [{ catalogId: 'bench_backrest_installation', quantity: 2 }],
    })
    const text = formatApplicationPlainText(doc)
    expect(text).toContain(doc.title)
    expect(text).toContain('Kosztorys')
    expect(text).toContain('Generator: mock')
  })
})

describe('fallback example', () => {
  it('is marked as emergency example', () => {
    expect(isFallbackExample(FALLBACK_EXAMPLE_APPLICATION)).toBe(true)
    expect(FALLBACK_EXAMPLE_APPLICATION.summary.length).toBeGreaterThanOrEqual(60)
  })
})
