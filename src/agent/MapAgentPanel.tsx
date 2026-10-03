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
        const proposal = result.proposal
        // Terrain note is UI/context only — never GPS, never mixed into location.
        if (landNote?.trim()) {
          const note = landNote.trim()
          if (!proposal.warnings.some((w) => w.includes(note))) {
            proposal.warnings = [
              ...proposal.warnings,
              `Weryfikacja terenu (MSIP): ${note}`,
            ]
          }
        }
        setProposal(proposal)
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
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[420px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-lg max-h-[78svh] overflow-y-auto"
      aria-label="Asystent BO na mapie"
    >
      <div className="sticky top-0 z-[1] bg-white/95 backdrop-blur border-b border-black/5 px-4 py-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-base font-semibold inline-flex items-center gap-2">
            <Bot size={18} aria-hidden /> Wniosek BO
          </h2>
          <p className="m-0 mt-1 text-xs text-[var(--color-text)]/65">
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

      <div className="p-4 space-y-3">
        <p className="m-0 text-sm">
          <span className="font-medium">Pomysł:</span> {idea.title}
        </p>

        {busy && (
          <p className="m-0 text-sm text-[var(--color-text)]/70 inline-flex items-center gap-2">
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
