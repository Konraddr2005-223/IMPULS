import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AreasScreen } from './AreasScreen'

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    openAuthModal: vi.fn(),
  }),
}))

vi.mock('./api', () => ({
  KRAKOW_DISTRICTS: ['Stare Miasto', 'Krowodrza', 'Podgórze'],
  createDistrictArea: vi.fn().mockResolvedValue({ id: 'd1' }),
  createRadiusArea: vi.fn().mockResolvedValue({ id: 'r1' }),
  deleteInterestArea: vi.fn().mockResolvedValue(undefined),
  listInterestAreas: vi.fn().mockResolvedValue([]),
}))

describe('AreasScreen', () => {
  function renderWithClient(ui: React.ReactElement) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
  }

  it('renders interactive map location picker and radius slider', async () => {
    renderWithClient(<AreasScreen draftPoint={{ lat: 50.0614, lng: 19.9366 }} />)

    expect(screen.getByText('Wskaż środek okolicy na mapie')).toBeInTheDocument()
    expect(
      screen.getByText(/Kliknij na mapie, aby ustawić centrum/i),
    ).toBeInTheDocument()

    const slider = screen.getByRole('slider', { name: /Promień obszaru/i })
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveValue('500')
    expect(screen.getAllByText('500 m').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Zapisz okolicę' })).toBeInTheDocument()
  })

  it('submits point and selected radius on click', async () => {
    const user = userEvent.setup()
    const { createRadiusArea } = await import('./api')

    renderWithClient(<AreasScreen draftPoint={{ lat: 50.0614, lng: 19.9366 }} />)

    // Click 1 km preset
    const preset1km = screen.getByRole('button', { name: '1 km' })
    await user.click(preset1km)

    // Click save
    const saveBtn = screen.getByRole('button', { name: 'Zapisz okolicę' })
    await user.click(saveBtn)

    expect(createRadiusArea).toHaveBeenCalledWith(
      'u1',
      'Moja okolica',
      50.0614,
      19.9366,
      1000,
    )
  })
})
