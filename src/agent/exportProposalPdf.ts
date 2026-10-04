import pdfMake from 'pdfmake/build/pdfmake.js'
import pdfFonts from 'pdfmake/build/vfs_fonts.js'
import { calculateCosts, formatPlnRange } from '../applications/costs'
import { OFFICIAL_FORM_LABELS, type BoAgentProposal } from './schema'

type PdfContent = Record<string, unknown> | string
type PdfDoc = {
  pageMargins: [number, number, number, number]
  defaultStyle: { font: string; fontSize: number; color: string }
  content: PdfContent[]
  styles: Record<string, Record<string, unknown>>
}

let vfsReady = false

function ensurePdfFonts() {
  if (vfsReady) return
  // pdfmake v0.2+ exposes font files as the default vfs_fonts export
  ;(pdfMake as { addVirtualFileSystem?: (vfs: unknown) => void }).addVirtualFileSystem?.(
    pdfFonts,
  )
  vfsReady = true
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paraHtml(label: string, value: string): string {
  return `<section><h2>${escapeHtml(label)}</h2><p>${escapeHtml(value).replace(/\n/g, '<br/>')}</p></section>`
}

function section(
  label: string,
  value: string,
): PdfContent[] {
  return [
    { text: label, style: 'h2', margin: [0, 10, 0, 4] },
    { text: value || '—', style: 'body', margin: [0, 0, 0, 4] },
  ]
}

function slugify(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/ł/gi, 'l')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'wniosek-BO'
  )
}

