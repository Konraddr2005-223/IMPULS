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
  fetchPublishedIdeas: vi.fn(async () => []),
  createIdea: vi.fn(),
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
})
