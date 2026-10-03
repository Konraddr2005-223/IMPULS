import type { IdeaRecord } from './types'

export type IdeaListFilters = {
  district: string
  category: '' | 'investment' | 'non_investment'
  minLikes: number
}

export const emptyIdeaFilters: IdeaListFilters = {
  district: '',
  category: '',
  minLikes: 0,
}

/** Client-side list filters (role B). Spatial “moje okolice” stays separate. */
export function filterIdeas(
  ideas: IdeaRecord[],
  filters: IdeaListFilters,
): IdeaRecord[] {
  return ideas.filter((idea) => {
    if (filters.district) {
      const d = (idea.district_code ?? '').toLowerCase()
      if (!d.includes(filters.district.trim().toLowerCase())) return false
    }
    if (filters.category && idea.category !== filters.category) return false
    if (filters.minLikes > 0 && idea.likes_count < filters.minLikes) return false
    return true
  })
}

export function uniqueDistricts(ideas: IdeaRecord[]): string[] {
  const set = new Set<string>()
  for (const idea of ideas) {
    if (idea.district_code?.trim()) set.add(idea.district_code.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pl'))
}
