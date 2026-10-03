import { useState } from 'react'
import type { IdeaRecord } from './types'

type IdeaDetailCardProps = {
  idea: IdeaRecord
  liked: boolean
  canLike: boolean
  onLikeToggle: (liked: boolean) => Promise<void>
  onClose: () => void
  onCheckLand: () => void
}

export function IdeaDetailCard({
  idea,
  liked,
  canLike,
  onLikeToggle,
  onClose,
  onCheckLand,
}: IdeaDetailCardProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reached =
    idea.likes_count >= idea.support_threshold

  async function toggle() {
    if (!canLike || busy) return
    setBusy(true)
    setError(null)
    try {
      await onLikeToggle(!liked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać lajka.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[380px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-lg p-4 max-h-[70svh] overflow-y-auto"
      aria-label="Szczegóły pomysłu"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">{idea.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="border-0 bg-transparent cursor-pointer text-sm text-[var(--color-text)]/60"
          aria-label="Zamknij szczegóły pomysłu"
        >
          Zamknij
        </button>
      </div>

      <p className="mt-2 mb-0 text-sm text-[var(--color-text)]/80 whitespace-pre-wrap">
        {idea.description}
      </p>

      <dl className="mt-3 mb-0 grid gap-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-text)]/60">Dzielnica</dt>
          <dd className="m-0 font-medium">{idea.district_code ?? 'Kraków'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-text)]/60">Kategoria</dt>
          <dd className="m-0 font-medium">
            {idea.category === 'non_investment' ? 'Nieinwestycyjny' : 'Inwestycyjny'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-text)]/60">Poparcie</dt>
          <dd className="m-0 font-medium">
            {idea.likes_count}/{idea.support_threshold}
            {reached ? ' · próg osiągnięty' : ''}
          </dd>
        </div>
      </dl>

      <p className="mt-3 mb-0 text-xs text-[var(--color-text)]/60">
        Próg ustalony przez autora: {idea.support_threshold}{' '}
        {idea.support_threshold === 1 ? 'osoba' : 'osób'}. To sygnał zainteresowania, nie
        wymóg urzędu. Lajki nie są podpisami ani głosami w BO.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={!canLike || busy}
          aria-pressed={liked}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
          style={{ background: liked ? 'var(--color-ideas)' : 'var(--color-action)' }}
        >
          {busy ? 'Zapisuję…' : liked ? 'Cofnij lajk' : 'Lubię to'}
        </button>
        <button
          type="button"
          onClick={onCheckLand}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm font-medium cursor-pointer"
        >
          Sprawdź teren
        </button>
      </div>

      {!canLike && (
        <p className="mt-2 mb-0 text-xs text-[var(--color-text)]/60">
          Zaloguj się (Autor / Sąsiad), aby dodać lajk.
        </p>
      )}
      {error && (
        <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
          {error}
        </p>
      )}
    </aside>
  )
}
