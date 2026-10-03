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

export type CreateFaultInput = {
  category: string
  description: string
  lat: number
  lng: number
}
