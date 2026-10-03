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
    kind: 'polygon' as const,
    district_code: null,
    lat: 50.068,
    lng: 19.925,
    radius_m: null,
    polygon_points: [
      { lat: 50.067, lng: 19.924 },
      { lat: 50.069, lng: 19.924 },
      { lat: 50.069, lng: 19.926 },
      { lat: 50.067, lng: 19.926 },
    ],
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
    polygon_points: null,
    created_at: '2026-10-02',
  },
]

vi.mock('./api', () => ({
  KRAKOW_DISTRICTS: ['Stare Miasto', 'Krowodrza', 'Podgórze'],
  createDistrictArea: vi.fn().mockResolvedValue({ id: 'd1' }),
  createPolygonArea: vi.fn().mockResolvedValue(undefined),
  updatePolygonArea: vi.fn().mockResolvedValue(undefined),
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

  it('renders interactive map polygon picker when opened with draftPoint', async () => {
    renderWithClient(<AreasScreen draftPoint={{ lat: 50.0614, lng: 19.9366 }} />)

    expect(screen.getByText('Wyznacz wierzchołki na mapie')).toBeInTheDocument()
    expect(
      screen.getByText(/Klikaj na mapie, aby ustawić do 4 wierzchołków/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Czworokąt gotowy (4 / 4 wierzchołki)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zapisz okolicę' })).toBeInTheDocument()
  })

  it('submits polygon area on click, then closes form and shows success banner', async () => {
    const user = userEvent.setup()
    const { createPolygonArea } = await import('./api')

    renderWithClient(<AreasScreen draftPoint={{ lat: 50.0614, lng: 19.9366 }} />)

    // Click save
    const saveBtn = screen.getByRole('button', { name: 'Zapisz okolicę' })
    await user.click(saveBtn)

    expect(createPolygonArea).toHaveBeenCalledWith(
      'u1',
      'Moja okolica',
      expect.arrayContaining([
        expect.objectContaining({ lat: expect.any(Number), lng: expect.any(Number) }),
      ]),
    )

    // Form should now be closed and success message visible
    await waitFor(() => {
      expect(screen.getByText(/Dodano nową okolicę: Moja okolica/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Zapisz okolicę' })).not.toBeInTheDocument()
    })
  })

  it('allows editing an existing polygon area and saves updates via updatePolygonArea', async () => {
    const user = userEvent.setup()
    const { updatePolygonArea } = await import('./api')

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

    expect(updatePolygonArea).toHaveBeenCalledWith(
      'area-1',
      'u1',
      'Nowy Park',
      expect.any(Array),
    )

    // Form closes and shows success message
    await waitFor(() => {
      expect(screen.getByText(/Zaktualizowano okolicę: Nowy Park/i)).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Edycja okolicy/i })).not.toBeInTheDocument()
    })
  })
})
