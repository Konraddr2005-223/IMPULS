export type GeoPoint = {
  lat: number
  lng: number
}

export type SourceMode = 'live' | 'verified_snapshot' | 'synthetic_demo' | 'unavailable'

export type OwnershipClass =
  | 'municipal'
  | 'other_or_uncertain'
  | 'unknown'

export type LandAssessmentStatus =
  | 'likely_suitable'
  | 'requires_review'
  | 'planning_risk'
  | 'no_data'

export type PlanningInfo = {
  planName: string | null
  designation: string | null
  resolutionUrl: string | null
}

export type LandAssessment = {
  mode: SourceMode
  parcelId: string | null
  ownershipClass: OwnershipClass
  ownershipRawLabel: string | null
  planning: PlanningInfo
  assessment: LandAssessmentStatus
  warnings: string[]
  retrievedAt: string
  ownershipUpdatedAt: string | null
  planningUpdatedAt: string | null
  scenarioDescription?: string
}

export type TemplateField = {
  id: string
  label: string
  minLength?: number
  maxLength?: number
  required: boolean
}

export type ApplicationTemplate = {
  version: string
  fields: TemplateField[]
  supportSignaturesRequired: number
  supportListDaysAfterSubmission: number
  notes: string[]
}

export type CostCatalogItem = {
  id: string
  label: string
  unit: string
  minPln: number
  maxPln: number
  scopeNote?: string
}

export type CostCatalog = {
  version: string
  sourceUrl: string
  sourceLabel: string
  checkedAt: string
  taxNote: string
  items: CostCatalogItem[]
}

export type SubmissionInstructions = {
  title: string
  simulationNotice: string
  officialFormUrl: string
  signatureListUrl: string
  steps: string[]
}

export type CityCalendar = {
  edition: string
  simulationLabel: string
  submissionClosedOn: string
  votingClosedOn: string
  notes: string[]
}

export type WmsLayerConfig = {
  id: string
  title: string
  url: string
  layers: string
  note: string
}

export interface CityAdapter {
  cityId: string
  edition: string
  rulesVersion: string

  checkLocation(point: GeoPoint): Promise<LandAssessment>
  getApplicationTemplate(): ApplicationTemplate
  getCostCatalog(): CostCatalog
  getSubmissionInstructions(): SubmissionInstructions
  getCalendar(): CityCalendar
  getWmsSources(): WmsLayerConfig[]
}
