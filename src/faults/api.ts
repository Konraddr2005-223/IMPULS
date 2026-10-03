import { pointWkt } from '../ideas/geo'
import { supabase } from '../lib/supabase'
import type { CreateFaultInput, FaultRecord } from './types'

export async function fetchFaults(): Promise<FaultRecord[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('faults')
    .select(
      'id, city_id, author_id, category, description, status, status_source, photo_path, external_reference, lat, lng, created_at',
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data as FaultRecord[] | null) ?? []).filter(
    (f) => typeof f.lat === 'number' && typeof f.lng === 'number',
  )
}

export async function createFault(
  authorId: string,
  input: CreateFaultInput & { photoPath?: string | null },
): Promise<FaultRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('faults')
    .insert({
      city_id: 'krakow',
      author_id: authorId,
      category: input.category,
      description: input.description.trim(),
      location: pointWkt(input.lat, input.lng),
      photo_path: input.photoPath ?? null,
      status: 'new',
      status_source: 'author',
    })
    .select(
      'id, city_id, author_id, category, description, status, status_source, photo_path, external_reference, lat, lng, created_at',
    )
    .single()

  if (error) throw error
  return data as FaultRecord
}

export const FAULT_STATUS_LABELS: Record<string, string> = {
  new: 'Nowe',
  community_confirmed: 'Potwierdzone przez społeczność',
  author_resolved: 'Autor zgłosił usunięcie',
  city_repair_sim: 'W naprawie przez miasto (symulacja)',
}

export const FAULT_CATEGORY_LABELS: Record<string, string> = {
  street_furniture: 'Mała architektura',
  waste: 'Odpady',
  lighting: 'Oświetlenie',
  pavement: 'Nawierzchnia',
  other: 'Inne',
}

