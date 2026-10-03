import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

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

describe('App shell', () => {
  it('renders brand, navigation and demo ideas', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Sąsiedzki' })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    expect(within(nav).getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByText('Zielony zakątek z ławkami')).toBeInTheDocument()
  })

  it('shows land card after map click on a demo point', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTestId('map-canvas'))
    expect(await screen.findByLabelText('Karta terenu')).toBeInTheDocument()
    expect(screen.getByText(/Scenariusz demonstracyjny/i)).toBeInTheDocument()
  })

  it('switches to faults layer', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Usterki' }))
    expect(screen.getByText('Uszkodzona ławka')).toBeInTheDocument()
  })
})
