import { calculateCosts, formatPlnRange } from './costs'
import type { ApplicationRecord } from './types'

type ApplicationEditorProps = {
  application: ApplicationRecord
  onClose: () => void
}

export function ApplicationEditor({ application, onClose }: ApplicationEditorProps) {
  const content = application.content_json
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

  function printDocument() {
    window.print()
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 print:max-w-none print:px-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <h2 className="m-0 text-lg font-semibold">Roboczy wniosek BO</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={printDocument}
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
        <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/60">
          Źródło: {costs.sourceLabel} ({costs.checkedAt}).{' '}
          <a href={costs.sourceUrl} target="_blank" rel="noreferrer">
            Cennik
          </a>
        </p>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Braki informacji</h3>
        <ul className="m-0 pl-5 text-sm">
          {content.missingInformation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
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
