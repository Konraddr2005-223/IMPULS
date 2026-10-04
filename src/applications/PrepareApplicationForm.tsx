import { useState } from 'react'
import { krakowAdapter } from '../city'
import { calculateCosts, formatPlnRange } from './costs'

export type CostLineDraft = { catalogId: string; quantity: number }

type PrepareApplicationFormProps = {
  initial?: CostLineDraft[]
  onCancel: () => void
  onConfirm: (items: CostLineDraft[]) => void
  busy?: boolean
}

const DEFAULTS: CostLineDraft[] = [
  { catalogId: 'bench_backrest_installation', quantity: 2 },
  { catalogId: 'tree_16_18_planting', quantity: 4 },
]

export function PrepareApplicationForm({
  initial = DEFAULTS,
  onCancel,
  onConfirm,
  busy,
}: PrepareApplicationFormProps) {
  const catalog = krakowAdapter.getCostCatalog()
  const [lines, setLines] = useState<CostLineDraft[]>(initial)
  const summary = calculateCosts(lines)

  function setQty(catalogId: string, quantity: number) {
    setLines((prev) => {
      const next = prev.filter((l) => l.catalogId !== catalogId)
      if (quantity > 0) next.push({ catalogId, quantity })
      return next
    })
  }

  return (
    <aside
      className="absolute z-10 left-2 right-2 sm:left-3 sm:right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[min(78svh,720px)] md:inset-y-3 md:left-auto md:right-3 md:bottom-3 md:max-h-none md:w-[min(400px,calc(100%-1.5rem))] rounded-[var(--radius-card)] bg-white border border-[var(--color-outline)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col ring-1 ring-black/5"
      aria-label="Przygotuj wniosek"
    >
      <div className="shrink-0 border-b border-[var(--color-outline)] px-4 py-3">
        <h2 className="m-0 text-base font-semibold">Przygotuj wniosek — zakres i ilości</h2>
        <p className="mt-1 mb-0 text-xs text-[var(--color-text-muted)]">
          Potwierdź pozycje z katalogu. Kwoty liczy backend/katalog — AI ich nie wymyśla.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
        <ul className="m-0 p-0 list-none space-y-2">
          {catalog.items.map((item) => {
            const qty = lines.find((l) => l.catalogId === item.id)?.quantity ?? 0
            return (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={qty}
                  onChange={(e) => setQty(item.id, Number(e.target.value) || 0)}
                  className="w-16 min-h-10 px-2 rounded-[var(--radius-card)] border border-black/10"
                  aria-label={`Ilość: ${item.label}`}
                />
                <span className="flex-1">
                  {item.label}
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    {item.minPln}–{item.maxPln} zł / {item.unit}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>

        <p className="m-0 text-sm font-medium">
          Rozpoznane pozycje: {formatPlnRange(summary.totalMinPln, summary.totalMaxPln)}.
        </p>
        <p className="m-0 text-xs text-[var(--color-text-muted)]">{summary.disclaimer}</p>
        <p className="m-0 text-xs text-[var(--color-text-muted)]">{catalog.taxNote}</p>
      </div>

      <div className="shrink-0 border-t border-[var(--color-outline)] bg-white px-4 py-3 flex flex-wrap gap-2 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          disabled={busy || lines.length === 0}
          onClick={() => onConfirm(lines)}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-sm font-bold cursor-pointer disabled:opacity-50"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-ink)',
          }}
        >
          {busy ? 'Generuję…' : 'Generuj dokument'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm cursor-pointer"
        >
          Anuluj
        </button>
      </div>
    </aside>
  )
}
