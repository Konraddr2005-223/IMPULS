import { useEffect, useState } from 'react'
import { copy } from '../ui/copy'
import {
  FAULT_STATUS_LABELS,
  fetchFaultStatusHistory,
  updateFaultStatus,
} from './api'
import type { FaultRecord, FaultStatus, FaultStatusEvent } from './types'

type FaultDetailCardProps = {
  fault: FaultRecord
  userId: string | null
  onClose: () => void
  onUpdated: (fault?: FaultRecord) => void
}

const NEXT: Partial<Record<string, FaultStatus[]>> = {
  new: ['community_confirmed', 'author_resolved', 'city_repair_sim'],
  community_confirmed: ['author_resolved', 'city_repair_sim'],
  city_repair_sim: ['author_resolved'],
  author_resolved: [],
}

export function FaultDetailCard({
  fault,
  userId,
  onClose,
  onUpdated,
}: FaultDetailCardProps) {
  const [history, setHistory] = useState<FaultStatusEvent[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAuthor = Boolean(userId && userId === fault.author_id)
  const nextStatuses = NEXT[fault.status] ?? []

  useEffect(() => {
    void fetchFaultStatusHistory(fault.id)
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [fault.id, fault.status])

  async function changeStatus(next: FaultStatus) {
    if (!userId || !isAuthor || busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await updateFaultStatus({
        faultId: fault.id,
        actorId: userId,
        nextStatus: next,
      })
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić statusu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[360px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-lg p-4 max-h-[70vh] overflow-y-auto"
      aria-label="Szczegóły usterki"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">Usterka</h2>
        <button
          type="button"
          onClick={onClose}
          className="border-0 bg-transparent cursor-pointer text-sm text-[var(--color-text)]/60"
        >
          Zamknij
        </button>
      </div>
      <p className="mt-2 mb-0 text-sm">{fault.description}</p>
      <p className="mt-2 mb-0 text-sm">
        <span className="font-medium">Status: </span>
        {FAULT_STATUS_LABELS[fault.status] ?? fault.status}
      </p>
      <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/55">{copy.faultDisclaimer}</p>

      {isAuthor && nextStatuses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              onClick={() => void changeStatus(status)}
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              → {FAULT_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}

      <h3 className="mt-4 mb-1 text-sm font-semibold">Historia statusu</h3>
      {history.length === 0 ? (
        <p className="m-0 text-xs text-[var(--color-text)]/55">
          Brak historii (uruchom migrację fault_status_events).
        </p>
      ) : (
        <ol className="m-0 pl-4 text-xs space-y-1">
          {history.map((ev) => (
            <li key={ev.id}>
              {FAULT_STATUS_LABELS[ev.to_status] ?? ev.to_status}
              {ev.note ? ` — ${ev.note}` : ''}{' '}
              <span className="text-[var(--color-text)]/45">
                {new Date(ev.created_at).toLocaleString('pl-PL')}
              </span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
          {error}
        </p>
      )}
    </aside>
  )
}
