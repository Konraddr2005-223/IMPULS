import { LogIn, LogOut, UserPlus } from 'lucide-react'
import { useAuth } from './AuthContext'

export function AuthBar() {
  const { user, displayName, signOut, openAuthModal } = useAuth()

  const initial = displayName
    ? displayName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'U'

  return (
    <div className="flex items-center gap-2 text-sm">
      {user ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[var(--color-bg)] border border-black/5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'var(--color-ideas)' }}
              aria-hidden="true"
            >
              {initial}
            </div>
            <span
              className="text-xs font-medium text-[var(--color-text)] truncate max-w-[120px] sm:max-w-[160px]"
              title={displayName ?? user.email ?? 'Użytkownik'}
            >
              {displayName ?? user.email}
            </span>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-9 px-2.5 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-xs font-medium cursor-pointer text-[var(--color-text)]/80 hover:text-[var(--color-text)] inline-flex items-center gap-1 transition-colors"
            title="Wyloguj się"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="min-h-9 px-3 rounded-lg border-0 text-white text-xs font-semibold cursor-pointer shadow-xs hover:opacity-90 inline-flex items-center gap-1.5 transition-all"
            style={{ background: 'var(--color-action)' }}
          >
            <LogIn size={13} />
            Zaloguj się
          </button>

          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className="min-h-9 px-2.5 rounded-lg border border-black/10 bg-white hover:bg-[var(--color-bg)] text-xs font-medium cursor-pointer text-[var(--color-text)] hidden sm:inline-flex items-center gap-1.5 transition-colors"
          >
            <UserPlus size={13} />
            Rejestracja
          </button>
        </div>
      )}
    </div>
  )
}
