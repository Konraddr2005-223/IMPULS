import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'
import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listNotifications, markNotificationRead } from './api'

export function NotificationsScreen() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: Boolean(user),
    queryFn: () => listNotifications(user!.id),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (!user) return
    const id = window.setInterval(() => {
      void qc.invalidateQueries({ queryKey: ['notifications', user.id] })
    }, 5000)
    return () => window.clearInterval(id)
  }, [user, qc])

  if (!user) {
    return (
      <Placeholder
        title="Powiadomienia"
        body="Zaloguj się, aby zobaczyć zdarzenia z okolicy."
      />
    )
  }

  const items = query.data ?? []

  return (
    <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 overflow-y-auto">
      <h2 className="m-0 text-lg font-semibold flex items-center gap-2">
        <Bell size={20} aria-hidden /> Powiadomienia
      </h2>
      <p className="mt-1 mb-4 text-sm text-[var(--color-text)]/65">
        Odświeżanie co 5 s podczas aktywnego ekranu.
      </p>

      {query.isLoading && <p className="text-sm">Ładowanie…</p>}
      {query.isError && (
        <p className="text-sm" style={{ color: 'var(--color-faults)' }}>
          Nie udało się pobrać powiadomień.
        </p>
      )}
      {!query.isLoading && items.length === 0 && (
        <p className="text-sm text-[var(--color-text)]/65">Brak powiadomień.</p>
      )}

      <ul className="m-0 p-0 list-none">
        {items.map((n) => (
          <li
            key={n.id}
            className="border border-black/5 rounded-[var(--radius-card)] bg-white p-4 mb-2"
          >
            <div className="flex justify-between gap-2">
              <p className="m-0 font-medium text-sm">{labelFor(n.type)}</p>
              {!n.read_at && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 border-0 bg-transparent cursor-pointer text-xs"
                  style={{ color: 'var(--color-action)' }}
                  onClick={async () => {
                    await markNotificationRead(n.id, user.id)
                    void qc.invalidateQueries({ queryKey: ['notifications', user.id] })
                  }}
                >
                  <Check size={14} /> Przeczytane
                </button>
              )}
            </div>
            <p className="mt-1 mb-0 text-sm text-[var(--color-text)]/75">
              {String(
                (n.payload as { message?: string; title?: string }).message ??
                  (n.payload as { title?: string }).title ??
                  n.event_key,
              )}
            </p>
            <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/50">
              {new Date(n.created_at).toLocaleString('pl-PL')}
              {n.read_at ? ' · przeczytane' : ' · nowe'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function labelFor(type: string) {
  if (type === 'threshold_reached') return 'Próg poparcia osiągnięty'
  if (type === 'application_summary') return 'Autor przygotował projekt wniosku'
  if (type === 'submitted') return 'Autor zgłosił złożenie projektu'
  if (type === 'signatures') return 'Autor deklaruje zebranie podpisów'
  if (type === 'voting_reminder') return 'Przypomnienie o głosowaniu (demo)'
  return type
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-[var(--radius-card)] bg-white p-6 border border-black/5">
        <h2 className="m-0 text-lg font-semibold">{title}</h2>
        <p className="mt-2 mb-0 text-[var(--color-text)]/80">{body}</p>
      </section>
    </div>
  )
}
