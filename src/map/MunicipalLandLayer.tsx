import { useEffect, useState } from 'react'
import { ImageOverlay, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngBoundsExpression } from 'leaflet'

/** MSIP ArcGIS MapServer — Struktura własności (działki). */
export const MUNICIPAL_LAND_EXPORT_URL =
  'https://msip.um.krakow.pl/arcgis/rest/services/Obserwatorium/K01_GR_WLASNOSCI/MapServer/export'

/**
 * Pure municipal ownership (GK — Gmina Kraków).
 * Source field: gr_wl_ag = 11 ("GK - Gmina Kraków").
 */
export const MUNICIPAL_OWNERSHIP_WHERE = 'gr_wl_ag = 11'

/** Navy — high contrast on OSM so municipal parcels stay readable. */
const MUNICIPAL_NAVY_RGBA: [number, number, number, number] = [20, 45, 110, 180]
const MUNICIPAL_NAVY_OUTLINE: [number, number, number, number] = [15, 35, 90, 240]

/** Dynamic layer: only GK=11, navy fill, visible at all scales. */
const DYNAMIC_LAYERS = [
  {
    id: 0,
    source: { type: 'mapLayer', mapLayerId: 0 },
    definitionExpression: MUNICIPAL_OWNERSHIP_WHERE,
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: {
          type: 'esriSFS',
          style: 'esriSFSSolid',
          color: MUNICIPAL_NAVY_RGBA,
          outline: {
            type: 'esriSLS',
            style: 'esriSLSSolid',
            color: MUNICIPAL_NAVY_OUTLINE,
            width: 1.5,
          },
        },
      },
    },
    minScale: 0,
    maxScale: 0,
  },
] as const

type OverlayState = {
  url: string
  bounds: LatLngBoundsExpression
}

export type MunicipalExportBounds = {
  west: number
  south: number
  east: number
  north: number
}

/**
 * Pure ArcGIS export URL for a WGS84 viewport → Web Mercator image.
 * Kept free of map instance so unit tests can lock CRS/filter params.
 */
export function buildMunicipalExportUrl(
  view: MunicipalExportBounds,
  size: { width: number; height: number },
): OverlayState {
  const width = Math.max(256, Math.min(Math.round(size.width), 1280))
  const height = Math.max(256, Math.min(Math.round(size.height), 1280))

  const sw = L.CRS.EPSG3857.project(L.latLng(view.south, view.west))
  const ne = L.CRS.EPSG3857.project(L.latLng(view.north, view.east))
  const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`

  const params = new URLSearchParams({
    f: 'image',
    format: 'png32',
    transparent: 'true',
    bbox,
    bboxSR: '3857',
    imageSR: '3857',
    size: `${width},${height}`,
    dpi: '96',
    dynamicLayers: JSON.stringify(DYNAMIC_LAYERS),
  })

  return {
    url: `${MUNICIPAL_LAND_EXPORT_URL}?${params.toString()}`,
    bounds: [
      [view.south, view.west],
      [view.north, view.east],
    ],
  }
}

/**
 * Build an ArcGIS export that matches Leaflet's Web Mercator view.
 * imageSR/bboxSR 3857 + pixel size from projected bounds keeps parcels
 * glued to the basemap while panning (4326 exports drift).
 */
function buildOverlayRequest(map: L.Map): OverlayState {
  const bounds = map.getBounds().pad(0.06)
  const zoom = map.getZoom()
  const topLeft = map.project(bounds.getNorthWest(), zoom)
  const bottomRight = map.project(bounds.getSouthEast(), zoom)

  return buildMunicipalExportUrl(
    {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    },
    {
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    },
  )
}

/**
 * Viewport image overlay of municipal (city-owned) parcels from MSIP.
 * Navy fill = Gmina Kraków only — orientation for BO / playground sites.
 */
export function MunicipalLandLayer() {
  const map = useMap()
  const [overlay, setOverlay] = useState<OverlayState | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let requestId = 0

    const refresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const next = buildOverlayRequest(map)
        const id = ++requestId
        const img = new Image()
        img.onload = () => {
          if (!cancelled && id === requestId) setOverlay(next)
        }
        img.onerror = () => {
          // Keep previous overlay; avoid jumping to a broken frame.
        }
        img.src = next.url
      }, 160)
    }

    refresh()
    map.on('moveend', refresh)
    map.on('zoomend', refresh)
    map.on('resize', refresh)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      map.off('moveend', refresh)
      map.off('zoomend', refresh)
      map.off('resize', refresh)
    }
  }, [map])

  if (!overlay) return null

  return (
    <ImageOverlay
      url={overlay.url}
      bounds={overlay.bounds}
      opacity={0.85}
      zIndex={350}
      attribution="&copy; MSIP Kraków — grunty Gminy Kraków (GK)"
    />
  )
}
