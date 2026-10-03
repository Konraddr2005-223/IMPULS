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
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[400px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-lg p-4 max-h-[75svh] overflow-y-auto"
      aria-label="Przygotuj wniosek"
    >
      <h2 className="m-0 text-base font-semibold">Przygotuj wniosek — zakres i ilości</h2>
      <p className="mt-1 mb-3 text-xs text-[var(--color-text)]/65">
        Potwierdź pozycje z katalogu. Kwoty liczy backend/katalog — AI ich nie wymyśla.
      </p>

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
                <span className="block text-xs text-[var(--color-text)]/55">
                  {item.minPln}–{item.maxPln} zł / {item.unit}
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 mb-1 text-sm font-medium">
        Rozpoznane pozycje: {formatPlnRange(summary.totalMinPln, summary.totalMaxPln)}.
      </p>
      <p className="m-0 text-xs text-[var(--color-text)]/60">{summary.disclaimer}</p>
      <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/55">{catalog.taxNote}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || lines.length === 0}
          onClick={() => onConfirm(lines)}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--color-ideas)' }}
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
