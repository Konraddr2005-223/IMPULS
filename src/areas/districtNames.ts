import { KRAKOW_DISTRICTS } from './api'

/** Strip Polish diacritics for fuzzy district matching. */
export function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
}

function normalizeKey(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/^dzielnica\s+[ivxlcdm]+\s+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Known spelling variants in open GeoJSON sources vs app district codes. */
const ALIASES: Record<string, (typeof KRAKOW_DISTRICTS)[number]> = {
  [normalizeKey('Biezanow-Prokocim')]: 'Bieżanów-Prokocim',
  [normalizeKey('Bieżanów-Prokocim')]: 'Bieżanów-Prokocim',
  [normalizeKey('Wzgórza Krzeszławickie')]: 'Wzgórza Krzesławickie',
  [normalizeKey('Wzgórza Krzesławickie')]: 'Wzgórza Krzesławickie',
}

const BY_KEY = new Map<string, (typeof KRAKOW_DISTRICTS)[number]>(
  KRAKOW_DISTRICTS.map((name) => [normalizeKey(name), name]),
)

/**
 * Map a raw district label (e.g. "Dzielnica V Krowodrza") to the canonical
 * code used in interest areas / idea.district_code.
 */
export function canonicalDistrictName(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const key = normalizeKey(raw)
  return ALIASES[key] ?? BY_KEY.get(key) ?? null
}

export function districtKeysMatch(a: string, b: string): boolean {
  const left = canonicalDistrictName(a) ?? a
  const right = canonicalDistrictName(b) ?? b
  return normalizeKey(left) === normalizeKey(right)
}
