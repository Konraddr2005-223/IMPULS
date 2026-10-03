import { describe, expect, it, vi } from 'vitest'
import { buildProposalPrintHtml, downloadProposalPdf } from './exportProposalPdf'
import { mockRunBoAgent } from './mockAgent'

describe('buildProposalPrintHtml', () => {
  it('includes formal title and checklist in printable HTML', () => {
    const proposal = mockRunBoAgent({
      ideaText: 'Zróbmy dwie ławki i cztery drzewa przy skwerze na Kazimierzu',
      location: 'Kazimierz',
    })
    const html = buildProposalPrintHtml(proposal)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain(proposal.title)
    expect(html).toContain('Miejsce realizacji propozycji zadania')
    expect(html).toContain('Szczegółowy opis propozycji zadania')
    expect(html).toContain('Harmonogram działań')
    expect(html).toContain('Krok 1 — Podstawowe dane')
    expect(html).toMatch(/[Ll]i[sś]cie poparcia|[Ll]ista poparcia/)
  })
})

describe('downloadProposalPdf', () => {
  it('builds a real PDF blob and triggers download without window.open', async () => {
    const proposal = mockRunBoAgent({
      ideaText: 'Zróbmy dwie ławki i cztery drzewa przy skwerze na Kazimierzu',
      location: 'Kazimierz',
    })

    const createObjectURL = vi.fn(() => 'blob:mock-pdf')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })

    const click = vi.fn()
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const realCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: click })
      }
      return el
    })

    await downloadProposalPdf(proposal)

    expect(createObjectURL).toHaveBeenCalled()
    const calls = createObjectURL.mock.calls as unknown as unknown[][]
    const firstArg = calls[0]?.[0]
    expect(firstArg).toBeInstanceOf(Blob)
    const blob = firstArg as Blob
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(500)
    expect(click).toHaveBeenCalled()
    expect(appendChild).toHaveBeenCalled()

    vi.restoreAllMocks()
  })
})