/** Build printable HTML (tests / fallback preview). */
export function buildProposalPrintHtml(proposal: BoAgentProposal): string {
  const costs =
    proposal.costItems.length > 0 ? calculateCosts(proposal.costItems) : null
  const scopeLabel =
    proposal.scope === 'city' ? 'Ogólnomiejski' : 'Dzielnicowy'
  const typeLabel =
    proposal.projectType === 'non_investment'
      ? 'Nieinwestycyjny'
      : 'Inwestycyjny'

  const costBlock = costs
    ? `<section><h2>${escapeHtml(OFFICIAL_FORM_LABELS.costEstimate)}</h2>
      <p><strong>${escapeHtml(formatPlnRange(costs.totalMinPln, costs.totalMaxPln))}</strong></p>
      <ul>${costs.lines
        .map(
          (l) =>
            `<li>${escapeHtml(l.label)} × ${l.quantity} — ${escapeHtml(formatPlnRange(l.lineMinPln, l.lineMaxPln))}</li>`,
        )
        .join('')}</ul>
      <p class="muted">${escapeHtml(costs.disclaimer)}</p></section>`
    : `<section><h2>${escapeHtml(OFFICIAL_FORM_LABELS.costEstimate)}</h2><p>Brak rozpoznanych pozycji katalogu — uzupełnij przed złożeniem w systemie miasta.</p></section>`

  const scheduleBlock = `<section><h2>${escapeHtml(OFFICIAL_FORM_LABELS.schedule)}</h2><ol>${proposal.schedule
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.name)}</strong>${s.date ? ` (${escapeHtml(s.date)})` : ''}<br/>${escapeHtml(s.description)}</li>`,
    )
    .join('')}</ol></section>`

  const checklist = `<section><h2>${escapeHtml(OFFICIAL_FORM_LABELS.checklist)}</h2><ol>${proposal.checklist
    .map(
      (item) =>
        `<li><strong>${item.required ? 'Wymagane' : 'Zalecane'}:</strong> ${escapeHtml(item.label)}<br/><span class="muted">${escapeHtml(item.reason)}</span></li>`,
    )
    .join('')}</ol></section>`

  const missing =
    proposal.missingInformation.length > 0
      ? `<section><h2>Brakujące informacje (do uzupełnienia przed złożeniem)</h2><ul>${proposal.missingInformation.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></section>`
      : ''

  const warnings =
    proposal.warnings.length > 0
      ? `<section><h2>Ostrzeżenia</h2><ul>${proposal.warnings.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></section>`
      : ''

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(proposal.title)} — propozycja zadania BO Kraków</title>
<style>
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #17212B; line-height: 1.45; font-size: 11pt; }
  h1 { font-size: 16pt; margin: 0 0 4pt; color: #176B4B; }
  h2 { font-size: 11pt; margin: 14pt 0 6pt; border-bottom: 1px solid #176B4B; padding-bottom: 3pt; color: #176B4B; }
  .step { font-size: 9.5pt; color: #666; margin: 12pt 0 0; text-transform: uppercase; letter-spacing: 0.04em; }
  .muted { color: #666; font-size: 9.5pt; }
  .banner { background: #F7F8FA; border: 1px solid #e5e5e5; padding: 8pt 10pt; margin-bottom: 14pt; font-size: 9.5pt; }
</style>
</head>
<body>
  <p class="banner">Robocza treść Formularza zgłoszenia projektu Budżetu Obywatelskiego Miasta Krakowa.</p>
  <h1>${escapeHtml(proposal.title)}</h1>
  <p>${escapeHtml(OFFICIAL_FORM_LABELS.scope)}: <strong>${scopeLabel}</strong>
  · ${escapeHtml(OFFICIAL_FORM_LABELS.projectType)}: <strong>${typeLabel}</strong></p>
  <p class="step">Krok 1 — Podstawowe dane</p>
  ${paraHtml(OFFICIAL_FORM_LABELS.summary, proposal.summary)}
  ${paraHtml(OFFICIAL_FORM_LABELS.location, proposal.location)}
  <p class="step">Krok 2 — Opis</p>
  ${paraHtml(OFFICIAL_FORM_LABELS.description, proposal.description)}
  ${paraHtml(OFFICIAL_FORM_LABELS.justification, proposal.justification)}
  ${paraHtml(OFFICIAL_FORM_LABELS.targetGroups, proposal.targetGroups.join(', '))}
  ${paraHtml(OFFICIAL_FORM_LABELS.accessibility, proposal.accessibility)}
  <p class="step">Krok 3 — Kosztorys i harmonogram</p>
  ${costBlock}
  ${scheduleBlock}
  ${missing}
  ${warnings}
  <p class="step">Po złożeniu w systemie miasta</p>
  ${checklist}
</body>
</html>`
}

function buildProposalPdfDoc(proposal: BoAgentProposal): PdfDoc {
  const costs =
    proposal.costItems.length > 0 ? calculateCosts(proposal.costItems) : null
  const scopeLabel =
    proposal.scope === 'city' ? 'Ogólnomiejski' : 'Dzielnicowy'
  const typeLabel =
    proposal.projectType === 'non_investment'
      ? 'Nieinwestycyjny'
      : 'Inwestycyjny'

  const content: PdfContent[] = [
    {
      text: 'Budżet Obywatelski Miasta Krakowa — propozycja zadania (robocza)',
      style: 'docTitle',
      margin: [0, 0, 0, 6],
    },
    {
      text: 'Przygotowano w aplikacji IMPULS. To nie jest złożenie w systemie miasta (budzet.krakow.pl).',
      style: 'banner',
      margin: [0, 0, 0, 12],
    },
    { text: proposal.title, style: 'h1', margin: [0, 0, 0, 6] },
    {
      text: `${OFFICIAL_FORM_LABELS.scope}: ${scopeLabel}  ·  ${OFFICIAL_FORM_LABELS.projectType}: ${typeLabel}`,
      style: 'meta',
      margin: [0, 0, 0, 10],
    },
    { text: 'Krok 1 — Podstawowe dane', style: 'step' },
    ...section(OFFICIAL_FORM_LABELS.summary, proposal.summary),
    ...section(OFFICIAL_FORM_LABELS.location, proposal.location),
    { text: 'Krok 2 — Opis', style: 'step', margin: [0, 12, 0, 0] },
    ...section(OFFICIAL_FORM_LABELS.description, proposal.description),
    ...section(OFFICIAL_FORM_LABELS.justification, proposal.justification),
    ...section(OFFICIAL_FORM_LABELS.targetGroups, proposal.targetGroups.join(', ')),
    ...section(OFFICIAL_FORM_LABELS.accessibility, proposal.accessibility),
    { text: 'Krok 3 — Kosztorys i harmonogram', style: 'step', margin: [0, 12, 0, 0] },
    {
      text: OFFICIAL_FORM_LABELS.costEstimate,
      style: 'h2',
      margin: [0, 10, 0, 4],
    },
  ]

  if (costs) {
    content.push({
      text: formatPlnRange(costs.totalMinPln, costs.totalMaxPln),
      bold: true,
      margin: [0, 0, 0, 4],
    })
    content.push({
      ul: costs.lines.map(
        (l) =>
          `${l.label} × ${l.quantity} — ${formatPlnRange(l.lineMinPln, l.lineMaxPln)}`,
      ),
      style: 'body',
      margin: [0, 0, 0, 4],
    })
    content.push({ text: costs.disclaimer, style: 'muted', margin: [0, 0, 0, 6] })
  } else {
    content.push({
      text: 'Brak rozpoznanych pozycji katalogu — uzupełnij przed złożeniem w systemie miasta.',
      style: 'body',
      margin: [0, 0, 0, 6],
    })
  }

  content.push({
    text: OFFICIAL_FORM_LABELS.schedule,
    style: 'h2',
    margin: [0, 8, 0, 4],
  })
  content.push({
    ol: proposal.schedule.map(
      (s) => `${s.name}${s.date ? ` (${s.date})` : ''}: ${s.description}`,
    ),
    style: 'body',
    margin: [0, 0, 0, 6],
  })

  if (proposal.missingInformation.length > 0) {
    content.push({
      text: 'Brakujące informacje (do uzupełnienia przed złożeniem)',
      style: 'h2',
      margin: [0, 8, 0, 4],
    })
    content.push({
      ul: proposal.missingInformation,
      style: 'body',
    })
  }

  if (proposal.warnings.length > 0) {
    content.push({
      text: 'Ostrzeżenia',
      style: 'h2',
      margin: [0, 8, 0, 4],
    })
    content.push({
      ul: proposal.warnings,
      style: 'body',
    })
  }

  content.push({
    text: 'Po złożeniu w systemie miasta',
    style: 'step',
    margin: [0, 12, 0, 0],
  })
  content.push({
    text: OFFICIAL_FORM_LABELS.checklist,
    style: 'h2',
    margin: [0, 8, 0, 4],
  })
  content.push({
    ol: proposal.checklist.map(
      (item) =>
        `${item.required ? 'Wymagane' : 'Zalecane'}: ${item.label} — ${item.reason}`,
    ),
    style: 'body',
  })

  return {
    pageMargins: [48, 48, 48, 48],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#17212B',
    },
    content,
    styles: {
      docTitle: { fontSize: 11, bold: true },
      banner: { fontSize: 9, color: '#555555' },
      h1: { fontSize: 16, bold: true, color: '#176B4B' },
      h2: { fontSize: 11, bold: true, color: '#176B4B' },
      step: {
        fontSize: 9,
        bold: true,
        color: '#666666',
        characterSpacing: 0.4,
      },
      meta: { fontSize: 9, color: '#555555' },
      body: { fontSize: 10, lineHeight: 1.35 },
      muted: { fontSize: 8.5, color: '#666666' },
    },
  }
}

/**
 * Download a real PDF file (no popup / print window).
 * Uses pdfmake + Roboto (Polish diacritics OK).
 */
export async function downloadProposalPdf(
  proposal: BoAgentProposal,
): Promise<void> {
  ensurePdfFonts()
  const doc = buildProposalPdfDoc(proposal)
  const pdf = (
    pdfMake as {
      createPdf: (def: PdfDoc) => { getBlob: () => Promise<Blob> }
    }
  ).createPdf(doc)
  const blob = await pdf.getBlob()
  if (!blob || blob.size < 100) {
    throw new Error('Nie udało się wygenerować pliku PDF.')
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(proposal.title)}-wniosek-BO.pdf`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after the browser starts the download
  setTimeout(() => URL.revokeObjectURL(url), 2_000)
}
