import { supabase } from '../lib/supabase'
import type { GeoPoint, LandAssessment } from './types'

const CACHE_HOURS = 24

type LandCheckRow = {
  id: string
  source_mode: string
  ownership_json: Record<string, unknown> | null
  planning_json: Record<string, unknown> | null
  assessment: string
  ownership_updated_at: string | null
  planning_updated_at: string | null
  retrieved_at: string
}

function approxEqual(a: number, b: number, eps = 1e-5) {
  return Math.abs(a - b) < eps
}

export async function readLandCache(
  point: GeoPoint,
): Promise<LandAssessment | null> {
  if (!supabase) return null
  const since = new Date(Date.now() - CACHE_HOURS * 3600 * 1000).toISOString()

  const { data, error } = await supabase
    .from('land_checks')
    .select(
      'id, source_mode, ownership_json, planning_json, assessment, ownership_updated_at, planning_updated_at, retrieved_at, location',
    )
    .gte('retrieved_at', since)
    .order('retrieved_at', { ascending: false })
    .limit(40)

  if (error || !data) return null

  for (const row of data as (LandCheckRow & { location: unknown })[]) {
    const coords = parsePoint(row.location)
    if (!coords) continue
    if (!approxEqual(coords.lat, point.lat) || !approxEqual(coords.lng, point.lng)) {
      continue
    }
    return rowToAssessment(row)
  }
  return null
}

/** Persist only live (or verified) assessments — not pure demo/unavailable misses. */
export async function writeLandCache(
  point: GeoPoint,
  assessment: LandAssessment,
  ideaId?: string | null,
): Promise<void> {
  if (!supabase) return
  if (assessment.mode !== 'live' && assessment.mode !== 'verified_snapshot') {
    return
  }
  const { error } = await supabase.from('land_checks').insert({
    idea_id: ideaId ?? null,
    location: `SRID=4326;POINT(${point.lng} ${point.lat})`,
    source_mode: assessment.mode,
    ownership_json: {
      class: assessment.ownershipClass,
      raw: assessment.ownershipRawLabel,
      parcelId: assessment.parcelId,
      warnings: assessment.warnings,
      scenarioDescription: assessment.scenarioDescription,
    },
    planning_json: assessment.planning,
    assessment: assessment.assessment,
    ownership_updated_at: assessment.ownershipUpdatedAt,
    planning_updated_at: assessment.planningUpdatedAt,
    retrieved_at: assessment.retrievedAt,
  })
  if (error) {
    // RLS / network — ignore; form must still work
    console.warn('land_checks cache write failed', error.message)
  }
}

function parsePoint(location: unknown): GeoPoint | null {
  if (
    location &&
    typeof location === 'object' &&
    (location as { type?: string }).type === 'Point'
  ) {
    const c = (location as { coordinates: [number, number] }).coordinates
    return { lng: c[0], lat: c[1] }
  }
  return null
}

function rowToAssessment(row: LandCheckRow): LandAssessment {
  const ownership = row.ownership_json ?? {}
  const planning = (row.planning_json ?? {}) as LandAssessment['planning']
  const cachedWarnings = Array.isArray(ownership.warnings)
    ? (ownership.warnings as string[])
    : []
  return {
    mode: 'cache',
    parcelId: (ownership.parcelId as string | null) ?? null,
    ownershipClass: (ownership.class as LandAssessment['ownershipClass']) ?? 'unknown',
    ownershipRawLabel: (ownership.raw as string | null) ?? null,
    planning: {
      planName: planning.planName ?? null,
      designation: planning.designation ?? null,
      resolutionUrl: planning.resolutionUrl ?? null,
    },
    assessment: row.assessment as LandAssessment['assessment'],
    warnings: [
      'Wynik z lokalnego cache land_checks (≤24 h).',
      'Informacja poglądowa. Ostateczną możliwość realizacji ocenia miasto.',
      ...cachedWarnings,
    ],
    retrievedAt: row.retrieved_at,
    ownershipUpdatedAt: row.ownership_updated_at,
    planningUpdatedAt: row.planning_updated_at,
    scenarioDescription:
      (ownership.scenarioDescription as string | undefined) ??
      'Cache odczytu terenu.',
  }
}
