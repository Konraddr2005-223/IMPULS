import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthModal } from './AuthModal'
import { AuthProvider } from './AuthContext'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(async () => ({
        data: { user: { id: 'u1', email: 'test@example.com' }, session: {} },
        error: null,
      })),
      signUp: vi.fn(async () => ({
        data: { user: { id: 'u2', email: 'nowy@example.com' }, session: {} },
        error: null,
      })),
      signOut: vi.fn(async () => ({})),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null })),
        })),
      })),
      upsert: vi.fn(async () => ({ error: null })),
    })),
  },
  isSupabaseConfigured: true,
}))

describe('AuthModal', () => {
  it('renders login form by default and allows switching to registration', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /Witaj z powrotem/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('twoj.adres@domena.pl')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()

    // Switch to registration
    await user.click(screen.getByRole('button', { name: 'Rejestracja' }))
    expect(screen.getByRole('heading', { name: /Dołącz do społeczności/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/np. Anna Nowak/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Utwórz konto' })).toBeInTheDocument()
  })

  it('renders demo accounts quick login buttons', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>,
    )

    expect(screen.getByRole('button', { name: /Zaloguj jako autor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zaloguj jako sąsiad/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={onClose} />
      </AuthProvider>,
    )

    await user.click(screen.getByLabelText('Zamknij okno logowania'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
