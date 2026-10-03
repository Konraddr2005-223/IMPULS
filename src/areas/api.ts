import { pointWkt } from '../ideas/geo'
import { supabase } from '../lib/supabase'

export type InterestArea = {
  id: string
  user_id: string
  city_id: string
  name: string
  kind: 'district' | 'radius'
  district_code: string | null
  lat: number | null
  lng: number | null
  radius_m: number | null
  created_at: string
}

export const KRAKOW_DISTRICTS = [
  'Stare Miasto',
  'Grzegórzki',
  'Prądnik Czerwony',
  'Prądnik Biały',
  'Krowodrza',
  'Bronowice',
  'Zwierzyniec',
  'Dębniki',
  'Łagiewniki-Borek Fałęcki',
  'Swoszowice',
  'Podgórze Duchackie',
  'Bieżanów-Prokocim',
  'Podgórze',
  'Czyżyny',
  'Mistrzejowice',
  'Bieńczyce',
  'Wzgórza Krzesławickie',
  'Nowa Huta',
] as const

export async function listInterestAreas(userId: string): Promise<InterestArea[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('interest_areas')
    .select(
      'id, user_id, city_id, name, kind, district_code, lat, lng, radius_m, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as InterestArea[]) ?? []
}

export async function createDistrictArea(
  userId: string,
  districtCode: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.from('interest_areas').insert({
    user_id: userId,
    city_id: 'krakow',
    name: districtCode,
    kind: 'district',
    district_code: districtCode,
  })
  if (error) throw error
}

export async function createRadiusArea(
  userId: string,
  name: string,
  lat: number,
  lng: number,
  radiusM: number,
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  if (radiusM < 50 || radiusM > 2000) {
    throw new Error('Promień musi być w zakresie 50–2000 m.')
  }
  const { error } = await supabase.from('interest_areas').insert({
    user_id: userId,
    city_id: 'krakow',
    name,
    kind: 'radius',
    center: pointWkt(lat, lng),
    lat,
    lng,
    radius_m: radiusM,
  })
  if (error) throw error
}

export async function updateRadiusArea(
  id: string,
  userId: string,
  name: string,
  lat: number,
  lng: number,
  radiusM: number,
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  if (radiusM < 50 || radiusM > 2000) {
    throw new Error('Promień musi być w zakresie 50–2000 m.')
  }
  const { error } = await supabase
    .from('interest_areas')
    .update({
      name,
      center: pointWkt(lat, lng),
      lat,
      lng,
      radius_m: radiusM,
    })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function updateDistrictArea(
  id: string,
  userId: string,
  districtCode: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase
    .from('interest_areas')
    .update({
      name: districtCode,
      district_code: districtCode,
    })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteInterestArea(id: string, userId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('interest_areas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/** OR semantics: idea matches if district matches OR point in any radius. */
export function ideaMatchesAreas(
  idea: { district_code: string | null; lat: number; lng: number },
  areas: InterestArea[],
): boolean {
  if (areas.length === 0) return true

  for (const area of areas) {
    if (area.kind === 'district' && area.district_code) {
      if (
        idea.district_code &&
        idea.district_code.toLowerCase() === area.district_code.toLowerCase()
      ) {
        return true
      }
    }
    if (
      area.kind === 'radius' &&
      area.lat != null &&
      area.lng != null &&
      area.radius_m != null
    ) {
      const d = haversineM(idea.lat, idea.lng, area.lat, area.lng)
      if (d <= area.radius_m) return true
    }
  }
  return false
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(lat2 - lat1)
  const dLng = toR(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}
