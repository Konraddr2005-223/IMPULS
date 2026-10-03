import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { CreateFaultForm } from './CreateFaultForm'
import { copy } from '../ui/copy'

vi.mock('../lib/geolocation', () => ({
  getCurrentPosition: vi.fn(async () => ({
    ok: true,
    lat: 50.062,
    lng: 19.935,
    accuracyM: 5,
  })),
}))

vi.mock('./api', () => ({
  createFault: vi.fn(async (_uid, input) => ({
    id: 'fault-new-1',
    city_id: 'krakow',
    author_id: 'user-1',
    category: input.category,
    description: input.description,
    photo_path: null,
    status: 'new',
    status_source: 'author',
    external_reference: null,
    lat: input.lat,
    lng: input.lng,
    created_at: new Date().toISOString(),
  })),
}))

describe('CreateFaultForm', () => {
  it('renders category, description input, disclaimer, and GPS button', () => {
    render(
      <AuthProvider>
        <CreateFaultForm onCreated={vi.fn()} onSwitchToIdea={vi.fn()} />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Dodaj usterkę' })).toBeInTheDocument()
    expect(screen.getByText(copy.faultDisclaimer)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Połamana ławka przy alejce/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Użyj GPS/i })).toBeInTheDocument()
  })

  it('updates coordinates when GPS button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <CreateFaultForm onCreated={vi.fn()} onSwitchToIdea={vi.fn()} />
      </AuthProvider>,
    )

    const gpsBtn = screen.getByRole('button', { name: /Użyj GPS/i })
    await user.click(gpsBtn)

    const latInput = screen.getByLabelText(/Szerokość \(Lat\)/i) as HTMLInputElement
    const lngInput = screen.getByLabelText(/Długość \(Lng\)/i) as HTMLInputElement
    expect(latInput.value).toBe('50.062')
    expect(lngInput.value).toBe('19.935')
  })
})
