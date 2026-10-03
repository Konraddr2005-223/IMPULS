import { describe, expect, it } from 'vitest'
import { ideaMatchesAreas, type InterestArea } from './api'

const areas: InterestArea[] = [
  {
    id: '1',
    user_id: 'u',
    city_id: 'krakow',
    name: 'Krowodrza',
    kind: 'district',
    district_code: 'Krowodrza',
    lat: null,
    lng: null,
    radius_m: null,
    created_at: '',
  },
  {
    id: '2',
    user_id: 'u',
    city_id: 'krakow',
    name: 'Okolica promień',
    kind: 'radius',
    district_code: null,
    lat: 50.06,
    lng: 19.94,
    radius_m: 500,
    created_at: '',
  },
  {
    id: '3',
    user_id: 'u',
    city_id: 'krakow',
    name: 'Wielokąt Rynek',
    kind: 'polygon',
    district_code: null,
    lat: 50.061,
    lng: 19.937,
    radius_m: null,
    polygon_points: [
      { lat: 50.060, lng: 19.935 },
      { lat: 50.063, lng: 19.935 },
      { lat: 50.063, lng: 19.940 },
      { lat: 50.060, lng: 19.940 },
    ],
    created_at: '',
  },
]

describe('ideaMatchesAreas', () => {
  it('matches by district OR radius OR polygon', () => {
    // District match
    expect(
      ideaMatchesAreas(
        { district_code: 'Krowodrza', lat: 50.2, lng: 20.1 },
        areas,
      ),
    ).toBe(true)

    // Radius match
    expect(
      ideaMatchesAreas({ district_code: 'Podgórze', lat: 50.06, lng: 19.94 }, areas),
    ).toBe(true)

    // Polygon match (inside Rynek polygon)
    expect(
      ideaMatchesAreas({ district_code: 'Inna', lat: 50.0615, lng: 19.9375 }, areas),
    ).toBe(true)

    // Outside all areas
    expect(
      ideaMatchesAreas({ district_code: 'Podgórze', lat: 50.2, lng: 20.1 }, areas),
    ).toBe(false)
  })

  it('returns true when user has no interest areas configured', () => {
    expect(
      ideaMatchesAreas({ district_code: 'Dowolna', lat: 50.0, lng: 19.0 }, []),
    ).toBe(true)
  })
})
