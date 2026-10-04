import { krakowAdapter } from './index'
import { readLandCache, writeLandCache } from './landCache'
import { tryMsipOwnershipAssessment } from './msipOwnership'
import type { GeoPoint, LandAssessment } from './types'
import { tryLiveLandAssessment } from './wmsFeatureInfo'

/** Prefer cache → MSIP ownership → live WMS → synthetic demo adapter. */
export async function checkLand(point: GeoPoint): Promise<LandAssessment> {
  try {
    const cached = await readLandCache(point)
    if (cached) return cached
  } catch {
    // ignore cache errors
  }

  try {
    const msip = await tryMsipOwnershipAssessment(point)
    if (msip) {
      void writeLandCache(point, msip)
      return msip
    }
  } catch {
    // fall through
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
