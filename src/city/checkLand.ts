import { krakowAdapter } from './index'
import { readLandCache, writeLandCache } from './landCache'
import type { GeoPoint, LandAssessment } from './types'
import { tryLiveLandAssessment } from './wmsFeatureInfo'

/** Prefer cache → live WMS → synthetic demo adapter. */
export async function checkLand(point: GeoPoint): Promise<LandAssessment> {
  try {
    const cached = await readLandCache(point)
    if (cached) return cached
  } catch {
    // ignore cache errors
  }

  try {
    const live = await tryLiveLandAssessment(point)
    if (live) {
      void writeLandCache(point, live)
      return live
    }
  } catch {
    // fall through to demo
  }

  // Demo / unavailable — do not pollute 24h live cache
  return krakowAdapter.checkLocation(point)
}
