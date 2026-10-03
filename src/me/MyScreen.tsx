import { useQuery } from '@tanstack/react-query'
import { FileText, MapPinned } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { fetchLatestApplication } from '../applications/api'
import type { ApplicationRecord } from '../applications/types'
import { fetchPublishedIdeas } from '../ideas/api'
import { fetchFaults } from '../faults/api'
import { FAULT_STATUS_LABELS } from '../faults/api'
import { copy } from '../ui/copy'

type MyScreenProps = {
  onOpenAreas: () => void
  onOpenApplication: (app: ApplicationRecord) => void
}

export function MyScreen({ onOpenAreas, onOpenApplication }: MyScreenProps) {
  const { user, displayName, openAuthModal } = useAuth()

  const ideasQuery = useQuery({
    queryKey: ['ideas'],
    queryFn: fetchPublishedIdeas,
    enabled: Boolean(user),
  })
  const faultsQuery = useQuery({
    queryKey: ['faults'],
    queryFn: fetchFaults,
    enabled: Boolean(user),
  })

  if (!user) {
    return (
      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
        <section className="rounded-[var(--radius-card)] bg-white p-6 border border-black/5 shadow-xs">
          <h2 className="m-0 text-lg font-semibold">Moje zgłoszenia i projekty</h2>
          <p className="mt-2 mb-4 text-sm text-[var(--color-text)]/70">
            Przeglądanie aplikacji nie wymaga konta. Zaloguj się lub utwórz konto, aby zarządzać swoimi pomysłami, wnioskami BO i usterkami.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="min-h-10 px-4 rounded-xl border-0 text-white text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90 inline-flex items-center gap-1.5"
              style={{ background: 'var(--color-action)' }}
            >
              Zaloguj się
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="min-h-10 px-4 rounded-xl border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold cursor-pointer text-[var(--color-text)] inline-flex items-center gap-1.5"
            >
              Zarejestruj się
            </button>
          </div>
          <p className="mt-4 mb-0 text-[11px] text-[var(--color-text)]/55">
            {copy.authNote}
          </p>
        </section>
      </div>
    )
  }

  const myIdeas = (ideasQuery.data ?? []).filter((i) => i.author_id === user.id)
  const myFaults = (faultsQuery.data ?? []).filter((f) => f.author_id === user.id)

  return (
    <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 overflow-y-auto">
      <h2 className="m-0 text-lg font-semibold">Moje zgłoszenia</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--color-text)]/65">
        {displayName ?? user.email}. {copy.authNote}
      </p>

      <button
        type="button"
        onClick={onOpenAreas}
        className="mb-4 inline-flex items-center gap-2 min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm cursor-pointer"
        style={{ background: 'var(--color-action)' }}
      >
        <MapPinned size={16} /> Moje okolice
      </button>

      <h3 className="m-0 mb-2 text-sm font-semibold">Pomysły</h3>
      <ul className="m-0 mb-4 p-0 list-none">
        {myIdeas.map((idea) => (
          <li
            key={idea.id}
            className="border border-black/5 rounded-[var(--radius-card)] bg-white p-3 mb-2"
          >
            <p className="m-0 font-medium text-sm">{idea.title}</p>
            <p className="m-0 text-xs text-[var(--color-text)]/60">
              {idea.likes_count}/{idea.support_threshold} poparć
            </p>
            <OpenDocButton ideaId={idea.id} onOpen={onOpenApplication} />
          </li>
        ))}
        {myIdeas.length === 0 && (
          <li className="text-sm text-[var(--color-text)]/60">{copy.emptyIdeas}</li>
        )}
      </ul>

      <h3 className="m-0 mb-2 text-sm font-semibold">Usterki</h3>
      <ul className="m-0 p-0 list-none">
        {myFaults.map((fault) => (
          <li
            key={fault.id}
            className="border border-black/5 rounded-[var(--radius-card)] bg-white p-3 mb-2"
          >
            <p className="m-0 font-medium text-sm">{fault.description}</p>
            <p className="m-0 text-xs text-[var(--color-text)]/60">
              {FAULT_STATUS_LABELS[fault.status] ?? fault.status}
            </p>
          </li>
        ))}
        {myFaults.length === 0 && (
          <li className="text-sm text-[var(--color-text)]/60">Brak własnych usterek.</li>
        )}
      </ul>
    </div>
  )
}

function OpenDocButton({
  ideaId,
  onOpen,
}: {
  ideaId: string
  onOpen: (app: ApplicationRecord) => void
}) {
  const q = useQuery({
    queryKey: ['application', ideaId],
    queryFn: () => fetchLatestApplication(ideaId),
  })
  if (!q.data) return null
  return (
    <button
      type="button"
      className="mt-2 inline-flex items-center gap-1 text-sm border-0 bg-transparent cursor-pointer"
      style={{ color: 'var(--color-action)' }}
      onClick={() => onOpen(q.data!)}
    >
      <FileText size={14} /> Otwórz wniosek
    </button>
  )
}
