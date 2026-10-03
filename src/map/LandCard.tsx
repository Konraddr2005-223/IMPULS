import type { LandAssessment } from '../city/types'
import { copy } from '../ui/copy'

type LandCardProps = {
  assessment: LandAssessment | null
  loading: boolean
  error: string | null
  onClose: () => void
}

const assessmentLabels: Record<LandAssessment['assessment'], string> = {
  likely_suitable: 'Wstępnie bez wykrytej przeszkody (demo)',
  requires_review: 'Wymaga weryfikacji',
  planning_risk: 'Ryzyko planistyczne',
  no_data: 'Brak danych',
}

export function LandCard({ assessment, loading, error, onClose }: LandCardProps) {
  if (!loading && !assessment && !error) return null

  return (
    <aside
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[360px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-lg p-4"
      aria-live="polite"
      aria-label="Karta terenu"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">Karta terenu</h2>
        <button
          type="button"
          onClick={onClose}
          className="border-0 bg-transparent cursor-pointer text-sm text-[var(--color-text)]/60"
          aria-label="Zamknij kartę terenu"
        >
          Zamknij
        </button>
      </div>

      {loading && <p className="mt-2 mb-0 text-sm">Sprawdzam lokalizację…</p>}
      {error && (
        <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
          {error || copy.landError}
        </p>
      )}
      <p className="mt-2 mb-0 text-xs text-[var(--color-text)]/55">{copy.landDisclaimer}</p>

      {assessment && !loading && (
        <div className="mt-2 space-y-2 text-sm">
          <p className="m-0">
            <span className="font-medium">Tryb: </span>
            {assessment.mode}
          </p>
          <p className="m-0">
            <span className="font-medium">Ocena: </span>
            {assessmentLabels[assessment.assessment]}
          </p>
          {assessment.ownershipRawLabel && (
            <p className="m-0">
              <span className="font-medium">Grunt: </span>
              {assessment.ownershipRawLabel}
            </p>
          )}
          {assessment.planning.designation && (
            <p className="m-0">
              <span className="font-medium">Plan: </span>
              {assessment.planning.planName ?? '—'} · {assessment.planning.designation}
            </p>
          )}
          {assessment.scenarioDescription && (
            <p className="m-0 text-[var(--color-text)]/75">{assessment.scenarioDescription}</p>
          )}
          {assessment.assessment === 'requires_review' && (
            <p className="m-0 text-xs text-[var(--color-text)]/60">
              Punkt może leżeć przy granicy działki — wynik wymaga weryfikacji.
            </p>
          )}
          <p className="m-0 text-xs text-[var(--color-text)]/55">
            Pobrano: {new Date(assessment.retrievedAt).toLocaleString('pl-PL')}
            {assessment.ownershipUpdatedAt
              ? ` · własność: ${assessment.ownershipUpdatedAt}`
              : ''}
            {assessment.planningUpdatedAt
              ? ` · plan: ${assessment.planningUpdatedAt}`
              : ''}
          </p>
          <ul className="m-0 pl-4">
            {assessment.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
