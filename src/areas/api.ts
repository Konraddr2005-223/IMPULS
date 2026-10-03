import { pointWkt } from '../ideas/geo'
import { supabase } from '../lib/supabase'
import {
  calculateCentroid,
  isPointInPolygon,
  sortPointsClockwise,
  type LatLngPoint,
} from './polygon'

export type InterestArea = {
  id: string
  user_id: string
  city_id: string
  name: string
  kind: 'district' | 'radius' | 'polygon'
  district_code: string | null
  lat: number | null
  lng: number | null
  radius_m: number | null
  polygon_points?: LatLngPoint[] | null
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
    .select('id, user_id, city_id, name, kind, district_code, lat, lng, radius_m, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const rawList = (data as Record<string, unknown>[]) ?? []
  return rawList.map((row) => {
    let polygonPoints: LatLngPoint[] | null = null
    let kind = (row.kind as 'district' | 'radius' | 'polygon') || 'district'

    if (row.polygon_points && Array.isArray(row.polygon_points)) {
      polygonPoints = row.polygon_points as LatLngPoint[]
      kind = 'polygon'
    } else if (
      typeof row.district_code === 'string' &&
      row.district_code.startsWith('POLY:')
    ) {
      try {
        polygonPoints = JSON.parse(row.district_code.slice(5))
        kind = 'polygon'
      } catch {
        polygonPoints = null
      }
    }

    let lat = (row.lat as number | null) ?? null
    let lng = (row.lng as number | null) ?? null
    if ((lat == null || lng == null) && polygonPoints && polygonPoints.length > 0) {
      const c = calculateCentroid(polygonPoints)
      lat = c.lat
      lng = c.lng
    }

    return {
      id: row.id as string,
      user_id: row.user_id as string,
      city_id: row.city_id as string,
      name: row.name as string,
      kind,
      district_code: row.district_code as string | null,
      lat,
      lng,
      radius_m: (row.radius_m as number | null) ?? null,
      polygon_points: polygonPoints,
      created_at: (row.created_at as string) ?? '',
    }
  })
}

export async function createPolygonArea(
  userId: string,
  name: string,
  points: LatLngPoint[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  if (points.length < 3 || points.length > 4) {
    throw new Error('Wielokąt musi posiadać od 3 do 4 wierzchołków (maksymalnie czworokąt).')
  }
  const sorted = sortPointsClockwise(points)
  const centroid = calculateCentroid(sorted)
  const polyEncoded = 'POLY:' + JSON.stringify(sorted)

  let firstError: unknown = null
  try {
    const { error } = await supabase.from('interest_areas').insert({
      user_id: userId,
      city_id: 'krakow',
      name,
      kind: 'polygon',
      district_code: polyEncoded,
      polygon_points: sorted,
      center: pointWkt(centroid.lat, centroid.lng),
      lat: centroid.lat,
      lng: centroid.lng,
      radius_m: null,
    })
    if (!error) return
    firstError = error
  } catch (err) {
    firstError = err
  }

  // Resilient fallback for databases where kind check or polygon_points column is not migrated yet
  const { error: fallbackError } = await supabase.from('interest_areas').insert({
    user_id: userId,
    city_id: 'krakow',
    name,
    kind: 'district',
    district_code: polyEncoded,
    center: pointWkt(centroid.lat, centroid.lng),
    lat: centroid.lat,
    lng: centroid.lng,
    radius_m: null,
  })
  if (fallbackError) {
    throw firstError instanceof Error ? firstError : fallbackError
  }
}

export async function updatePolygonArea(
  id: string,
  userId: string,
  name: string,
  points: LatLngPoint[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  if (points.length < 3 || points.length > 4) {
    throw new Error('Wielokąt musi posiadać od 3 do 4 wierzchołków (maksymalnie czworokąt).')
  }
  const sorted = sortPointsClockwise(points)
  const centroid = calculateCentroid(sorted)
  const polyEncoded = 'POLY:' + JSON.stringify(sorted)

  let firstError: unknown = null
  try {
    const { error } = await supabase
      .from('interest_areas')
      .update({
        name,
        kind: 'polygon',
        district_code: polyEncoded,
        polygon_points: sorted,
        center: pointWkt(centroid.lat, centroid.lng),
        lat: centroid.lat,
        lng: centroid.lng,
        radius_m: null,
      })
      .eq('id', id)
      .eq('user_id', userId)
    if (!error) return
    firstError = error
  } catch (err) {
    firstError = err
  }

  // Resilient fallback for unmigrated database
  const { error: fallbackError } = await supabase
    .from('interest_areas')
    .update({
      name,
      kind: 'district',
      district_code: polyEncoded,
      center: pointWkt(centroid.lat, centroid.lng),
      lat: centroid.lat,
      lng: centroid.lng,
      radius_m: null,
    })
    .eq('id', id)
    .eq('user_id', userId)
  if (fallbackError) {
    throw firstError instanceof Error ? firstError : fallbackError
  }
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

export async function deleteInterestArea(id: string, userId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('interest_areas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/**
 * Checks if idea matches user interest areas.
 * Matches if idea is inside any polygon area, district matches, or inside radius.
 */
export function ideaMatchesAreas(
  idea: { district_code: string | null; lat: number; lng: number },
  areas: InterestArea[],
): boolean {
  if (areas.length === 0) return true

  for (const area of areas) {
    if (area.kind === 'polygon' && area.polygon_points && area.polygon_points.length >= 3) {
      if (isPointInPolygon({ lat: idea.lat, lng: idea.lng }, area.polygon_points)) {
        return true
      }
    }
    if (
      area.kind === 'district' &&
      area.district_code &&
      !area.district_code.startsWith('POLY:')
    ) {
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
