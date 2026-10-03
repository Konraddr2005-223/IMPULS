import { krakowAdapter } from '../city'

export type CostLineInput = {
  catalogId: string
  quantity: number
}

export type CostLineResult = {
  catalogId: string
  label: string
  unit: string
  quantity: number
  minPln: number
  maxPln: number
  lineMinPln: number
  lineMaxPln: number
}

export type CostSummary = {
  lines: CostLineResult[]
  totalMinPln: number
  totalMaxPln: number
  sourceLabel: string
  sourceUrl: string
  checkedAt: string
  disclaimer: string
}

export function calculateCosts(items: CostLineInput[]): CostSummary {
  const catalog = krakowAdapter.getCostCatalog()
  const lines: CostLineResult[] = []

  for (const item of items) {
    const entry = catalog.items.find((c) => c.id === item.catalogId)
    if (!entry || item.quantity <= 0) continue
    lines.push({
      catalogId: entry.id,
      label: entry.label,
      unit: entry.unit,
      quantity: item.quantity,
      minPln: entry.minPln,
      maxPln: entry.maxPln,
      lineMinPln: entry.minPln * item.quantity,
      lineMaxPln: entry.maxPln * item.quantity,
    })
  }

  const totalMinPln = lines.reduce((sum, line) => sum + line.lineMinPln, 0)
  const totalMaxPln = lines.reduce((sum, line) => sum + line.lineMaxPln, 0)

  return {
    lines,
    totalMinPln,
    totalMaxPln,
    sourceLabel: catalog.sourceLabel,
    sourceUrl: catalog.sourceUrl,
    checkedAt: catalog.checkedAt,
    disclaimer:
      'Wstępny szacunek, do weryfikacji. Nie obejmuje wszystkich kosztów projektu.',
  }
}

export function formatPlnRange(min: number, max: number): string {
  const fmt = (n: number) =>
    n.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${fmt(min)}–${fmt(max)} zł`
}
