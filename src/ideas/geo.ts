type GeoJsonPoint = {
  type: 'Point'
  coordinates: [number, number]
}

export function pointWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`
}

export function latLngFromLocation(location: unknown): { lat: number; lng: number } | null {
  if (!location || typeof location !== 'object') return null

  const geo = location as GeoJsonPoint
  if (geo.type === 'Point' && Array.isArray(geo.coordinates)) {
    const [lng, lat] = geo.coordinates
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng }
    }
  }

  return null
}
