import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './auth/AuthContext'

vi.mock('./map/MapCanvas', () => ({
  MapCanvas: ({
    className,
    onMapClick,
  }: {
    className?: string
    onMapClick?: (point: { lat: number; lng: number }) => void
  }) => (
    <button
      type="button"
      data-testid="map-canvas"
      className={className}
      aria-label="Mapa Krakowa"
      onClick={() => onMapClick?.({ lat: 50.07, lng: 19.91 })}
    />
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
}))

vi.mock('./ideas/likes', () => ({
  fetchMyLikedIdeaIds: vi.fn(async () => new Set()),
  setLike: vi.fn(),
}))

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  )
}

describe('App shell', () => {
  it('renders brand, navigation and demo ideas', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Sąsiedzki' })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    expect(within(nav).getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByText('Zielony zakątek z ławkami')).toBeInTheDocument()
  })

  it('shows land card after map click on a demo point', async () => {
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

  it('opens idea details from the ranking list', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(await screen.findByRole('button', { name: /Zielony zakątek z ławkami/i }))
    expect(await screen.findByLabelText('Szczegóły pomysłu')).toBeInTheDocument()
    expect(screen.getByText(/sygnał zainteresowania/i)).toBeInTheDocument()
  })
})
