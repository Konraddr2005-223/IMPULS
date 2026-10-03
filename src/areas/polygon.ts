import polygonClipping, { type MultiPolygon } from 'polygon-clipping'

export type LatLngPoint = {
  lat: number
  lng: number
}

export type MergedPolygon = {
  outer: LatLngPoint[]
  holes: LatLngPoint[][]
}

/**
 * Calculates the arithmetic centroid (center of mass) of a list of points.
 */
export function calculateCentroid(points: LatLngPoint[]): LatLngPoint {
  if (points.length === 0) {
    return { lat: 50.06143, lng: 19.93658 }
  }
  const sumLat = points.reduce((acc, p) => acc + p.lat, 0)
  const sumLng = points.reduce((acc, p) => acc + p.lng, 0)
  return {
    lat: Number((sumLat / points.length).toFixed(6)),
    lng: Number((sumLng / points.length).toFixed(6)),
  }
}

/**
 * Sorts points clockwise around their centroid to prevent self-intersecting "hourglass" shapes.
 */
export function sortPointsClockwise(points: LatLngPoint[]): LatLngPoint[] {
  if (points.length < 3) return [...points]
  const center = calculateCentroid(points)
  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a.lat - center.lat, a.lng - center.lng)
    const angleB = Math.atan2(b.lat - center.lat, b.lng - center.lng)
    return angleB - angleA // clockwise order
  })
}

/**
 * Determines if a point is inside a polygon ring using the ray-casting algorithm (even-odd rule).
 */
export function isPointInPolygon(point: LatLngPoint, ring: LatLngPoint[]): boolean {
  if (ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng
    const yi = ring[i].lat
    const xj = ring[j].lng
    const yj = ring[j].lat

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Determines if a point is inside a merged polygon (inside outer boundary and outside all holes).
 */
export function isPointInMergedPolygon(point: LatLngPoint, poly: MergedPolygon): boolean {
  if (!isPointInPolygon(point, poly.outer)) return false
  for (const hole of poly.holes) {
    if (isPointInPolygon(point, hole)) {
      return false
    }
  }
  return true
}

/**
 * Takes multiple polygon point arrays (each max 4 vertices) and merges any intersecting ones
 * into unified polygons using polygon boolean union.
 * Returns an array of merged polygons (each with outer ring and optional holes).
 */
export function mergePolygonAreas(polygons: LatLngPoint[][]): MergedPolygon[] {
  const validPolygons = polygons
    .filter((pts) => pts && pts.length >= 3)
    .map((pts) => sortPointsClockwise(pts))

  if (validPolygons.length === 0) return []
  if (validPolygons.length === 1) {
    return [{ outer: validPolygons[0], holes: [] }]
  }

  try {
    // Convert to GeoJSON rings: [lng, lat], closed
    const geoms = validPolygons.map((pts) => {
      const ring: [number, number][] = pts.map((p) => [p.lng, p.lat])
      // Ensure closed ring for polygon-clipping
      const first = ring[0]
      const last = ring[ring.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]])
      }
      return [ring] as [number, number][][]
    })

    const [firstGeom, ...restGeoms] = geoms
    const unionResult: MultiPolygon = polygonClipping.union(firstGeom, ...restGeoms)

    return unionResult.map((poly) => {
      const outerRing = poly[0]
      // Remove duplicate closing point for Leaflet
      const outerPts: LatLngPoint[] = (
        outerRing.length > 1 &&
        outerRing[0][0] === outerRing[outerRing.length - 1][0] &&
        outerRing[0][1] === outerRing[outerRing.length - 1][1]
          ? outerRing.slice(0, -1)
          : outerRing
      ).map(([lng, lat]) => ({ lat, lng }))

      const holes: LatLngPoint[][] = poly.slice(1).map((holeRing) => {
        const ringToUse =
          holeRing.length > 1 &&
          holeRing[0][0] === holeRing[holeRing.length - 1][0] &&
          holeRing[0][1] === holeRing[holeRing.length - 1][1]
            ? holeRing.slice(0, -1)
            : holeRing
        return ringToUse.map(([lng, lat]) => ({ lat, lng }))
      })

      return {
        outer: outerPts,
        holes,
      }
    })
  } catch (err) {
    console.error('Error merging polygons:', err)
    // Fallback: return unmerged polygons
    return validPolygons.map((outer) => ({ outer, holes: [] }))
  }
}
