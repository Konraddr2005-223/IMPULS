import { Download, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { calculateCosts, formatPlnRange } from '../applications/costs'
import { downloadProposalPdf } from './exportProposalPdf'
import { OFFICIAL_FORM_LABELS, type BoAgentProposal } from './schema'

type ProposalCardProps = {
  proposal: BoAgentProposal
  caption?: string
  compact?: boolean
}

export function ProposalCard({
  proposal: p,
  caption,
  compact = false,
}: ProposalCardProps) {
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const costs = p.costItems.length > 0 ? calculateCosts(p.costItems) : null

  async function onPdf() {
    if (pdfBusy) return
    setPdfError(null)
    setPdfBusy(true)
    try {
      await downloadProposalPdf(p)
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : 'Nie udało się pobrać PDF.',
      )
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <article
      className={`rounded-[var(--radius-card)] bg-white border border-black/5 ${compact ? 'p-3' : 'p-4'} text-sm space-y-3`}
    >
      {caption && (
        <p className="m-0 text-xs text-[var(--color-text)]/55">{caption}</p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs uppercase tracking-wide text-[var(--color-text)]/50">
            {p.scope === 'city' ? 'Ogólnomiejski' : 'Dzielnicowy'}
            {' · '}
            {p.projectType === 'non_investment' ? 'Nieinwestycyjny' : 'Inwestycyjny'}
          </p>
          <h3 className="m-0 mt-1 text-base font-semibold">{p.title}</h3>
          <p className="m-0 mt-1 text-[var(--color-text)]/70">{p.summary}</p>
        </div>
        <button
          type="button"
          onClick={() => void onPdf()}
          disabled={pdfBusy}
          className="shrink-0 min-h-10 px-3 rounded-[var(--radius-card)] border-0 text-white text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: 'var(--color-ideas)' }}
        >
          <Download size={14} /> {pdfBusy ? 'Generuję PDF…' : 'Pobierz PDF'}
        </button>
      </div>

      {pdfError && (
        <p className="m-0 text-xs text-red-700" role="alert">
          {pdfError}
        </p>
      )}

      <Field label={OFFICIAL_FORM_LABELS.location} value={p.location} />
      <Field label={OFFICIAL_FORM_LABELS.description} value={p.description} />
      <Field label={OFFICIAL_FORM_LABELS.justification} value={p.justification} />
      <Field
        label={OFFICIAL_FORM_LABELS.targetGroups}
        value={p.targetGroups.join(', ')}
      />
      <Field label={OFFICIAL_FORM_LABELS.accessibility} value={p.accessibility} />

      {costs && (
        <div>
          <p className="m-0 font-medium">{OFFICIAL_FORM_LABELS.costEstimate}</p>
          <p className="m-0 mt-1">
            {formatPlnRange(costs.totalMinPln, costs.totalMaxPln)}
          </p>
          <ul className="m-0 mt-1 pl-4 text-xs text-[var(--color-text)]/70">
            {costs.lines.map((l) => (
              <li key={l.catalogId}>
                {l.label} × {l.quantity}:{' '}
                {formatPlnRange(l.lineMinPln, l.lineMaxPln)}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-1 text-xs text-[var(--color-text)]/55">
            {costs.disclaimer}
          </p>
        </div>
      )}

      <div>
        <p className="m-0 font-medium">{OFFICIAL_FORM_LABELS.schedule}</p>
        <ol className="m-0 mt-1 pl-4">
          {p.schedule.map((s) => (
            <li key={s.name} className="mb-1">
              <span className="font-medium">{s.name}</span>
              {s.date ? ` (${s.date})` : ''}
              <span className="block text-xs text-[var(--color-text)]/70">
                {s.description}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {p.missingInformation.length > 0 && (
        <div>
          <p className="m-0 font-medium">Brakujące informacje</p>
          <ul className="m-0 mt-1 pl-4">
            {p.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {p.warnings.length > 0 && (
        <div>
          <p className="m-0 font-medium">Ostrzeżenia</p>
          <ul className="m-0 mt-1 pl-4 text-[var(--color-text)]/75">
            {p.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="m-0 font-medium inline-flex items-center gap-1">
          <ListChecks size={16} /> {OFFICIAL_FORM_LABELS.checklist}
        </p>
        <ul className="m-0 mt-2 p-0 list-none space-y-2">
          {p.checklist.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--radius-card)] border border-black/5 bg-[var(--color-bg)] p-2"
            >
              <p className="m-0 font-medium text-sm">
                {item.required ? 'Wymagane: ' : 'Zalecane: '}
                {item.label}
              </p>
              <p className="m-0 mt-0.5 text-xs text-[var(--color-text)]/60">
                {item.reason}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="m-0 text-xs uppercase tracking-wide text-[var(--color-text)]/50">
        {label}
      </p>
      <p className="m-0 mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  )
}
