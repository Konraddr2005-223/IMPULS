import { describe, expect, it } from 'vitest'
import {
  calculateCentroid,
  isPointInMergedPolygon,
  isPointInPolygon,
  mergePolygonAreas,
  sortPointsClockwise,
} from './polygon'

describe('polygon geometry utilities', () => {
  describe('calculateCentroid', () => {
    it('calculates average lat and lng', () => {
      const pts = [
        { lat: 50.0, lng: 20.0 },
        { lat: 50.2, lng: 20.2 },
        { lat: 50.4, lng: 20.4 },
      ]
      const center = calculateCentroid(pts)
      expect(center.lat).toBe(50.2)
      expect(center.lng).toBe(20.2)
    })

    it('returns default fallback when points are empty', () => {
      const center = calculateCentroid([])
      expect(center.lat).toBeCloseTo(50.06, 1)
      expect(center.lng).toBeCloseTo(19.93, 1)
    })
  })

  describe('sortPointsClockwise', () => {
    it('orders 4 square corners clockwise', () => {
      // Unsorted corners
      const pts = [
        { lat: 50.0, lng: 19.0 },
        { lat: 51.0, lng: 20.0 },
        { lat: 50.0, lng: 20.0 },
        { lat: 51.0, lng: 19.0 },
      ]
      const sorted = sortPointsClockwise(pts)
      expect(sorted).toHaveLength(4)
      // Consecutive points should be adjacent around perimeter
      expect(sorted[0]).toEqual({ lat: 51.0, lng: 19.0 })
      expect(sorted[1]).toEqual({ lat: 51.0, lng: 20.0 })
      expect(sorted[2]).toEqual({ lat: 50.0, lng: 20.0 })
      expect(sorted[3]).toEqual({ lat: 50.0, lng: 19.0 })
    })
  })

  describe('isPointInPolygon', () => {
    const square = [
      { lat: 50.0, lng: 19.0 },
      { lat: 51.0, lng: 19.0 },
      { lat: 51.0, lng: 20.0 },
      { lat: 50.0, lng: 20.0 },
    ]

    it('detects point strictly inside', () => {
      expect(isPointInPolygon({ lat: 50.5, lng: 19.5 }, square)).toBe(true)
    })

    it('detects point clearly outside', () => {
      expect(isPointInPolygon({ lat: 49.0, lng: 19.5 }, square)).toBe(false)
      expect(isPointInPolygon({ lat: 50.5, lng: 21.0 }, square)).toBe(false)
    })

    it('returns false when polygon has fewer than 3 points', () => {
      expect(isPointInPolygon({ lat: 50.0, lng: 19.0 }, [{ lat: 50.0, lng: 19.0 }])).toBe(false)
    })
  })

  describe('mergePolygonAreas', () => {
    it('returns empty array when no polygons are given', () => {
      expect(mergePolygonAreas([])).toEqual([])
    })

    it('returns single polygon if only one is given', () => {
      const poly = [
        { lat: 50.0, lng: 19.0 },
        { lat: 51.0, lng: 19.0 },
        { lat: 51.0, lng: 20.0 },
        { lat: 50.0, lng: 20.0 },
      ]
      const merged = mergePolygonAreas([poly])
      expect(merged).toHaveLength(1)
      expect(merged[0].outer).toHaveLength(4)
    })

    it('keeps disjoint polygons separate', () => {
      const polyA = [
        { lat: 50.0, lng: 19.0 },
        { lat: 50.1, lng: 19.0 },
        { lat: 50.1, lng: 19.1 },
        { lat: 50.0, lng: 19.1 },
      ]
      const polyB = [
        { lat: 50.5, lng: 19.5 },
        { lat: 50.6, lng: 19.5 },
        { lat: 50.6, lng: 19.6 },
        { lat: 50.5, lng: 19.6 },
      ]
      const merged = mergePolygonAreas([polyA, polyB])
      expect(merged).toHaveLength(2)
    })

    it('merges overlapping / intersecting polygons into one large unified polygon', () => {
      // Square 1: [19.0, 50.0] to [19.5, 50.5]
      const poly1 = [
        { lat: 50.0, lng: 19.0 },
        { lat: 50.5, lng: 19.0 },
        { lat: 50.5, lng: 19.5 },
        { lat: 50.0, lng: 19.5 },
      ]
      // Square 2: overlapping [19.3, 50.3] to [19.8, 50.8]
      const poly2 = [
        { lat: 50.3, lng: 19.3 },
        { lat: 50.8, lng: 19.3 },
        { lat: 50.8, lng: 19.8 },
        { lat: 50.3, lng: 19.8 },
      ]

      const merged = mergePolygonAreas([poly1, poly2])
      // Crucial requirement: "Jeśli okolice się przecinają to powstaje jedna duża (merged)"
      expect(merged).toHaveLength(1)
      const union = merged[0]
      expect(union.outer.length).toBeGreaterThan(4)

      // Test point in union:
      // Point in square 1 only
      expect(isPointInMergedPolygon({ lat: 50.1, lng: 19.1 }, union)).toBe(true)
      // Point in square 2 only
      expect(isPointInMergedPolygon({ lat: 50.7, lng: 19.7 }, union)).toBe(true)
      // Point in intersection
      expect(isPointInMergedPolygon({ lat: 50.4, lng: 19.4 }, union)).toBe(true)
      // Point outside both
      expect(isPointInMergedPolygon({ lat: 51.0, lng: 20.0 }, union)).toBe(false)
    })
  })
})
