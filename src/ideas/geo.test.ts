import { describe, expect, it } from 'vitest'
import { latLngFromLocation, pointWkt } from './geo'

describe('idea geo helpers', () => {
  it('builds EWKT point with lng lat order', () => {
    expect(pointWkt(50.06, 19.94)).toBe('SRID=4326;POINT(19.94 50.06)')
  })

  it('parses GeoJSON Point from PostgREST', () => {
    expect(
      latLngFromLocation({ type: 'Point', coordinates: [19.94, 50.06] }),
    ).toEqual({ lat: 50.06, lng: 19.94 })
  })
})
