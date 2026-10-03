import { describe, expect, it } from 'vitest'
import { KrakowCityAdapter } from './adapter'
import {
  DEMO_NO_DATA_WARNING,
  KRAKOW_CITY_ID,
  KRAKOW_EDITION,
  KRAKOW_RULES_VERSION,
  SYNTHETIC_DEMO_WARNING,
} from './config'
import { demoLocations } from './demoLocations'

describe('KrakowCityAdapter', () => {
  const adapter = new KrakowCityAdapter()

  it('exposes Kraków identity and rules version', () => {
    expect(adapter.cityId).toBe(KRAKOW_CITY_ID)
    expect(adapter.edition).toBe(KRAKOW_EDITION)
    expect(adapter.rulesVersion).toBe(KRAKOW_RULES_VERSION)
  })

  it('has twelve demo locations with required scenario mix', () => {
    expect(demoLocations).toHaveLength(12)

    const municipal = demoLocations.filter((d) => d.ownershipClass === 'municipal')
    const other = demoLocations.filter((d) => d.ownershipClass === 'other_or_uncertain')
    const planningRisk = demoLocations.filter((d) => d.assessment === 'planning_risk')
    const noData = demoLocations.filter((d) => d.assessment === 'no_data')

    expect(municipal.length).toBeGreaterThanOrEqual(4)
    expect(other).toHaveLength(3)
    expect(planningRisk).toHaveLength(2)
    expect(noData).toHaveLength(3)
  })

  it('returns synthetic assessment for a demo point', async () => {
    const point = demoLocations.find((d) => d.id === 'demo-municipal-1')!
    const result = await adapter.checkLocation({ lat: point.lat, lng: point.lng })

    expect(result.mode).toBe('synthetic_demo')
    expect(result.ownershipClass).toBe('municipal')
    expect(result.assessment).toBe('likely_suitable')
    expect(result.warnings).toContain(SYNTHETIC_DEMO_WARNING)
    expect(result.parcelId).toBe('demo-municipal-1')
  })

  it('does not snap arbitrary points to the nearest demo location', async () => {
    const result = await adapter.checkLocation({ lat: 50.1, lng: 19.8 })

    expect(result.assessment).toBe('no_data')
    expect(result.mode).toBe('unavailable')
    expect(result.warnings).toContain(DEMO_NO_DATA_WARNING)
  })

  it('provides BO template limits from the 2026 rules', () => {
    const template = adapter.getApplicationTemplate()
    const title = template.fields.find((f) => f.id === 'title')
    const summary = template.fields.find((f) => f.id === 'summary')

    expect(title?.maxLength).toBe(60)
    expect(summary?.minLength).toBe(60)
    expect(summary?.maxLength).toBe(250)
    expect(template.supportSignaturesRequired).toBe(15)
    expect(template.supportListDaysAfterSubmission).toBe(10)
  })

  it('exposes cost catalog ranges for known Kraków items', () => {
    const catalog = adapter.getCostCatalog()
    const bench = catalog.items.find((i) => i.id === 'bench_backrest_installation')
    const tree = catalog.items.find((i) => i.id === 'tree_16_18_planting')

    expect(catalog.items.length).toBeGreaterThanOrEqual(8)
    expect(bench?.minPln).toBe(1897.5)
    expect(bench?.maxPln).toBe(4950)
    expect(tree?.minPln).toBe(1500)
    expect(tree?.maxPln).toBe(1700)
    expect(catalog.sourceUrl).toContain('plikimpi.krakow.pl')
  })

  it('marks the calendar as a 2026 process simulation', () => {
    const calendar = adapter.getCalendar()
    expect(calendar.simulationLabel).toMatch(/Symulacja procesu według zasad 2026/)
    expect(calendar.submissionClosedOn).toBe('2026-03-17')
    expect(calendar.votingClosedOn).toBe('2026-09-28')
  })

  it('lists verified WMS endpoints for ownership and MPZP', () => {
    const sources = adapter.getWmsSources()
    expect(sources.map((s) => s.id)).toEqual(['ownership', 'mpzp'])
    expect(sources.every((s) => s.url.includes('msip.um.krakow.pl'))).toBe(true)
  })

  it('returns submission instructions with official BO links', () => {
    const instructions = adapter.getSubmissionInstructions()
    expect(instructions.simulationNotice).toMatch(/Symulacja/)
    expect(instructions.officialFormUrl).toContain('budzet.krakow.pl')
    expect(instructions.steps.length).toBeGreaterThanOrEqual(3)
  })
})
