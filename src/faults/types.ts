export type FaultStatus =
  | 'new'
  | 'community_confirmed'
  | 'author_resolved'
  | 'city_repair_sim'

export type FaultRecord = {
  id: string
  city_id: string
  author_id: string
  category: string
  description: string
  status: string
  status_source: string
  photo_path: string | null
  external_reference: string | null
  lat: number
  lng: number
  created_at: string
}

export type FaultStatusEvent = {
  id: string
  fault_id: string
  from_status: string | null
  to_status: string
  source: string
  actor_id: string | null
  note: string | null
  created_at: string
}

export type CreateFaultInput = {
  category: string
  description: string
  lat: number
  lng: number
}
