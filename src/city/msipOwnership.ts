import type {
  GeoPoint,
  LandAssessment,
  LandAssessmentStatus,
  OwnershipClass,
} from './types'
import { LAND_DISCLAIMER } from './krakow/config'

/** MSIP ArcGIS — struktura własności (ta sama usługa co warstwa GK na mapie). */
export const MSIP_OWNERSHIP_QUERY_URL =
  'https://msip.um.krakow.pl/arcgis/rest/services/Obserwatorium/K01_GR_WLASNOSCI/MapServer/0/query'

const DEFAULT_TIMEOUT_MS = 5000

/** Aggregation codes from MSIP field `gr_wl_ag`. */
export const GK_PURE_MUNICIPAL = 11

const OWNERSHIP_LABELS: Record<number, string> = {
  11: 'GK – Gmina Kraków',
  12: 'GK – oddane we władanie',
  13: 'GK – współwłasność',
  14: 'GK – użytkowanie wieczyste',
  21: 'SP – Skarb Państwa',
  22: 'SP – oddane we władanie',
  23: 'SP – współwłasność',
  24: 'SP – użytkowanie wieczyste',
}

type MsipAttrs = {
  dz_ident?: string | null
  dz_nr?: string | null
  je_nz?: string | null
  pow_graf?: number | null
  gr_wl_ag?: number | null
  gr_wl_op?: string | null
  data_akt?: number | string | null
  obr_dz?: string | null
}

export function classifyMsipOwnership(aggregation: number): {
  ownershipClass: OwnershipClass
  assessment: LandAssessmentStatus
  label: string
} {
  if (aggregation === GK_PURE_MUNICIPAL) {
    return {
      ownershipClass: 'municipal',
      assessment: 'likely_suitable',
      label: `Teren gminny — ${OWNERSHIP_LABELS[11]}`,
    }
  }

  // Non-pure-GK → clear non-municipal signal for the card UI.
  return {
    ownershipClass: 'other_or_uncertain',
    assessment: 'requires_review',
    label: 'Teren nienależący do gminy',
  }
}

function formatOwnershipDate(value: number | string | null | undefined): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10)
  // MSIP sometimes returns "05.02.2026 03:57:48"
  const m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return value.slice(0, 10)
}

function buildMunicipalScenario(attrs: MsipAttrs, classifiedLabel: string): string {
  const parts = [classifiedLabel]
  if (attrs.gr_wl_op) parts.push(attrs.gr_wl_op)
  if (attrs.je_nz) parts.push(`Jednostka ewidencyjna: ${attrs.je_nz}`)
  if (attrs.pow_graf != null && Number.isFinite(attrs.pow_graf)) {
    parts.push(`Powierzchnia graficzna: ${Math.round(attrs.pow_graf)} m²`)
  }
  return parts.join(' · ')
}

/**
 * Plausible card payload when MSIP says the parcel is not pure GK=11.
 * Keeps real parcel id / ewidencja when available; fills planning fields for demo UX.
 */
