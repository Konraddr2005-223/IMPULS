import { useMemo, useState } from 'react'
import { listIdeaLikerIds } from '../ideas/likes'
import { useAuth } from '../auth/AuthContext'
import { krakowAdapter } from '../city'
import { sendVotingReminderDemo } from '../notifications/votingReminder'
import { copy } from '../ui/copy'
import { saveApplicationContent } from './api'
import { calculateCosts, formatPlnRange } from './costs'
import { FALLBACK_EXAMPLE_APPLICATION } from './fallbackExample'
import { copyApplicationToClipboard } from './formatDocument'
import {
  publishApplicationSummary,
  reportSignatures,
  reportSubmission,
} from './reports'
import type { ApplicationContent, ApplicationRecord } from './types'
import { validateApplicationContent } from './validateContent'

type ApplicationEditorProps = {
  application: ApplicationRecord
  ideaTitle?: string
  onClose: () => void
  onSaved?: (app: ApplicationRecord) => void
}

export function ApplicationEditor({
  application: initial,
  ideaTitle = 'Pomysł',
  onClose,
  onSaved,
}: ApplicationEditorProps) {
  const { user } = useAuth()
  const [application, setApplication] = useState(initial)
  const [content, setContent] = useState<ApplicationContent | null>(
    initial.content_json,
  )
  const projectType =
    content?.projectType ??
    (content?.participants != null ? 'non_investment' : 'investment')
  const instructions = krakowAdapter.getSubmissionInstructions()
  const template = krakowAdapter.getApplicationTemplate(projectType)
  const catalog = krakowAdapter.getCostCatalog()
  const [officialId, setOfficialId] = useState(initial.official_project_id ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const validation = useMemo(
    () => (content ? validateApplicationContent(content) : null),
    [content],
  )
  const costs = content ? calculateCosts(content.costItems) : null
  const isAuthor = user?.id === application.author_id
  const titleMax = template.fields.find((f) => f.id === 'title')?.maxLength ?? 60
  const summaryMin = template.fields.find((f) => f.id === 'summary')?.minLength ?? 60
  const summaryMax = template.fields.find((f) => f.id === 'summary')?.maxLength ?? 250

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

  function patch<K extends keyof ApplicationContent>(key: K, value: ApplicationContent[K]) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              withFeedback(async () => {
                await copyApplicationToClipboard(content)
                setMessage('Skopiowano treść wniosku do schowka.')
              })
            }
            className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm font-medium cursor-pointer"
          >
            Kopiuj
          </button>
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
            onClick={() => {
              setContent({ ...FALLBACK_EXAMPLE_APPLICATION })
              setMessage('Wczytano przykład awaryjny (oznaczony w ostrzeżeniach).')
              setError(null)
            }}
            className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm font-medium cursor-pointer"
          >
            Przykład awaryjny
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

      {(message || error) && (
        <p
          className="mt-0 mb-2 text-sm print:hidden"
          style={{ color: error ? 'var(--color-faults)' : 'var(--color-ideas)' }}
        >
          {error ?? message}
        </p>
      )}

      <p className="mt-0 mb-2 text-sm text-[var(--color-text)]/70 print:hidden">
        {copy.documentDisclaimer}
      </p>
      <p className="mt-0 mb-3 text-xs text-[var(--color-text)]/55 print:hidden">
        {copy.templateStale} Generator: <strong>{content.generator}</strong> · model:{' '}
        {application.model ?? '—'}.{' '}
        {content.generator === 'mock'
          ? 'Ujawnienie AI: treść powstała lokalnym szablonem mock (bez OpenAI).'
          : 'Ujawnienie AI: treść wygenerowana modelem OpenAI; koszty z katalogu miejskiego.'}
      </p>

      <article
        className="rounded-[var(--radius-card)] bg-white p-5 border border-black/5 print:border-0"
        aria-label="Treść wniosku"
      >
        <label className="flex flex-col gap-1 text-sm print:hidden">
          Tytuł ({content.title.length}/{titleMax})
          <input
            value={content.title}
            maxLength={titleMax}
            disabled={!isAuthor}
            onChange={(e) => patch('title', e.target.value)}
            className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
          />
        </label>
        <h1 className="mt-3 mb-2 text-xl font-semibold hidden print:block">{content.title}</h1>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          Krótki opis ({content.summary.length}/{summaryMax}, min {summaryMin})
          <textarea
            rows={3}
            value={content.summary}
            maxLength={summaryMax}
            disabled={!isAuthor}
            onChange={(e) => patch('summary', e.target.value)}
            className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y print:border-0"
          />
        </label>

        {(
          [
            ['location', 'Lokalizacja'],
            ['description', 'Opis szczegółowy'],
            ['justification', 'Uzasadnienie'],
            ['accessibility', 'Ogólnodostępność'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mt-3 flex flex-col gap-1 text-sm">
            {label}
            <textarea
              rows={key === 'description' ? 4 : 2}
              value={content[key]}
              disabled={!isAuthor}
              onChange={(e) => patch(key, e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y"
            />
          </label>
        ))}

        {projectType === 'non_investment' && (
          <>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              Uczestnicy / odbiorcy
              <textarea
                rows={2}
                value={content.participants ?? ''}
                disabled={!isAuthor}
                onChange={(e) => patch('participants', e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              Materiały i sprzęt (bez inwestycji budowlanej)
              <textarea
                rows={2}
                value={content.equipment ?? ''}
                disabled={!isAuthor}
                onChange={(e) => patch('equipment', e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y"
              />
            </label>
          </>
        )}

        <p className="mt-3 mb-0 text-xs text-[var(--color-text)]/55">
          Wariant szablonu:{' '}
          {projectType === 'non_investment' ? 'nieinwestycyjny' : 'inwestycyjny'} · v
          {template.version}
        </p>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Harmonogram</h3>
        <ul className="m-0 pl-5 text-sm">
          {content.schedule.map((step) => (
            <li key={step.name}>
              <strong>{step.name}:</strong> {step.description}
            </li>
          ))}
        </ul>

        {costs && (
          <>
            <h3 className="mt-4 mb-2 text-sm font-semibold">Kosztorys (katalog)</h3>
            <ul className="m-0 pl-5 text-sm">
              {costs.lines.map((line) => (
                <li key={line.catalogId}>
                  {line.quantity} × {line.label}:{' '}
                  {formatPlnRange(line.lineMinPln, line.lineMaxPln)}
                </li>
              ))}
            </ul>
            <p className="mt-2 mb-0 text-sm font-medium">
              Rozpoznane pozycje: {formatPlnRange(costs.totalMinPln, costs.totalMaxPln)}.{' '}
              {costs.disclaimer}
            </p>
            <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/60">{catalog.taxNote}</p>
          </>
        )}

        <h3 className="mt-4 mb-2 text-sm font-semibold">Braki informacji</h3>
        <ul className="m-0 pl-5 text-sm">
          {content.missingInformation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Ostrzeżenia</h3>
        <ul className="m-0 pl-5 text-sm">
          {content.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>

        <h3 className="mt-4 mb-2 text-sm font-semibold">{instructions.title}</h3>
        <p className="m-0 text-sm">{instructions.simulationNotice}</p>
        <ol className="mt-2 mb-0 pl-5 text-sm">
          {instructions.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      {validation && !validation.ok && (
        <ul className="mt-3 text-sm" style={{ color: 'var(--color-faults)' }}>
          {validation.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {isAuthor && (
        <section className="mt-4 rounded-[var(--radius-card)] bg-white p-4 border border-black/5 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || (validation ? !validation.ok : true)}
              className="min-h-11 px-3 rounded-[var(--radius-card)] border-0 text-white text-sm cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-ideas)' }}
              onClick={() =>
                withFeedback(async () => {
                  setSaving(true)
                  try {
                    const saved = await saveApplicationContent(
                      application.id,
                      user!.id,
                      content,
                    )
                    setApplication(saved)
                    onSaved?.(saved)
                  } finally {
                    setSaving(false)
                  }
                })
              }
            >
              Zapisz poprawki
            </button>
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
                  ),
                )
              }
            >
              Opublikuj streszczenie → sąsiedzi
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
                  ),
                )
              }
            >
              Zgłoś złożenie
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
                  ),
                )
              }
            >
              Zadeklaruj podpisy
            </button>
            <button
              type="button"
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm cursor-pointer"
              onClick={() =>
                withFeedback(async () => {
                  const ids = await listIdeaLikerIds(application.idea_id)
                  await sendVotingReminderDemo({
                    recipientIds: ids.filter((id) => id !== user!.id),
                    ideaId: application.idea_id,
                    ideaTitle,
                  })
                })
              }
            >
              Demo: przypomnienie o głosowaniu
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
