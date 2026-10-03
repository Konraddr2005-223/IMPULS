import { describe, expect, it } from 'vitest'
import { KRAKOW_DISTRICTS } from './api'
import {
  canonicalDistrictName,
  districtKeysMatch,
  stripDiacritics,
} from './districtNames'

describe('districtNames', () => {
  it('strips Polish diacritics', () => {
    expect(stripDiacritics('Dębniki')).toBe('Debniki')
    expect(stripDiacritics('Łagiewniki')).toBe('Lagiewniki')
  })

  it('maps GeoJSON labels to canonical district codes', () => {
    expect(canonicalDistrictName('Dzielnica V Krowodrza')).toBe('Krowodrza')
    expect(canonicalDistrictName('Dzielnica I Stare Miasto')).toBe('Stare Miasto')
    expect(canonicalDistrictName('Dzielnica XII Biezanow-Prokocim')).toBe(
      'Bieżanów-Prokocim',
    )
    expect(canonicalDistrictName('Dzielnica XVII Wzgórza Krzeszławickie')).toBe(
      'Wzgórza Krzesławickie',
    )
  })

  it('resolves every Kraków district list entry', () => {
    for (const name of KRAKOW_DISTRICTS) {
      expect(canonicalDistrictName(name)).toBe(name)
    }
  })

  it('matches interest-area codes to GeoJSON names', () => {
    expect(
      districtKeysMatch('Krowodrza', 'Dzielnica V Krowodrza'),
    ).toBe(true)
    expect(districtKeysMatch('Podgórze', 'Nowa Huta')).toBe(false)
  })
})
