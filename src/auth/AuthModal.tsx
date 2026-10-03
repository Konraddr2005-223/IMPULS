import { useState } from 'react'
import { CheckCircle2, Lock, LogIn, Mail, User as UserIcon, X } from 'lucide-react'
import { copy } from '../ui/copy'
import { demoAccounts } from './demoAccounts'
import { useAuth } from './AuthContext'

type AuthModalProps = {
  isOpen: boolean
  initialMode?: 'login' | 'register'
  onClose: () => void
}

export function AuthModal({ isOpen, initialMode = 'login', onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInDemo, loading, error, clearError } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  function switchMode(newMode: 'login' | 'register') {
    setMode(newMode)
    clearError()
    setSuccessNotice(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setSuccessNotice(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        onClose()
      } else {
        const result = await signUpWithEmail(email, password, displayName)
        if (result.requiresEmailConfirmation) {
          setSuccessNotice(
            'Konto zostało utworzone! Sprawdź swoją skrzynkę e-mail, aby potwierdzić rejestrację.',
          )
        } else {
          onClose()
        }
      }
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDemoLogin(key: (typeof demoAccounts)[number]['key']) {
    clearError()
    setSuccessNotice(null)
    try {
      await signInDemo(key)
      onClose()
    } catch {
      // error handled in context
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-black/5 bg-[var(--color-bg)]">
          <div className="flex gap-2 p-1 rounded-xl bg-black/5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 transition-all ${
                mode === 'login'
                  ? 'bg-white text-[var(--color-text)] shadow-xs'
                  : 'bg-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
              }`}
            >
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 transition-all ${
                mode === 'register'
                  ? 'bg-white text-[var(--color-text)] shadow-xs'
                  : 'bg-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
              }`}
            >
              Rejestracja
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5 border-0 bg-transparent cursor-pointer"
            aria-label="Zamknij okno logowania"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <h2 id="auth-modal-title" className="m-0 text-lg font-semibold text-[var(--color-text)]">
            {mode === 'login' ? 'Witaj z powrotem' : 'Dołącz do społeczności'}
          </h2>
          <p className="mt-1 mb-5 text-xs text-[var(--color-text)]/65">
            {mode === 'login'
              ? 'Zaloguj się, aby dodawać pomysły, popierać sąsiadów i zgłaszać usterki.'
              : 'Załóż darmowe konto, aby aktywnie współtworzyć swoją okolicę.'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === 'register' && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-[var(--color-text)]">Imię lub pseudonim</span>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40 pointer-events-none"
                  />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="np. Anna Nowak lub Sąsiad z Krowodrzy"
                    className="w-full min-h-11 pl-9 pr-3 rounded-xl border border-black/15 bg-white text-sm focus:outline-[var(--color-ideas)]"
                  />
                </div>
              </label>
            )}

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-[var(--color-text)]">Adres e-mail</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40 pointer-events-none"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj.adres@domena.pl"
                  className="w-full min-h-11 pl-9 pr-3 rounded-xl border border-black/15 bg-white text-sm focus:outline-[var(--color-ideas)]"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--color-text)]">Hasło</span>
                {mode === 'register' && (
                  <span className="text-[10px] text-[var(--color-text)]/50">min. 6 znaków</span>
                )}
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40 pointer-events-none"
                />
                <input
                  type="password"
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-11 pl-9 pr-3 rounded-xl border border-black/15 bg-white text-sm focus:outline-[var(--color-ideas)]"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting || loading}
              className="mt-2 min-h-11 w-full rounded-xl border-0 text-white text-sm font-semibold cursor-pointer shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-opacity"
              style={{ background: 'var(--color-action)' }}
            >
              <LogIn size={16} />
              {submitting || loading
                ? 'Przetwarzanie…'
                : mode === 'login'
                  ? 'Zaloguj się'
                  : 'Utwórz konto'}
            </button>
          </form>

          {/* Mode Switcher footer */}
          <div className="mt-4 text-center text-xs text-[var(--color-text)]/70">
            {mode === 'login' ? (
              <span>
                Nie masz jeszcze konta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="border-0 bg-transparent p-0 cursor-pointer text-[var(--color-action)] font-semibold hover:underline"
                >
                  Zarejestruj się
                </button>
              </span>
            ) : (
              <span>
                Masz już konto?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="border-0 bg-transparent p-0 cursor-pointer text-[var(--color-action)] font-semibold hover:underline"
                >
                  Zaloguj się
                </button>
              </span>
            )}
          </div>

          {/* Quick Demo Section */}
          <div className="mt-6 pt-5 border-t border-black/5">
            <span className="block text-center text-[11px] font-medium text-[var(--color-text)]/50 uppercase tracking-wider mb-2.5">
              Szybkie konta demonstracyjne (Hackathon)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.key}
                  type="button"
                  disabled={loading || submitting}
                  onClick={() => handleDemoLogin(account.key)}
                  className="min-h-10 px-3 rounded-xl border border-black/10 bg-[var(--color-bg)] hover:bg-black/5 text-xs font-semibold cursor-pointer text-[var(--color-text)] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserIcon size={14} className="text-[var(--color-action)]" />
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mt-3 mb-0 text-center text-[10px] text-[var(--color-text)]/55 leading-tight">
              {copy.authNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
