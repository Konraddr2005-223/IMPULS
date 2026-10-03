import { distanceMeters } from '../geo'
import type {
  ApplicationTemplate,
  CityAdapter,
  CityCalendar,
  CostCatalog,
  GeoPoint,
  LandAssessment,
  SubmissionInstructions,
  WmsLayerConfig,
} from '../types'
import {
  DEMO_MATCH_RADIUS_M,
  DEMO_NO_DATA_WARNING,
  KRAKOW_CITY_ID,
  KRAKOW_EDITION,
  KRAKOW_RULES_VERSION,
  LAND_DISCLAIMER,
  SYNTHETIC_DEMO_WARNING,
  applicationTemplate,
  cityCalendar,
  costCatalog,
  submissionInstructions,
  wmsSources,
} from './config'
import { demoLocations } from './demoLocations'

function findNearestDemo(point: GeoPoint) {
  let best: { location: (typeof demoLocations)[number]; distance: number } | null =
    null

  for (const location of demoLocations) {
    const distance = distanceMeters(point, {
      lat: location.lat,
      lng: location.lng,
    })
    if (distance > DEMO_MATCH_RADIUS_M) continue
    if (!best || distance < best.distance) {
      best = { location, distance }
    }
  }

  return best?.location ?? null
}

function noDemoAssessment(retrievedAt: string): LandAssessment {
  return {
    mode: 'unavailable',
    parcelId: null,
    ownershipClass: 'unknown',
    ownershipRawLabel: null,
    planning: {
      planName: null,
      designation: null,
      resolutionUrl: null,
    },
    assessment: 'no_data',
    warnings: [DEMO_NO_DATA_WARNING, LAND_DISCLAIMER],
    retrievedAt,
    ownershipUpdatedAt: null,
    planningUpdatedAt: null,
  }
}

export class KrakowCityAdapter implements CityAdapter {
  readonly cityId = KRAKOW_CITY_ID
  readonly edition = KRAKOW_EDITION
  readonly rulesVersion = KRAKOW_RULES_VERSION

  async checkLocation(point: GeoPoint): Promise<LandAssessment> {
    const retrievedAt = new Date().toISOString()
    const match = findNearestDemo(point)

    if (!match) {
      return noDemoAssessment(retrievedAt)
    }

    const warnings = [LAND_DISCLAIMER]
    if (match.sourceMode === 'synthetic_demo') {
      warnings.unshift(SYNTHETIC_DEMO_WARNING)
    }
    if (match.ownershipClass === 'other_or_uncertain') {
      warnings.push(
        'Kategoria władania nie rozstrzyga samodzielnie możliwości realizacji BO.',
      )
    }
    if (match.assessment === 'planning_risk') {
      warnings.push('Przeznaczenie planistyczne wymaga dodatkowej weryfikacji.')
    }

    return {
      mode: match.sourceMode,
      parcelId: match.id,
      ownershipClass: match.ownershipClass,
      ownershipRawLabel: match.ownershipRawLabel,
      planning: {
        planName: match.planName,
        designation: match.planningLabel,
        resolutionUrl: null,
      },
      assessment: match.assessment,
      warnings,
      retrievedAt,
      ownershipUpdatedAt: match.checkedAt,
      planningUpdatedAt: match.checkedAt,
      scenarioDescription: match.scenarioDescription,
    }
  }

  getApplicationTemplate(): ApplicationTemplate {
    return applicationTemplate
  }

  getCostCatalog(): CostCatalog {
    return costCatalog
  }

  getSubmissionInstructions(): SubmissionInstructions {
    return submissionInstructions
  }

  getCalendar(): CityCalendar {
    return cityCalendar
  }

  getWmsSources(): WmsLayerConfig[] {
    return wmsSources
  }
}

export const krakowAdapter = new KrakowCityAdapter()
