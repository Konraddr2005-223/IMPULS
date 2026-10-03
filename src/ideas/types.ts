export type IdeaRecord = {
  id: string
  city_id: string
  author_id: string
  title: string
  description: string
  category: string | null
  district_code: string | null
  photo_path: string | null
  support_threshold: number
  likes_count: number
  revision: number
  status: string
  lat: number
  lng: number
  created_at: string
}

export type CreateIdeaInput = {
  title: string
  description: string
  category: 'investment' | 'non_investment'
  lat: number
  lng: number
  districtCode?: string
  supportThreshold: number
}
