import { krakowAdapter } from './index'
import type { GeoPoint, LandAssessment, SourceMode } from './types'

const DEFAULT_TIMEOUT_MS = 4500

type GfiResult = {
  sourceId: string
  ok: boolean
  timedOut: boolean
  text: string | null
  error?: string
}

async function fetchGetFeatureInfo(
  baseUrl: string,
  layers: string,
  point: GeoPoint,
  timeoutMs: number,
): Promise<GfiResult & { sourceId?: string }> {
  const delta = 0.001
  const bbox = [
    point.lng - delta,
    point.lat - delta,
    point.lng + delta,
    point.lat + delta,
  ].join(',')

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    CRS: 'EPSG:4326',
    BBOX: bbox,
    WIDTH: '101',
    HEIGHT: '101',
    I: '50',
    J: '50',
    LAYERS: layers,
    QUERY_LAYERS: layers,
    INFO_FORMAT: 'text/plain',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${baseUrl}?${params}`, {
      signal: controller.signal,
      mode: 'cors',
    })
    const text = await response.text()
    return {
      sourceId: '',
      ok: response.ok,
      timedOut: false,
      text: response.ok ? text.slice(0, 2000) : null,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'AbortError'
    return {
      sourceId: '',
      ok: false,
      timedOut,
      text: null,
      error: timedOut ? 'timeout' : err instanceof Error ? err.message : 'error',
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Attempt live WMS GetFeatureInfo. On CORS/timeout/failure returns null
 * so the caller can fall back to synthetic demo assessment.
 */
export async function tryLiveLandAssessment(
  point: GeoPoint,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<LandAssessment | null> {
  const sources = krakowAdapter.getWmsSources()
  const results: GfiResult[] = []

  for (const source of sources) {
    const result = await fetchGetFeatureInfo(
      source.url,
      source.layers,
      point,
      timeoutMs,
    )
    results.push({ ...result, sourceId: source.id })
  }

  const anyOk = results.some((r) => r.ok && r.text)
  if (!anyOk) return null

  const ownership = results.find((r) => r.sourceId === 'ownership')
  const mpzp = results.find((r) => r.sourceId === 'mpzp')
  const retrievedAt = new Date().toISOString()
  const mode: SourceMode = 'live'

  return {
    mode,
    parcelId: null,
    ownershipClass: 'unknown',
    ownershipRawLabel: ownership?.text
      ? `Odpowiedź WMS (poglądowa): ${ownership.text.slice(0, 180)}`
      : null,
    planning: {
      planName: mpzp?.ok ? 'MPZP (GetFeatureInfo)' : null,
      designation: mpzp?.text?.slice(0, 120) ?? null,
      resolutionUrl: null,
    },
    assessment: 'requires_review',
    warnings: [
      'Informacja poglądowa. Ostateczną możliwość realizacji ocenia miasto.',
      'Odczyt WMS może być ograniczony przez CORS przeglądarki — traktuj jako próbę live.',
      ...results
        .filter((r) => !r.ok)
        .map((r) => `${r.sourceId}: ${r.timedOut ? 'timeout' : r.error ?? 'fail'}`),
    ],
    retrievedAt,
    ownershipUpdatedAt: null,
    planningUpdatedAt: null,
    scenarioDescription: 'Wynik z próby GetFeatureInfo (live / częściowy).',
  }
}
