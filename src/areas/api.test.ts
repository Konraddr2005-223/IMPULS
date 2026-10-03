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
    name: 'Okolica',
    kind: 'radius',
    district_code: null,
    lat: 50.06,
    lng: 19.94,
    radius_m: 500,
    created_at: '',
  },
]

describe('ideaMatchesAreas', () => {
  it('matches by district OR radius', () => {
    expect(
      ideaMatchesAreas(
        { district_code: 'Krowodrza', lat: 50.2, lng: 20.1 },
        areas,
      ),
    ).toBe(true)
    expect(
      ideaMatchesAreas({ district_code: 'Podgórze', lat: 50.06, lng: 19.94 }, areas),
    ).toBe(true)
    expect(
      ideaMatchesAreas({ district_code: 'Podgórze', lat: 50.2, lng: 20.1 }, areas),
    ).toBe(false)
  })
})
