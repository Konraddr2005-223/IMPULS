import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { DEMO_PASSWORD, demoAccounts, type DemoAccountKey } from './demoAccounts'
import { AuthModal } from './AuthModal'

type AuthState = {
  user: User | null
  session: Session | null
  displayName: string | null
  loading: boolean
  error: string | null
  authModalOpen: boolean
  authModalMode: 'login' | 'register'
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>
  signInDemo: (key: DemoAccountKey) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

async function ensureProfile(user: User, displayName: string) {
  if (!supabase) return
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    { onConflict: 'id' },
  )
  if (error) {
    // Non-fatal profile upsert error logging
    console.warn('Profile sync notice:', error.message)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !user) {
      setDisplayName(null)
      return
    }

    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(
          data?.display_name ??
            (user.user_metadata?.display_name as string | undefined) ??
            user.email ??
            null,
        )
      })
  }, [user])

  function openAuthModal(mode: 'login' | 'register' = 'login') {
    setError(null)
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  function closeAuthModal() {
    setAuthModalOpen(false)
  }

  async function signInWithEmail(email: string, password: string) {
    if (!supabase) {
      setError('Supabase nie jest skonfigurowany.')
      throw new Error('Supabase nie jest skonfigurowany.')
    }

    setError(null)
    setLoading(true)

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInErr) throw signInErr

      if (data.user) {
        const fallbackName =
          (data.user.user_metadata?.display_name as string | undefined) ??
          email.trim().split('@')[0]
        await ensureProfile(data.user, fallbackName)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Błędny login lub hasło.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function signUpWithEmail(
    email: string,
    password: string,
    rawDisplayName: string,
  ) {
    if (!supabase) {
      setError('Supabase nie jest skonfigurowany.')
      throw new Error('Supabase nie jest skonfigurowany.')
    }

    setError(null)
    setLoading(true)

    const finalDisplayName = rawDisplayName.trim() || email.trim().split('@')[0]

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: finalDisplayName },
        },
      })

      if (signUpErr) throw signUpErr

      if (data.user) {
        await ensureProfile(data.user, finalDisplayName)
      }

      const requiresEmailConfirmation = !data.session
      return { requiresEmailConfirmation }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Rejestracja nie powiodła się.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function signInDemo(key: DemoAccountKey) {
    if (!supabase) {
      setError('Supabase nie jest skonfigurowany.')
      return
    }

    const account = demoAccounts.find((a) => a.key === key)
    if (!account) return

    setError(null)
    setLoading(true)

    try {
      const signIn = await supabase.auth.signInWithPassword({
        email: account.email,
        password: DEMO_PASSWORD,
      })

      if (!signIn.error && signIn.data.user) {
        await ensureProfile(signIn.data.user, account.displayName)
        return
      }

      const signUp = await supabase.auth.signUp({
        email: account.email,
        password: DEMO_PASSWORD,
        options: {
          data: { display_name: account.displayName },
        },
      })

      if (signUp.error) {
        throw signUp.error
      }

      if (!signUp.data.session || !signUp.data.user) {
        throw new Error(
          'Konto utworzone, ale brak sesji. W Supabase Auth wyłącz „Confirm email” i spróbuj ponownie.',
        )
      }

      await ensureProfile(signUp.data.user, account.displayName)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Nie udało się zalogować.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    if (!supabase) return
    setError(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        displayName,
        loading,
        error,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInDemo,
        signOut,
        clearError: () => setError(null),
      }}
    >
      {children}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={closeAuthModal}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
