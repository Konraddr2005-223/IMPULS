import { useAuth } from './AuthContext'
import { demoAccounts } from './demoAccounts'

export function AuthBar() {
  const { user, displayName, loading, signInDemo, signOut, error } = useAuth()

  return (
    <div className="flex items-center gap-2 text-sm">
      {user ? (
        <>
          <span className="text-[var(--color-text)]/70 truncate max-w-[140px]">
            {displayName ?? user.email}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-9 px-2 rounded-lg border border-black/10 bg-transparent cursor-pointer"
          >
            Wyloguj
          </button>
        </>
      ) : (
        <>
          {demoAccounts.map((account) => (
            <button
              key={account.key}
              type="button"
              disabled={loading}
              onClick={() => signInDemo(account.key)}
              className="min-h-9 px-2 rounded-lg border-0 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-action)' }}
            >
              {account.key === 'autor' ? 'Autor' : 'Sąsiad'}
            </button>
          ))}
        </>
      )}
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
