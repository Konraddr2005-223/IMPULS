import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./map/MapCanvas', () => ({
  MapCanvas: ({ className }: { className?: string }) => (
    <div data-testid="map-canvas" className={className} aria-label="Mapa Krakowa" />
  ),
}))

describe('App shell', () => {
  it('renders brand and navigation', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Sąsiedzki' })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    expect(within(nav).getByText('Mapa')).toBeInTheDocument()
    expect(within(nav).getByText('Powiadomienia')).toBeInTheDocument()
  })

  it('shows Kraków map screen with layer tabs', () => {
    render(<App />)

    expect(screen.getByTestId('map-canvas')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pomysły' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Usterki' })).toBeInTheDocument()
    expect(screen.getByText('Ławka przy skwerze')).toBeInTheDocument()
  })

  it('switches to faults layer and placeholder tabs', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Usterki' }))
    expect(screen.getByText('Uszkodzona nawierzchnia')).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    await user.click(within(nav).getByRole('button', { name: 'Dodaj' }))
    expect(screen.getByRole('heading', { name: 'Dodaj' })).toBeInTheDocument()
  })
})
