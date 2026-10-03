import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AreasScreen } from './AreasScreen'

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    openAuthModal: vi.fn(),
  }),
}))

const mockExistingAreas = [
  {
    id: 'area-1',
    user_id: 'u1',
    city_id: 'krakow',
    name: 'Park Krakowski',
    kind: 'radius' as const,
    district_code: null,
    lat: 50.068,
    lng: 19.925,
    radius_m: 750,
    created_at: '2026-10-01',
  },
  {
    id: 'area-2',
    user_id: 'u1',
    city_id: 'krakow',
    name: 'Krowodrza',
    kind: 'district' as const,
    district_code: 'Krowodrza',
    lat: null,
    lng: null,
    radius_m: null,
    created_at: '2026-10-02',
  },
]

vi.mock('./api', () => ({
  KRAKOW_DISTRICTS: ['Stare Miasto', 'Krowodrza', 'Podgórze'],
  createDistrictArea: vi.fn().mockResolvedValue({ id: 'd1' }),
  createRadiusArea: vi.fn().mockResolvedValue({ id: 'r1' }),
  updateRadiusArea: vi.fn().mockResolvedValue(undefined),
  updateDistrictArea: vi.fn().mockResolvedValue(undefined),
  deleteInterestArea: vi.fn().mockResolvedValue(undefined),
  listInterestAreas: vi.fn().mockImplementation(() => Promise.resolve(mockExistingAreas)),
}))

describe('AreasScreen', () => {
  function renderWithClient(ui: React.ReactElement) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
  }

  it('renders interactive map location picker and radius slider when opened with draftPoint', async () => {
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

  it('submits point and selected radius on click, then closes form and shows success banner', async () => {
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

    // Form should now be closed and success message visible
    await waitFor(() => {
      expect(screen.getByText(/Dodano nową okolicę: Moja okolica/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Zapisz okolicę' })).not.toBeInTheDocument()
    })
  })

  it('allows editing an existing area and saves updates via updateRadiusArea', async () => {
    const user = userEvent.setup()
    const { updateRadiusArea } = await import('./api')

    renderWithClient(<AreasScreen />)

    // Wait for list to render
    expect(await screen.findByText('Park Krakowski')).toBeInTheDocument()
    expect(screen.getByText('Krowodrza')).toBeInTheDocument()

    // Click edit on first area
    const editButtons = screen.getAllByRole('button', { name: /Edytuj okolicę/i })
    await user.click(editButtons[0])

    // Edit form should be open with area name and save changes button
    expect(screen.getByRole('heading', { name: /Edycja okolicy: Park Krakowski/i })).toBeInTheDocument()
    const nameInput = screen.getByDisplayValue('Park Krakowski')
    await user.clear(nameInput)
    await user.type(nameInput, 'Nowy Park')

    const saveChangesBtn = screen.getByRole('button', { name: /Zapisz zmiany/i })
    await user.click(saveChangesBtn)

    expect(updateRadiusArea).toHaveBeenCalledWith(
      'area-1',
      'u1',
      'Nowy Park',
      50.068,
      19.925,
      750,
    )

    // Form closes and shows success message
    await waitFor(() => {
      expect(screen.getByText(/Zaktualizowano okolicę: Nowy Park/i)).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Edycja okolicy/i })).not.toBeInTheDocument()
    })
  })
})
