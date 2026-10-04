import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GK_PURE_MUNICIPAL,
  buildNonMunicipalMock,
  classifyMsipOwnership,
  tryMsipOwnershipAssessment,
} from './msipOwnership'

describe('classifyMsipOwnership', () => {
  it('marks pure GK=11 as municipal / likely suitable', () => {
    const result = classifyMsipOwnership(GK_PURE_MUNICIPAL)
    expect(result.ownershipClass).toBe('municipal')
    expect(result.assessment).toBe('likely_suitable')
    expect(result.label).toMatch(/Teren gminny/i)
  })

  it('marks non-pure-GK codes as teren nienależący do gminy', () => {
    for (const code of [12, 13, 14, 21, 52]) {
      const result = classifyMsipOwnership(code)
      expect(result.ownershipClass).toBe('other_or_uncertain')
      expect(result.assessment).toBe('requires_review')
      expect(result.label).toMatch(/Teren nienależący do gminy/i)
    }
  })
})

describe('buildNonMunicipalMock', () => {
  it('fills plausible parcel / planning fields for non-GK MSIP hit', () => {
    const result = buildNonMunicipalMock(
      {
        dz_ident: '126105_9.0001.263/3',
        je_nz: 'Śródmieście',
        pow_graf: 1420,
        gr_wl_ag: 52,
        gr_wl_op: 'Osoby fizyczne / osoby prawne',
        data_akt: Date.parse('2026-02-05T00:00:00Z'),
      },
      { lat: 50.06, lng: 19.94 },
    )

    expect(result.mode).toBe('synthetic_demo')
    expect(result.ownershipClass).toBe('other_or_uncertain')
    expect(result.ownershipRawLabel).toMatch(/Teren nienależący do gminy/i)
    expect(result.assessment).toBe('requires_review')
    expect(result.parcelId).toBe('126105_9.0001.263/3')
    expect(result.planning.planName).toMatch(/STARE MIASTO/i)
    expect(result.planning.designation).toBe('MW.1')
    expect(result.scenarioDescription).toMatch(/Osoby fizyczne/i)
    expect(result.warnings.some((w) => /dyspozycji Gminy Kraków/i.test(w))).toBe(true)
  })
})

describe('tryMsipOwnershipAssessment', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps MSIP GK=11 feature to municipal land assessment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [
            {
              attributes: {
                dz_ident: '126105_9.0001.100/1',
                dz_nr: '100/1',
                je_nz: 'Śródmieście',
                pow_graf: 1200,
                gr_wl_ag: 11,
                gr_wl_op: 'Gmina Kraków - właściciel',
                data_akt: Date.parse('2026-02-05T00:00:00Z'),
                obr_dz: '100/1 S-1',
              },
            },
          ],
        }),
      })),
    )

    const result = await tryMsipOwnershipAssessment({ lat: 50.06, lng: 19.94 })
    expect(result).not.toBeNull()
    expect(result?.mode).toBe('live')
    expect(result?.ownershipClass).toBe('municipal')
    expect(result?.assessment).toBe('likely_suitable')
    expect(result?.ownershipRawLabel).toMatch(/Teren gminny/i)
    expect(result?.parcelId).toBe('126105_9.0001.100/1')
    expect(result?.scenarioDescription).toMatch(/Gmina Kraków/i)
  })

  it('mocks non-GK MSIP hit as teren nienależący do gminy with plausible data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [
            {
              attributes: {
                gr_wl_ag: 52,
                dz_ident: 'other-1',
                je_nz: 'Krowodrza',
                gr_wl_op: 'Osoba prawna',
                pow_graf: 900,
              },
            },
          ],
        }),
      })),
    )

    const result = await tryMsipOwnershipAssessment({ lat: 50.06, lng: 19.94 })
    expect(result?.mode).toBe('synthetic_demo')
    expect(result?.parcelId).toBe('other-1')
    expect(result?.ownershipClass).toBe('other_or_uncertain')
    expect(result?.ownershipRawLabel).toMatch(/Teren nienależący do gminy/i)
    expect(result?.planning.planName).toMatch(/KROWODRZA/i)
  })

  it('prefers pure municipal parcel when multiple features touch the click', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [
            { attributes: { gr_wl_ag: 52, dz_ident: 'other-1', gr_wl_op: 'Osoba prawna' } },
            {
              attributes: {
                gr_wl_ag: 11,
                dz_ident: 'gk-1',
                gr_wl_op: 'Gmina Kraków - właściciel',
              },
            },
          ],
        }),
      })),
    )

    const result = await tryMsipOwnershipAssessment({ lat: 50.06, lng: 19.94 })
    expect(result?.parcelId).toBe('gk-1')
    expect(result?.ownershipClass).toBe('municipal')
  })

  it('returns null when MSIP has no features', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ features: [] }),
      })),
    )

    await expect(tryMsipOwnershipAssessment({ lat: 50.06, lng: 19.94 })).resolves.toBeNull()
  })
})
