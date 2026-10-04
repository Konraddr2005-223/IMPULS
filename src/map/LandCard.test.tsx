import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LandCard } from './LandCard'
import type { LandAssessment } from '../city/types'
import { copy } from '../ui/copy'

const mockSyntheticAssessment: LandAssessment = {
  mode: 'synthetic_demo',
  parcelId: '223/4',
  ownershipClass: 'municipal',
  ownershipRawLabel: 'Władanie Gminy Kraków',
  planning: {
    planName: 'STARE MIASTO',
    designation: 'ZP.1',
    resolutionUrl: 'https://bip.krakow.pl/uchwala-demo',
  },
  assessment: 'likely_suitable',
  warnings: ['Projekt wymaga zachowania ogólnodostępności.'],
  retrievedAt: '2026-10-03T14:00:00Z',
  ownershipUpdatedAt: '2026-02-05',
  planningUpdatedAt: '2026-10-02',
  scenarioDescription: 'Skwer ogólnodostępny w centrum.',
}

describe('LandCard', () => {
  it('renders loading state', () => {
    render(<LandCard assessment={null} loading={true} error={null} onClose={vi.fn()} />)
    expect(screen.getByText(/Odpytuję dane MSIP Kraków/i)).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(
      <LandCard
        assessment={null}
        loading={false}
        error="Nie można połączyć się z serwerem WMS"
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/Nie można połączyć się z serwerem WMS/i)).toBeInTheDocument()
  })

  it('renders synthetic demo assessment details, planning info and BIP link', () => {
    render(
      <LandCard
        assessment={mockSyntheticAssessment}
        loading={false}
        error={null}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(/Scenariusz demonstracyjny/i)).toBeInTheDocument()
    expect(screen.getByText('Władanie Gminy Kraków')).toBeInTheDocument()
    expect(screen.getByTestId('land-ownership-badge')).toHaveTextContent(/Teren gminny/i)
    expect(screen.getByText(/STARE MIASTO/i)).toBeInTheDocument()
    expect(screen.getByText(/ZP.1/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zobacz uchwałę planu w BIP/i })).toHaveAttribute(
      'href',
      'https://bip.krakow.pl/uchwala-demo',
    )
    expect(screen.getByText(copy.landDisclaimer)).toBeInTheDocument()
  })

  it('shows clear municipal status for live MSIP GK assessment', () => {
    const liveMunicipal: LandAssessment = {
      ...mockSyntheticAssessment,
      mode: 'live',
      ownershipRawLabel: 'Teren gminny — GK – Gmina Kraków',
      planning: { planName: null, designation: null, resolutionUrl: null },
      scenarioDescription:
        'Teren gminny — GK – Gmina Kraków · Gmina Kraków - właściciel · Jednostka ewidencyjna: Śródmieście',
    }

    render(
      <LandCard assessment={liveMunicipal} loading={false} error={null} onClose={vi.fn()} />,
    )

    expect(
      screen.getByText(/Teren gminny — wstępnie bez wykrytej przeszkody/i),
    ).toBeInTheDocument()
    expect(screen.getByTestId('land-ownership-badge')).toHaveTextContent(/Teren gminny/i)
    expect(screen.getByTestId('land-ownership-badge')).toHaveTextContent(/Gminy Miejskiej Kraków/i)
    expect(screen.getAllByText(/Teren gminny — GK/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows clear non-municipal mock for non-GK assessment', () => {
    const nonMunicipal: LandAssessment = {
      ...mockSyntheticAssessment,
      mode: 'synthetic_demo',
      ownershipClass: 'other_or_uncertain',
      ownershipRawLabel: 'Teren nienależący do gminy',
      assessment: 'requires_review',
      planning: {
        planName: 'KROWODRZA — Centrum',
        designation: 'MW',
        resolutionUrl: 'https://www.bip.krakow.pl/?dok_id=116191',
      },
      scenarioDescription:
        'Teren nienależący do gminy · Osoba prawna · Jednostka ewidencyjna: Krowodrza',
      warnings: [
        copy.landDisclaimer,
        'Lokalizacja projektu BO wymaga gruntu w dyspozycji Gminy Kraków — ten punkt tego nie spełnia.',
      ],
    }

    render(
      <LandCard assessment={nonMunicipal} loading={false} error={null} onClose={vi.fn()} />,
    )

    expect(screen.getAllByText(/Teren nienależący do gminy/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('land-ownership-badge')).toHaveTextContent(
      /Teren nienależący do gminy/i,
    )
    // Plan name + scenario both mention Krowodrza — assert with getAllByText
    expect(screen.getAllByText(/KROWODRZA/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Punkt może leżeć przy granicy/i)).not.toBeInTheDocument()
  })

  it('triggers onClose callback on button click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LandCard
        assessment={mockSyntheticAssessment}
        loading={false}
        error={null}
        onClose={onClose}
      />,
    )

    await user.click(screen.getByLabelText('Zamknij kartę terenu'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('triggers onAddIdea and onAddFault when clicked', async () => {
    const user = userEvent.setup()
    const onAddIdea = vi.fn()
    const onAddFault = vi.fn()
    render(
      <LandCard
        assessment={mockSyntheticAssessment}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onAddIdea={onAddIdea}
        onAddFault={onAddFault}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Dodaj pomysł tutaj/i }))
    expect(onAddIdea).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: /Zgłoś usterkę tutaj/i }))
    expect(onAddFault).toHaveBeenCalledOnce()
  })
})
