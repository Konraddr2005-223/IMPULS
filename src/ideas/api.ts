import { supabase } from '../lib/supabase'
import { pointWkt } from './geo'
import type { CreateIdeaInput, IdeaRecord } from './types'

type IdeaRow = IdeaRecord

export async function fetchPublishedIdeas(): Promise<IdeaRecord[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ideas')
    .select(
      'id, city_id, author_id, title, description, category, district_code, photo_path, support_threshold, likes_count, revision, status, lat, lng, created_at',
    )
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data as IdeaRow[] | null) ?? []).filter(
    (idea) => typeof idea.lat === 'number' && typeof idea.lng === 'number',
  )
}

export async function createIdea(
  authorId: string,
  input: CreateIdeaInput,
): Promise<IdeaRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      city_id: 'krakow',
      author_id: authorId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      location: pointWkt(input.lat, input.lng),
      district_code: input.districtCode?.trim() || null,
      support_threshold: input.supportThreshold,
      status: 'published',
    })
    .select(
      'id, city_id, author_id, title, description, category, district_code, photo_path, support_threshold, likes_count, revision, status, lat, lng, created_at',
    )
    .single()

  if (error) throw error

  const idea = data as IdeaRow
  if (typeof idea.lat !== 'number' || typeof idea.lng !== 'number') {
    throw new Error(
      'Zapisano pomysł, ale brak lat/lng. Uruchom migrację 20261003183000_ideas_lat_lng.sql.',
    )
  }
  return idea
}
