import { krakowAdapter } from './index'
import type { GeoPoint, LandAssessment } from './types'
import { tryLiveLandAssessment } from './wmsFeatureInfo'

/** Prefer live WMS when reachable; otherwise synthetic demo adapter. */
export async function checkLand(point: GeoPoint): Promise<LandAssessment> {
  try {
    const live = await tryLiveLandAssessment(point)
    if (live) return live
  } catch {
    // fall through to demo
  }
  return krakowAdapter.checkLocation(point)
}
