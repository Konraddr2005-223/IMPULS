import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './auth/AuthContext'

vi.mock('./map/MapCanvas', () => ({
  MapCanvas: ({
    className,
    centerPoint,
    onMapClick,
    onMarkerClick,
  }: {
    className?: string
    centerPoint?: { lat: number; lng: number } | null
    onMapClick?: (point: { lat: number; lng: number }) => void
    onMarkerClick?: (marker: { id: string; lat: number; lng: number; kind: 'idea' | 'fault'; label: string }) => void
  }) => (
    <div>
      <div data-testid="map-center-point">
        {centerPoint ? `${centerPoint.lat},${centerPoint.lng}` : 'none'}
      </div>
      <button
        type="button"
        data-testid="map-canvas"
        className={className}
        aria-label="Mapa Krakowa"
        onClick={() => onMapClick?.({ lat: 50.07, lng: 19.91 })}
      />
      <button
        type="button"
        data-testid="map-marker-idea"
        onClick={() =>
          onMarkerClick?.({
            id: 'idea-db-1',
            lat: 50.07,
            lng: 19.91,
            kind: 'idea',
            label: 'Zielony zakątek z ławkami',
          })
        }
      >
        Marker
      </button>
    </div>
  ),
}))

vi.mock('./ideas/api', () => ({
  fetchPublishedIdeas: vi.fn(async () => [
    {
      id: 'idea-db-1',
      city_id: 'krakow',
      author_id: 'user-1',
      title: 'Zielony zakątek z ławkami',
      description: 'Dwie ławki i cztery drzewa.',
      category: 'investment',
      district_code: 'Krowodrza',
      photo_path: null,
      support_threshold: 3,
      likes_count: 2,
      revision: 1,
      status: 'published',
      lat: 50.07,
      lng: 19.91,
      created_at: '2026-10-03T00:00:00Z',
    },
  ]),
  createIdea: vi.fn(),
  updateSupportThreshold: vi.fn(),
}))

vi.mock('./ideas/likes', () => ({
  fetchMyLikedIdeaIds: vi.fn(async () => new Set()),
  setLike: vi.fn(),
}))

vi.mock('./faults/api', () => ({
  fetchFaults: vi.fn(async () => []),
  createFault: vi.fn(),
  FAULT_STATUS_LABELS: { new: 'Nowe' },
}))

vi.mock('./areas/api', async () => {
  const actual = await vi.importActual<typeof import('./areas/api')>('./areas/api')
  return {
    ...actual,
    listInterestAreas: vi.fn(async () => []),
  }
})

vi.mock('./city/checkLand', () => ({
  checkLand: vi.fn(async () => ({
    mode: 'synthetic_demo',
    parcelId: 'demo-municipal-1',
    ownershipClass: 'municipal',
    ownershipRawLabel: 'Grunt gminny',
    planning: { planName: 'Demo', designation: 'ZP', resolutionUrl: null },
    assessment: 'likely_suitable',
    warnings: ['Scenariusz demonstracyjny. Status nie opisuje rzeczywistej nieruchomości.'],
    retrievedAt: new Date().toISOString(),
    ownershipUpdatedAt: '2026-10-03',
    planningUpdatedAt: '2026-10-03',
    scenarioDescription: 'Skwer ogólnodostępny — grunt gminny.',
  })),
}))

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('App shell', () => {
  it('renders brand, navigation and layer tabs', async () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Sąsiedzki' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    expect(within(nav).getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pomysły' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Usterki' })).toBeInTheDocument()
  })

  it('shows land card after map click', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByTestId('map-canvas'))
    expect(await screen.findByLabelText('Karta terenu')).toBeInTheDocument()
    expect(screen.getByText(/Scenariusz demonstracyjny/i)).toBeInTheDocument()
  })

  it('opens create idea form from Dodaj tab', async () => {
    const user = userEvent.setup()
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    await user.click(within(nav).getByRole('button', { name: 'Dodaj' }))
    expect(screen.getByRole('heading', { name: 'Dodaj pomysł' })).toBeInTheDocument()
  })

  it('navigates back to map screen when logo is clicked', async () => {
    const user = userEvent.setup()
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    await user.click(within(nav).getByRole('button', { name: 'Dodaj' }))
    expect(screen.getByRole('heading', { name: 'Dodaj pomysł' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sąsiedzki' }))
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dodaj pomysł' })).not.toBeInTheDocument()
  })

  it('shows idea detail card when marker is clicked, not land card', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByTestId('map-marker-idea'))
    expect(await screen.findByLabelText('Szczegóły pomysłu')).toBeInTheDocument()
    expect(screen.queryByLabelText('Karta terenu')).not.toBeInTheDocument()
  })

  it('centers map on selected idea when clicked from the list', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Lista' }))
    const ideaButton = await screen.findByRole('button', { name: /Zielony zakątek z ławkami/i })
    await user.click(ideaButton)
    expect(screen.getByTestId('map-center-point').textContent).toMatch(/^50\.07/)
  })
})
