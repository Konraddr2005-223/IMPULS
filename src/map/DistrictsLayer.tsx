import { useEffect, useMemo, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { PathOptions } from 'leaflet'
import { canonicalDistrictName, stripDiacritics } from '../areas/districtNames'

type DistrictsLayerProps = {
  /** Canonical district codes to emphasize (user interest areas). */
  highlightedDistricts?: string[]
}

type DistrictProperties = {
  name?: string
  cartodb_id?: number
}

type DistrictFeature = {
  type: 'Feature'
  properties?: DistrictProperties | null
  geometry: object
}

type DistrictFeatureCollection = {
  type: 'FeatureCollection'
  features: DistrictFeature[]
}

function highlightKey(name: string): string {
  return stripDiacritics(name).toLowerCase().trim()
}

export function DistrictsLayer({ highlightedDistricts = [] }: DistrictsLayerProps) {
  const [data, setData] = useState<DistrictFeatureCollection | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/krakow-dzielnice.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`GeoJSON dzielnic: HTTP ${res.status}`)
        return res.json() as Promise<DistrictFeatureCollection>
      })
      .then((fc) => {
        if (!cancelled) setData(fc)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const highlighted = useMemo(() => {
    const set = new Set<string>()
    for (const d of highlightedDistricts) {
      const canonical = canonicalDistrictName(d) ?? d
      set.add(highlightKey(canonical))
    }
    return set
  }, [highlightedDistricts])

  if (!data) return null

  return (
    <GeoJSON
      key={`districts-${[...highlighted].sort().join('|')}`}
      data={data}
      style={(feature) =>
        styleForFeature(feature?.properties as DistrictProperties | null | undefined, highlighted)
      }
      onEachFeature={(feature, layer) => {
        const props = feature.properties as DistrictProperties | null | undefined
        const label = canonicalDistrictName(props?.name) ?? props?.name ?? 'Dzielnica'
        layer.bindTooltip(label, { sticky: true, direction: 'center', opacity: 0.9 })
      }}
    />
  )
}

/** Brand green — municipal areas are always tinted green on the map. */
const DISTRICT_GREEN = '#176B4B'

function styleForFeature(
  properties: DistrictProperties | null | undefined,
  highlighted: Set<string>,
): PathOptions {
  const canonical = canonicalDistrictName(properties?.name)
  const isHighlighted = canonical ? highlighted.has(highlightKey(canonical)) : false

  // Interest areas: stronger green fill; other districts: lighter green outline/fill.
  if (isHighlighted) {
    return {
      color: DISTRICT_GREEN,
      weight: 2.5,
      fillColor: DISTRICT_GREEN,
      fillOpacity: 0.32,
      opacity: 0.95,
    }
  }

  return {
    color: DISTRICT_GREEN,
    weight: 1.5,
    fillColor: DISTRICT_GREEN,
    fillOpacity: 0.16,
    opacity: 0.85,
  }
}
