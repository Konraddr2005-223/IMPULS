import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App shell', () => {
  it('renders brand, tagline and mobile navigation', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Sąsiedzki' })).toBeInTheDocument()
    expect(screen.getByText('Pomysł z okolicy. Wspólne działanie.')).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Nawigacja dolna' })
    expect(within(nav).getByText('Mapa')).toBeInTheDocument()
    expect(within(nav).getByText('Powiadomienia')).toBeInTheDocument()
  })
})
