import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { CreateIdeaForm } from './CreateIdeaForm'

vi.mock('../lib/geolocation', () => ({
  getCurrentPosition: vi.fn(async () => ({
    ok: true,
    lat: 50.065,
    lng: 19.94,
    accuracyM: 10,
  })),
}))

vi.mock('./api', () => ({
  createIdea: vi.fn(async (_uid, input) => ({
    id: 'idea-new-1',
    city_id: 'krakow',
    author_id: 'user-1',
    title: input.title,
    description: input.description,
    category: input.category,
    district_code: input.districtCode ?? 'Krowodrza',
    photo_path: null,
    support_threshold: input.supportThreshold,
    likes_count: 0,
    revision: 1,
    status: 'published',
    lat: input.lat,
    lng: input.lng,
    created_at: new Date().toISOString(),
  })),
}))

describe('CreateIdeaForm', () => {
  it('renders title, description, category and GPS button', () => {
    render(
      <AuthProvider>
        <CreateIdeaForm onCreated={vi.fn()} />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Dodaj pomysł' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Zielony zakątek z ławkami/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Użyj GPS/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Opublikuj pomysł na mapie/i })).toBeInTheDocument()
  })

  it('updates coordinates when GPS button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <CreateIdeaForm onCreated={vi.fn()} />
      </AuthProvider>,
    )

    const gpsBtn = screen.getByRole('button', { name: /Użyj GPS/i })
    await user.click(gpsBtn)

    const latInput = screen.getByLabelText(/Szerokość \(Lat\)/i) as HTMLInputElement
    const lngInput = screen.getByLabelText(/Długość \(Lng\)/i) as HTMLInputElement
    expect(latInput.value).toBe('50.065')
    expect(lngInput.value).toBe('19.94')
  })
})
