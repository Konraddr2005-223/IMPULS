import { describe, expect, it } from 'vitest'
import { filterIdeas, uniqueDistricts, emptyIdeaFilters } from './filters'
import type { IdeaRecord } from './types'

function idea(partial: Partial<IdeaRecord> & Pick<IdeaRecord, 'id' | 'title'>): IdeaRecord {
  return {
    city_id: 'krakow',
    author_id: 'a',
    description: 'x',
    category: 'investment',
    district_code: 'Krowodrza',
    photo_path: null,
    support_threshold: 10,
    likes_count: 0,
    revision: 1,
    status: 'published',
    lat: 50,
    lng: 19,
    created_at: '2026-10-03T00:00:00Z',
    ...partial,
  }
}

describe('filterIdeas', () => {
  const sample = [
    idea({ id: '1', title: 'A', district_code: 'Krowodrza', likes_count: 2, category: 'investment' }),
    idea({ id: '2', title: 'B', district_code: 'Podgórze', likes_count: 12, category: 'investment' }),
    idea({
      id: '3',
      title: 'C',
      district_code: 'Nowa Huta',
      likes_count: 8,
      category: 'non_investment',
    }),
  ]

  it('returns all when filters empty', () => {
    expect(filterIdeas(sample, emptyIdeaFilters)).toHaveLength(3)
  })

  it('filters by district substring', () => {
    expect(filterIdeas(sample, { ...emptyIdeaFilters, district: 'pod' })).toEqual([
      sample[1],
    ])
  })

  it('filters by category and min likes', () => {
    const result = filterIdeas(sample, {
      district: '',
      category: 'investment',
      minLikes: 5,
    })
    expect(result.map((i) => i.id)).toEqual(['2'])
  })

  it('lists unique districts', () => {
    expect(uniqueDistricts(sample)).toEqual(['Krowodrza', 'Nowa Huta', 'Podgórze'])
  })
})