export function buildNonMunicipalMock(
  attrs: MsipAttrs,
  point: GeoPoint,
): LandAssessment {
  const aggregation = Number(attrs.gr_wl_ag)
  const msipLabel = OWNERSHIP_LABELS[aggregation] ?? `Kod władania: ${aggregation}`
  const unit = attrs.je_nz?.trim() || 'Kraków'
  const parcelId =
    attrs.dz_ident ?? attrs.dz_nr ?? attrs.obr_dz ?? `demo-${point.lat.toFixed(4)}-${point.lng.toFixed(4)}`
  const areaM2 =
    attrs.pow_graf != null && Number.isFinite(attrs.pow_graf)
      ? Math.round(attrs.pow_graf)
      : 850 + (Math.abs(Math.round(point.lat * 1000 + point.lng * 1000)) % 400)

  const planningByUnit: Record<string, { planName: string; designation: string }> = {
    Śródmieście: { planName: 'STARE MIASTO', designation: 'MW.1' },
    Krowodrza: { planName: 'KROWODRZA — Centrum', designation: 'MW' },
    Podgórze: { planName: 'PODGÓRZE', designation: 'MN.2' },
    Nowa: { planName: 'NOWA HUTA', designation: 'U.1' },
  }
  const planning =
    planningByUnit[unit] ??
    ({
      planName: `Obręb ${unit}`,
      designation: aggregation >= 21 && aggregation <= 24 ? 'TZ' : 'MW',
    } as const)

  const tenureHint =
    attrs.gr_wl_op?.trim() ||
    (aggregation >= 21 && aggregation <= 24
      ? 'Skarb Państwa / podmiot publiczny inny niż Gmina Kraków'
      : 'Władanie osób fizycznych lub prawnych (poza Gminą Kraków)')

  return {
    mode: 'synthetic_demo',
    parcelId,
    ownershipClass: 'other_or_uncertain',
    ownershipRawLabel: 'Teren nienależący do gminy',
    planning: {
      planName: planning.planName,
      designation: planning.designation,
      resolutionUrl: 'https://www.bip.krakow.pl/?dok_id=116191',
    },
    assessment: 'requires_review',
    warnings: [
      LAND_DISCLAIMER,
      'Lokalizacja projektu BO wymaga gruntu w dyspozycji Gminy Kraków — ten punkt tego nie spełnia.',
      `MSIP: ${msipLabel}.`,
    ],
    retrievedAt: new Date().toISOString(),
    ownershipUpdatedAt: formatOwnershipDate(attrs.data_akt) ?? new Date().toISOString().slice(0, 10),
    planningUpdatedAt: '2026-10-02',
    scenarioDescription: [
      'Teren nienależący do gminy',
      tenureHint,
      `Jednostka ewidencyjna: ${unit}`,
      `Powierzchnia (orientacyjna): ${areaM2} m²`,
      `Kategoria MSIP: ${msipLabel}`,
    ].join(' · '),
  }
}

/**
 * Live ArcGIS Query for ownership under a map click.
 * Returns null on network/CORS/empty so callers can fall back.
 * Pure GK=11 → live municipal assessment; any other MSIP hit → non-gmina mock with plausible fields.
 */
export async function tryMsipOwnershipAssessment(
  point: GeoPoint,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<LandAssessment | null> {
  const geometry = JSON.stringify({ x: point.lng, y: point.lat })
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    geometry,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'dz_ident,dz_nr,je_nz,pow_graf,gr_wl_ag,gr_wl_op,data_akt,obr_dz',
    returnGeometry: 'false',
    resultRecordCount: '3',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${MSIP_OWNERSHIP_QUERY_URL}?${params}`, {
      signal: controller.signal,
      mode: 'cors',
    })
    if (!response.ok) return null
    const data = (await response.json()) as {
      features?: Array<{ attributes?: MsipAttrs }>
      error?: unknown
    }
    if (data.error || !data.features?.length) return null

    // Prefer pure municipal (GK=11) when several parcels touch the click.
    const attrs =
      data.features
        .map((f) => f.attributes)
        .filter((a): a is MsipAttrs => Boolean(a))
        .sort((a, b) => {
          const aScore = a.gr_wl_ag === GK_PURE_MUNICIPAL ? 0 : 1
          const bScore = b.gr_wl_ag === GK_PURE_MUNICIPAL ? 0 : 1
          return aScore - bScore
        })[0] ?? null

    if (!attrs || attrs.gr_wl_ag == null) return null

    const aggregation = Number(attrs.gr_wl_ag)
    if (aggregation !== GK_PURE_MUNICIPAL) {
      return buildNonMunicipalMock(attrs, point)
    }

    const classified = classifyMsipOwnership(aggregation)
    return {
      mode: 'live',
      parcelId: attrs.dz_ident ?? attrs.dz_nr ?? attrs.obr_dz ?? null,
      ownershipClass: classified.ownershipClass,
      ownershipRawLabel: classified.label,
      planning: {
        planName: null,
        designation: null,
        resolutionUrl: null,
      },
      assessment: classified.assessment,
      warnings: [LAND_DISCLAIMER],
      retrievedAt: new Date().toISOString(),
      ownershipUpdatedAt: formatOwnershipDate(attrs.data_akt),
      planningUpdatedAt: null,
      scenarioDescription: buildMunicipalScenario(attrs, classified.label),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
