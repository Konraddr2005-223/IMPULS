import { describe, expect, it } from 'vitest'
import {
  KRAKOW_CENTER,
  KRAKOW_DEFAULT_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from './krakow'

describe('Kraków map defaults', () => {
  it('centers near the Main Market Square', () => {
    expect(KRAKOW_CENTER.lat).toBeCloseTo(50.06, 1)
    expect(KRAKOW_CENTER.lng).toBeCloseTo(19.94, 1)
    expect(KRAKOW_DEFAULT_ZOOM).toBeGreaterThanOrEqual(12)
  })

  it('uses OSM tiles with attribution', () => {
    expect(OSM_TILE_URL).toContain('openstreetmap.org')
    expect(OSM_ATTRIBUTION.toLowerCase()).toContain('openstreetmap')
  })
})
