import type { LandAssessmentStatus, OwnershipClass, SourceMode } from '../types'

export type DemoLocation = {
  id: string
  lat: number
  lng: number
  ownershipClass: OwnershipClass
  ownershipRawLabel: string | null
  planningLabel: string | null
  planName: string | null
  assessment: LandAssessmentStatus
  scenarioDescription: string
  sourceMode: SourceMode
  checkedAt: string
}

/**
 * Twelve synthetic / snapshot demo points around Kraków.
 * Counts: 4 municipal, 3 other, 2 planning risk, 3 no data.
 */
export const demoLocations: DemoLocation[] = [
  {
    id: 'demo-municipal-1',
    lat: 50.0614,
    lng: 19.937,
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny (scenariusz demo)',
    planningLabel: 'ZP',
    planName: 'Demo — Rynek okolice',
    assessment: 'likely_suitable',
    scenarioDescription: 'Skwer ogólnodostępny — grunt gminny.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-municipal-2',
    lat: 50.052,
    lng: 19.944,
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny (scenariusz demo)',
    planningLabel: 'US',
    planName: 'Demo — Kazimierz',
    assessment: 'likely_suitable',
    scenarioDescription: 'Plac zabaw przy szkole — grunt gminny.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-municipal-3',
    lat: 50.045,
    lng: 19.949,
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny (scenariusz demo)',
    planningLabel: 'KD',
    planName: 'Demo — Podgórze',
    assessment: 'requires_review',
    scenarioDescription: 'Pas drogowy — możliwa kolizja z infrastrukturą.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-municipal-4',
    lat: 50.07,
    lng: 19.91,
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny (scenariusz demo)',
    planningLabel: 'ZP',
    planName: 'Demo — Krowodrza',
    assessment: 'likely_suitable',
    scenarioDescription:
      'presentation-B: grunt gminny, brak wykrytej przeszkody w danych demo (Zielony zakątek).',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-other-1',
    lat: 50.064,
    lng: 19.923,
    ownershipClass: 'other_or_uncertain',
    ownershipRawLabel: 'Władanie osób prawnych (opis demonstracyjny)',
    planningLabel: 'MW',
    planName: 'Demo — Piasek',
    assessment: 'requires_review',
    scenarioDescription:
      'presentation-A: teren innego podmiotu — ostrzeżenie (scenariusz problematycznego gruntu).',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-other-2',
    lat: 50.055,
    lng: 19.96,
    ownershipClass: 'other_or_uncertain',
    ownershipRawLabel: 'Podmiot prywatny / niejasny (demo)',
    planningLabel: 'U',
    planName: 'Demo — Grzegórzki',
    assessment: 'requires_review',
    scenarioDescription: 'Teren przy budynku — własność niepewna.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-other-3',
    lat: 50.04,
    lng: 19.93,
    ownershipClass: 'other_or_uncertain',
    ownershipRawLabel: 'Inny podmiot (demo)',
    planningLabel: 'P',
    planName: 'Demo — Dębniki',
    assessment: 'requires_review',
    scenarioDescription: 'Parking przy osiedlu — inny podmiot.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-planning-risk-1',
    lat: 50.048,
    lng: 19.92,
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny (scenariusz demo)',
    planningLabel: 'R',
    planName: 'Demo — Zakrzówek okolice',
    assessment: 'planning_risk',
    scenarioDescription: 'Przeznaczenie planistyczne może blokować inwestycję.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-planning-risk-2',
    lat: 50.075,
    lng: 19.945,
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny (scenariusz demo)',
    planningLabel: 'ZN',
    planName: 'Demo — Prądnik',
    assessment: 'planning_risk',
    scenarioDescription: 'Teren zieleni chronionej — ryzyko niezgodności.',
    sourceMode: 'synthetic_demo',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-nodata-1',
    lat: 50.03,
    lng: 19.9,
    ownershipClass: 'unknown',
    ownershipRawLabel: null,
    planningLabel: null,
    planName: null,
    assessment: 'no_data',
    scenarioDescription: 'Brak pokrycia danymi demonstracyjnymi.',
    sourceMode: 'unavailable',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-nodata-2',
    lat: 50.09,
    lng: 19.98,
    ownershipClass: 'unknown',
    ownershipRawLabel: null,
    planningLabel: null,
    planName: null,
    assessment: 'no_data',
    scenarioDescription: 'Brak pokrycia danymi demonstracyjnymi.',
    sourceMode: 'unavailable',
    checkedAt: '2026-10-03',
  },
  {
    id: 'demo-nodata-3',
    lat: 50.02,
    lng: 20.0,
    ownershipClass: 'unknown',
    ownershipRawLabel: null,
    planningLabel: null,
    planName: null,
    assessment: 'no_data',
    scenarioDescription: 'Brak pokrycia danymi demonstracyjnymi.',
    sourceMode: 'unavailable',
    checkedAt: '2026-10-03',
  },
]
