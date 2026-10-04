import { useEffect, useState } from 'react'
import { Bot, Sparkles, X } from 'lucide-react'
import type { IdeaRecord } from '../ideas/types'
import { copy } from '../ui/copy'
import { runBoAgent } from './api'
import { ProposalCard } from './ProposalCard'
import type { BoAgentProposal } from './schema'

type MapAgentPanelProps = {
  idea: IdeaRecord
  neighborComments: string
  landNote?: string
  onClose: () => void
  onOpenClassicPrepare: () => void
}

export function MapAgentPanel({
  idea,
  neighborComments,
  landNote,
  onClose,
  onOpenClassicPrepare,
}: MapAgentPanelProps) {
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proposal, setProposal] = useState<BoAgentProposal | null>(null)
  const [mode, setMode] = useState<string>('mock')

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    setError(null)
    setProposal(null)

    // Human place label only — never GPS coordinates in the official form field.
    const locationLabel = idea.district_code
      ? `Dzielnica ${idea.district_code}`
      : undefined

    void runBoAgent({
      ideaText: `${idea.title}. ${idea.description}`.trim(),
      location: locationLabel,
      neighborComments: neighborComments.trim() || undefined,
    })
      .then((result) => {
        if (cancelled) return
        const next = result.proposal
        // Terrain note is UI/context only — never GPS, never mixed into location.
        if (landNote?.trim()) {
          const note = landNote.trim()
          if (!next.warnings.some((w) => w.includes(note))) {
            next.warnings = [
              ...next.warnings,
              `Weryfikacja terenu (MSIP): ${note}`,
            ]
          }
        }
        setProposal(next)
        setMode(result.mode)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Nie udało się przygotować wniosku.',
        )
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })

    return () => {
      cancelled = true
    }
  }, [idea.id, idea.title, idea.description, idea.district_code, neighborComments, landNote])

  return (
    <aside
      className="absolute z-10 left-2 right-2 sm:left-3 sm:right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[min(78svh,720px)] md:inset-y-3 md:left-auto md:right-3 md:bottom-3 md:max-h-none md:w-[min(420px,calc(100%-1.5rem))] rounded-[var(--radius-card)] bg-white border border-[var(--color-outline)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col ring-1 ring-black/5"
      aria-label="Wniosek BO na mapie"
    >
      <div className="shrink-0 bg-white/95 backdrop-blur border-b border-[var(--color-outline)] px-4 py-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-base font-semibold inline-flex items-center gap-2">
            <Bot size={18} aria-hidden /> Wniosek BO
          </h2>
          <p className="m-0 mt-1 text-xs text-[var(--color-text-muted)]">
            Generowanie z pomysłu na mapie · {copy.documentDisclaimer}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 min-w-9 rounded-md border border-black/10 bg-white cursor-pointer inline-flex items-center justify-center"
          aria-label="Zamknij asystenta"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
        <p className="m-0 text-sm">
          <span className="font-medium">Pomysł:</span> {idea.title}
        </p>

        {busy && (
          <p className="m-0 text-sm text-[var(--color-text-muted)] inline-flex items-center gap-2">
            <Sparkles size={16} className="animate-pulse" />
            Przygotowuję formalny wniosek…
          </p>
        )}

        {error && (
          <p className="m-0 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {proposal && (
          <ProposalCard
            proposal={proposal}
            caption={`Szkic wniosku (${mode}) — pobierz PDF głównego dokumentu`}
            compact
          />
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--color-outline)] bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          onClick={onOpenClassicPrepare}
          className="w-full min-h-10 px-3 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-xs font-medium cursor-pointer"
        >
          Zapas: klasyczny zakres katalogu (bez Asystenta)
        </button>
      </div>
    </aside>
  )
}
