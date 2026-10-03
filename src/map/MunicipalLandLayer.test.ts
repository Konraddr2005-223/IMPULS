import { describe, expect, it } from 'vitest'
import {
  MUNICIPAL_LAND_EXPORT_URL,
  MUNICIPAL_OWNERSHIP_WHERE,
  buildMunicipalExportUrl,
} from './MunicipalLandLayer'

describe('MunicipalLandLayer export', () => {
  it('filters only pure GK = 11 municipal ownership', () => {
    expect(MUNICIPAL_OWNERSHIP_WHERE).toBe('gr_wl_ag = 11')
  })

  it('targets the MSIP ownership MapServer export endpoint', () => {
    expect(MUNICIPAL_LAND_EXPORT_URL).toContain(
      'K01_GR_WLASNOSCI/MapServer/export',
    )
    expect(MUNICIPAL_LAND_EXPORT_URL).toContain('/arcgis/rest/')
  })

  it('builds a Web Mercator (EPSG:3857) image request for a Kraków viewport', () => {
    const { url, bounds } = buildMunicipalExportUrl(
      { west: 19.94, south: 50.05, east: 19.96, north: 50.065 },
      { width: 800, height: 600 },
    )

    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(MUNICIPAL_LAND_EXPORT_URL)
    expect(parsed.searchParams.get('f')).toBe('image')
    expect(parsed.searchParams.get('format')).toBe('png32')
    expect(parsed.searchParams.get('transparent')).toBe('true')
    expect(parsed.searchParams.get('bboxSR')).toBe('3857')
    expect(parsed.searchParams.get('imageSR')).toBe('3857')
    expect(parsed.searchParams.get('size')).toBe('800,600')

    const bbox = parsed.searchParams.get('bbox')
    expect(bbox).toBeTruthy()
    const [xmin, ymin, xmax, ymax] = bbox!.split(',').map(Number)
    // Rough Web Mercator for Kraków (~19.9E / ~50.05N)
    expect(xmin).toBeGreaterThan(2_200_000)
    expect(xmax).toBeGreaterThan(xmin)
    expect(ymin).toBeGreaterThan(6_400_000)
    expect(ymax).toBeGreaterThan(ymin)

    const dynamic = JSON.parse(parsed.searchParams.get('dynamicLayers')!)
    expect(dynamic).toHaveLength(1)
    expect(dynamic[0].definitionExpression).toBe('gr_wl_ag = 11')
    expect(dynamic[0].drawingInfo.renderer.symbol.color[2]).toBe(110) // navy B
    expect(dynamic[0].minScale).toBe(0)
    expect(dynamic[0].maxScale).toBe(0)

    expect(bounds).toEqual([
      [50.05, 19.94],
      [50.065, 19.96],
    ])
  })

  it('clamps export pixel size into 256..1280', () => {
    const tiny = buildMunicipalExportUrl(
      { west: 19.94, south: 50.05, east: 19.95, north: 50.06 },
      { width: 10, height: 10 },
    )
    expect(new URL(tiny.url).searchParams.get('size')).toBe('256,256')

    const huge = buildMunicipalExportUrl(
      { west: 19.94, south: 50.05, east: 19.95, north: 50.06 },
      { width: 4000, height: 3000 },
    )
    expect(new URL(huge.url).searchParams.get('size')).toBe('1280,1280')
  })
})
