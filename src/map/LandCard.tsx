import { AlertCircle, CheckCircle2, ExternalLink, HelpCircle, Info, ShieldAlert, X } from 'lucide-react'
import type { LandAssessment } from '../city/types'
import { copy } from '../ui/copy'

type LandCardProps = {
  assessment: LandAssessment | null
  loading: boolean
  error: string | null
  onClose: () => void
}

const assessmentConfig: Record<
  LandAssessment['assessment'],
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  likely_suitable: {
    label: 'Wstępnie bez wykrytej przeszkody (demo)',
    bg: '#EAF7EE',
    text: '#176B4B',
    icon: CheckCircle2,
  },
  requires_review: {
    label: 'Wymaga weryfikacji',
    bg: '#EFF6FF',
    text: '#1E40AF',
    icon: AlertCircle,
  },
  planning_risk: {
    label: 'Ryzyko planistyczne',
    bg: '#FEF2F2',
    text: '#991B1B',
    icon: ShieldAlert,
  },
  no_data: {
    label: 'Brak danych w wybranym punkcie',
    bg: '#F3F4F6',
    text: '#4B5563',
    icon: HelpCircle,
  },
}

export function LandCard({ assessment, loading, error, onClose }: LandCardProps) {
  if (!loading && !assessment && !error) return null

  const config = assessment ? assessmentConfig[assessment.assessment] : null
  const StatusIcon = config?.icon ?? Info

  return (
    <aside
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[380px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-xl p-4 max-h-[85vh] overflow-y-auto flex flex-col gap-3"
      aria-live="polite"
      aria-label="Karta terenu"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-base font-semibold text-[var(--color-text)]">Karta terenu</h2>
          <span className="text-xs text-[var(--color-text)]/60">
            {assessment ? `Tryb: ${assessment.mode}` : 'Sprawdzanie punktu'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5 border-0 bg-transparent cursor-pointer"
          aria-label="Zamknij kartę terenu"
        >
          <X size={18} />
        </button>
      </div>

      {loading && (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-sm text-[var(--color-text)]/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-action)] border-t-transparent" />
          <span>Odpytuję dane MSIP Kraków i scenariusz demo…</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
          <p className="m-0 font-medium">Błąd pobierania danych:</p>
          <p className="m-0 mt-0.5">{error || copy.landError}</p>
        </div>
      )}

      {assessment && !loading && (
        <>
          {/* Status Badge */}
          {config && (
            <div
              className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold"
              style={{ background: config.bg, color: config.text }}
            >
              <StatusIcon size={16} className="shrink-0" />
              <span>{config.label}</span>
            </div>
          )}

          {/* Synthetic Demo Banner if applicable */}
          {assessment.mode === 'synthetic_demo' && (
            <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200">
              <p className="m-0 font-medium">
                Scenariusz demonstracyjny. Status nie opisuje rzeczywistej nieruchomości.
              </p>
            </div>
          )}

          {/* Section 1: Grunt i Własność */}
          <div className="rounded-lg bg-[var(--color-bg)] p-3 border border-black/5 text-xs space-y-1.5">
            <h3 className="m-0 font-semibold text-xs text-[var(--color-text)] uppercase tracking-wider text-[var(--color-text)]/70">
              1. Status i kategoria gruntu
            </h3>
            <p className="m-0 text-sm font-medium text-[var(--color-text)]">
              {assessment.ownershipRawLabel ?? 'Brak danych o władaniu'}
            </p>
            {assessment.parcelId && (
              <p className="m-0 text-[var(--color-text)]/65">
                Identyfikator działki: <code className="font-mono">{assessment.parcelId}</code>
              </p>
            )}
            {assessment.ownershipUpdatedAt && (
              <p className="m-0 text-[10px] text-[var(--color-text)]/50">
                Data zasilenia warstwy własności: {assessment.ownershipUpdatedAt}
              </p>
            )}
          </div>

          {/* Section 2: MPZP */}
          <div className="rounded-lg bg-[var(--color-bg)] p-3 border border-black/5 text-xs space-y-1.5">
            <h3 className="m-0 font-semibold text-xs text-[var(--color-text)] uppercase tracking-wider text-[var(--color-text)]/70">
              2. Przeznaczenie planistyczne (MPZP)
            </h3>
            {assessment.planning.designation || assessment.planning.planName ? (
              <>
                <p className="m-0 text-sm font-medium text-[var(--color-text)]">
                  {assessment.planning.planName ?? 'Plan miejscowy'}
                  {assessment.planning.designation ? ` · ${assessment.planning.designation}` : ''}
                </p>
                {assessment.planning.resolutionUrl && (
                  <a
                    href={assessment.planning.resolutionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-action)] underline hover:no-underline font-medium"
                  >
                    Zobacz uchwałę planu w BIP <ExternalLink size={12} />
                  </a>
                )}
              </>
            ) : (
              <p className="m-0 text-[var(--color-text)]/65">
                Brak obowiązującego planu miejscowego dla tego punktu.
              </p>
            )}
            {assessment.planningUpdatedAt && (
              <p className="m-0 text-[10px] text-[var(--color-text)]/50">
                Data zasilenia warstwy MPZP: {assessment.planningUpdatedAt}
              </p>
            )}
          </div>

          {/* Scenario description if present */}
          {assessment.scenarioDescription && (
            <p className="m-0 text-xs text-[var(--color-text)]/80 italic">
              {assessment.scenarioDescription}
            </p>
          )}

          {assessment.assessment === 'requires_review' && (
            <p className="m-0 text-xs text-[var(--color-text)]/60">
              Punkt może leżeć przy granicy działki — wynik wymaga weryfikacji.
            </p>
          )}

          {/* Warnings (excluding duplicated synthetic demo warning) */}
          {assessment.warnings.filter((w) => !w.toLowerCase().includes('scenariusz demonstracyjny')).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--color-text)]/80">Uwagi i ograniczenia:</span>
              <ul className="m-0 pl-4 text-xs text-[var(--color-text)]/80 space-y-1">
                {assessment.warnings
                  .filter((w) => !w.toLowerCase().includes('scenariusz demonstracyjny'))
                  .map((w) => (
                    <li key={w}>{w}</li>
                  ))}
              </ul>
            </div>
          )}

          <p className="m-0 text-[10px] text-[var(--color-text)]/50">
            Pobrano: {new Date(assessment.retrievedAt).toLocaleString('pl-PL')}
            {assessment.ownershipUpdatedAt
              ? ` · własność: ${assessment.ownershipUpdatedAt}`
              : ''}
            {assessment.planningUpdatedAt
              ? ` · plan: ${assessment.planningUpdatedAt}`
              : ''}
          </p>

          {/* Footer Disclaimer */}
          <div className="pt-2 border-t border-black/5 text-[11px] text-[var(--color-text)]/60 leading-tight">
            {copy.landDisclaimer}
          </div>
        </>
      )}
    </aside>
  )
}
