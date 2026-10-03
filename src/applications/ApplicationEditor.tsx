import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { krakowAdapter } from '../city'
import { copy } from '../ui/copy'
import { calculateCosts, formatPlnRange } from './costs'
import {
  publishApplicationSummary,
  reportSignatures,
  reportSubmission,
} from './reports'
import type { ApplicationRecord } from './types'

type ApplicationEditorProps = {
  application: ApplicationRecord
  ideaTitle?: string
  onClose: () => void
}

export function ApplicationEditor({
  application,
  ideaTitle = 'Pomysł',
  onClose,
}: ApplicationEditorProps) {
  const { user } = useAuth()
  const content = application.content_json
  const instructions = krakowAdapter.getSubmissionInstructions()
  const [officialId, setOfficialId] = useState(
    application.official_project_id ?? '',
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!content) {
    return (
      <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-6">
        <p>Brak treści dokumentu.</p>
        <button type="button" onClick={onClose}>
          Wróć
        </button>
      </div>
    )
  }

  const costs = calculateCosts(content.costItems)
  const isAuthor = user?.id === application.author_id

  async function withFeedback(fn: () => Promise<void>) {
    setError(null)
    setMessage(null)
    try {
      await fn()
      setMessage('Zapisano.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operacja nie powiodła się.')
    }
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 print:max-w-none print:px-0 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <h2 className="m-0 text-lg font-semibold">Roboczy wniosek BO</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-action)' }}
          >
            Drukuj / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm font-medium cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>

      <p className="mt-0 mb-3 text-sm text-[var(--color-text)]/70 print:hidden">
        {copy.documentDisclaimer}
      </p>
      <p className="mt-0 mb-3 text-xs text-[var(--color-text)]/55 print:hidden">
        {copy.templateStale}
      </p>

      <article
        className="rounded-[var(--radius-card)] bg-white p-5 border border-black/5 print:border-0"
        aria-label="Treść wniosku"
      >
        <p className="m-0 text-xs text-[var(--color-text)]/60">
          {content.warnings.join(' · ')} · status: {application.generation_status} · model:{' '}
          {application.model}
        </p>
        <h1 className="mt-3 mb-2 text-xl font-semibold">{content.title}</h1>
        <p className="mt-0 text-sm">{content.summary}</p>

        <Section title="Lokalizacja">{content.location}</Section>
        <Section title="Opis szczegółowy">{content.description}</Section>
        <Section title="Uzasadnienie">{content.justification}</Section>
        <Section title="Ogólnodostępność">{content.accessibility}</Section>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Harmonogram</h3>
        <ul className="m-0 pl-5 text-sm">
          {content.schedule.map((step) => (
            <li key={step.name}>
              <strong>{step.name}:</strong> {step.description}
            </li>
          ))}
        </ul>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Kosztorys (katalog)</h3>
        <ul className="m-0 pl-5 text-sm">
          {costs.lines.map((line) => (
            <li key={line.catalogId}>
              {line.quantity} × {line.label}: {formatPlnRange(line.lineMinPln, line.lineMaxPln)}
            </li>
          ))}
        </ul>
        <p className="mt-2 mb-0 text-sm font-medium">
          Rozpoznane pozycje: {formatPlnRange(costs.totalMinPln, costs.totalMaxPln)}.{' '}
          {costs.disclaimer}
        </p>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Braki informacji</h3>
        <ul className="m-0 pl-5 text-sm">
          {content.missingInformation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-4 mb-2 text-sm font-semibold">{instructions.title}</h3>
        <p className="m-0 text-sm">{instructions.simulationNotice}</p>
        <ol className="mt-2 mb-0 pl-5 text-sm">
          {instructions.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-2 mb-0 text-sm">
          <a href={instructions.officialFormUrl} target="_blank" rel="noreferrer">
            Oficjalny system BO
          </a>
          {' · '}
          <a href={instructions.signatureListUrl} target="_blank" rel="noreferrer">
            Listy poparcia
          </a>
        </p>
      </article>

      {isAuthor && (
        <section className="mt-4 rounded-[var(--radius-card)] bg-white p-4 border border-black/5 print:hidden">
          <h3 className="m-0 text-sm font-semibold">Deklaracje autora</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm cursor-pointer"
              onClick={() =>
                withFeedback(() =>
                  publishApplicationSummary(
                    application.id,
                    user!.id,
                    application.idea_id,
                    ideaTitle,
                    [user!.id],
                  ),
                )
              }
            >
              Opublikuj streszczenie
            </button>
          </div>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            Oficjalny numer projektu
            <input
              value={officialId}
              onChange={(e) => setOfficialId(e.target.value)}
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 px-3 rounded-[var(--radius-card)] border-0 text-white text-sm cursor-pointer"
              style={{ background: 'var(--color-action)' }}
              onClick={() =>
                withFeedback(() =>
                  reportSubmission(
                    application.id,
                    user!.id,
                    officialId,
                    application.idea_id,
                    ideaTitle,
                    [user!.id],
                  ),
                )
              }
            >
              Zgłoś złożenie w systemie miasta
            </button>
            <button
              type="button"
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm cursor-pointer"
              onClick={() =>
                withFeedback(() =>
                  reportSignatures(
                    application.id,
                    user!.id,
                    application.idea_id,
                    ideaTitle,
                    [user!.id],
                  ),
                )
              }
            >
              Zadeklaruj zebranie podpisów
            </button>
          </div>
          {message && (
            <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-ideas)' }}>
              {message}
            </p>
          )}
          {error && (
            <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <>
      <h3 className="mt-4 mb-1 text-sm font-semibold">{title}</h3>
      <p className="m-0 text-sm whitespace-pre-wrap">{children}</p>
    </>
  )
}
