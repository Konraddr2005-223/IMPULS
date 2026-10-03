import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FaultDetailCard } from './FaultDetailCard'
import type { FaultRecord } from './types'
import { copy } from '../ui/copy'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    fetchFaultStatusHistory: vi.fn(async () => []),
    updateFaultStatus: vi.fn(),
  }
})

const mockFault: FaultRecord = {
  id: 'fault-1',
  city_id: 'krakow',
  author_id: 'user-1',
  category: 'street_furniture',
  description: 'Uszkodzona ławka parkowa na Plantach.',
  status: 'new',
  status_source: 'author',
  photo_path: null,
  external_reference: null,
  lat: 50.0614,
  lng: 19.937,
  created_at: '2026-10-03T12:00:00Z',
}

describe('FaultDetailCard', () => {
  it('renders category, description, and status correctly', () => {
    const onClose = vi.fn()
    render(<FaultDetailCard fault={mockFault} onClose={onClose} />)

    expect(screen.getByText('Mała architektura')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Uszkodzona ławka parkowa na Plantach.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nowe')).toBeInTheDocument()
    expect(screen.getByText(copy.faultDisclaimer)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<FaultDetailCard fault={mockFault} onClose={onClose} />)

    await user.click(screen.getByLabelText('Zamknij szczegóły usterki'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onCheckLand when button is clicked', async () => {
    const user = userEvent.setup()
    const onCheckLand = vi.fn()
    render(<FaultDetailCard fault={mockFault} onClose={vi.fn()} onCheckLand={onCheckLand} />)

    const btn = screen.getByRole('button', { name: /Sprawdź teren/i })
    await user.click(btn)
    expect(onCheckLand).toHaveBeenCalledOnce()
  })
})
