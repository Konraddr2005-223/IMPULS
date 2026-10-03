import { pointWkt } from '../ideas/geo'
import { supabase } from '../lib/supabase'
import type {
  CreateFaultInput,
  FaultRecord,
  FaultStatus,
  FaultStatusEvent,
} from './types'

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

export async function fetchFaultStatusHistory(
  faultId: string,
): Promise<FaultStatusEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('fault_status_events')
    .select(
      'id, fault_id, from_status, to_status, source, actor_id, note, created_at',
    )
    .eq('fault_id', faultId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as FaultStatusEvent[]) ?? []
}

export async function updateFaultStatus(input: {
  faultId: string
  actorId: string
  nextStatus: FaultStatus
  note?: string
  /** Mark city repair as simulation-only. */
  source?: string
}): Promise<FaultRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data: current, error: readErr } = await supabase
    .from('faults')
    .select(
      'id, city_id, author_id, category, description, status, status_source, photo_path, external_reference, lat, lng, created_at',
    )
    .eq('id', input.faultId)
    .single()
  if (readErr) throw readErr

  const fromStatus = current.status as string
  const source =
    input.source ??
    (input.nextStatus === 'city_repair_sim' ? 'simulation' : 'author')

  const { data, error } = await supabase
    .from('faults')
    .update({
      status: input.nextStatus,
      status_source: source,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.faultId)
    .eq('author_id', input.actorId)
    .select(
      'id, city_id, author_id, category, description, status, status_source, photo_path, external_reference, lat, lng, created_at',
    )
    .single()
  if (error) throw error

  const { error: histErr } = await supabase.from('fault_status_events').insert({
    fault_id: input.faultId,
    from_status: fromStatus,
    to_status: input.nextStatus,
    source,
    actor_id: input.actorId,
    note:
      input.note ??
      (input.nextStatus === 'city_repair_sim'
        ? 'Status demonstracyjny — nie potwierdzony przez urząd.'
        : null),
  })
  if (histErr) throw histErr

  return data as FaultRecord
}

export const FAULT_STATUS_LABELS: Record<string, string> = {
  new: 'Nowe',
  community_confirmed: 'Potwierdzone przez społeczność',
  author_resolved: 'Autor zgłosił usunięcie',
  city_repair_sim: 'W naprawie przez miasto (symulacja)',
}
