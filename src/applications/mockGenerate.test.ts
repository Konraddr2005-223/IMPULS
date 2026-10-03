import { describe, expect, it } from 'vitest'
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

describe('mockGenerateApplication', () => {
  it('returns structured BO draft without inventing prices', () => {
    const doc = mockGenerateApplication({
      idea,
      selectedComments: [{ id: 'c1', body: 'Dodajcie też kosz.' }],
      costItems: [
        { catalogId: 'bench_backrest_installation', quantity: 2 },
        { catalogId: 'tree_16_18_planting', quantity: 4 },
      ],
    })
    expect(doc.generator).toBe('mock')
    expect(doc.title).toContain('Zielony')
    expect(doc.costItems).toHaveLength(2)
    expect(doc.warnings.some((w) => w.toLowerCase().includes('mock'))).toBe(true)
  })
})
