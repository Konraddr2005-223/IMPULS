/**
 * Visual identity for ideas: category icons (map pins) + photo/placeholder URLs.
 */

export type IdeaIconKind =
  | 'tree'
  | 'dog'
  | 'bike'
  | 'light'
  | 'playground'
  | 'sport'
  | 'book'
  | 'bench'
  | 'garden'
  | 'default'

export type IdeaVisualMeta = {
  kind: IdeaIconKind
  label: string
  badgeClass: string
}

const KIND_META: Record<IdeaIconKind, Omit<IdeaVisualMeta, 'kind'>> = {
  tree: {
    label: 'Zieleń miejska',
    badgeClass: 'bg-emerald-50 text-emerald-800',
  },
  dog: {
    label: 'Przestrzeń dla psów',
    badgeClass: 'bg-amber-50 text-amber-900',
  },
  bike: {
    label: 'Mobilność',
    badgeClass: 'bg-sky-50 text-sky-900',
  },
  light: {
    label: 'Bezpieczeństwo',
    badgeClass: 'bg-blue-50 text-blue-900',
  },
  playground: {
    label: 'Plac zabaw',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900',
  },
  sport: {
    label: 'Sport & rekreacja',
    badgeClass: 'bg-yellow-50 text-yellow-900',
  },
  book: {
    label: 'Kultura & integracja',
    badgeClass: 'bg-violet-50 text-violet-900',
  },
  bench: {
    label: 'Mała architektura',
    badgeClass: 'bg-stone-100 text-stone-800',
  },
  garden: {
    label: 'Ogród społeczny',
    badgeClass: 'bg-lime-50 text-lime-900',
  },
  default: {
    label: 'Pomysł sąsiedzki',
    badgeClass: 'bg-slate-100 text-slate-800',
  },
}

/** Infer map/list icon from title + description keywords. */
export function resolveIdeaIconKind(title: string, description = ''): IdeaIconKind {
  const blob = `${title} ${description}`.toLowerCase()

  if (/pies|ps[ióy]|wybieg|psi/.test(blob)) return 'dog'
  if (/rower|ścieżk[aęi].*rower|bike|pump.?track/.test(blob)) return 'bike'
  if (/oświetl|latarn|doświetl|przejśc/.test(blob)) return 'light'
  if (/plac zabaw|huśtawk|piaskownic|dzieci/.test(blob)) return 'playground'
  if (/sport|workout|siłown|pump|boisko|fitness/.test(blob)) return 'sport'
  if (/warsztat|książ|bookcrossing|kultur|bibliotek/.test(blob)) return 'book'
  if (/ogród|warzywn|zioł|skrzyni/.test(blob)) return 'garden'
  if (/ławk|ławki|odpoczyn|senior/.test(blob) && !/drzew|zieleń|zielon|nasadz/.test(blob)) {
    return 'bench'
  }
  if (/drzew|zieleń|zielon|park|skwer|nasadz|alej/.test(blob)) return 'tree'
  if (/ławk|ławki/.test(blob)) return 'bench'
  return 'default'
}

export function ideaVisualMeta(title: string, description = ''): IdeaVisualMeta {
  const kind = resolveIdeaIconKind(title, description)
  return { kind, ...KIND_META[kind] }
}

export function ideaPlaceholderSrc(kind: IdeaIconKind): string {
  return `/placeholders/idea-${kind}.svg`
}

/**
 * Prefer real photo; otherwise category placeholder.
 * Absolute paths in photo_path (e.g. /placeholders/...) are allowed for demos.
 */
export function resolveIdeaImageUrl(idea: {
  photo_path: string | null | undefined
  title: string
  description?: string
  publicUrl?: string | null
}): string {
  if (idea.publicUrl) return idea.publicUrl
  const path = idea.photo_path?.trim()
  if (path?.startsWith('/') || path?.startsWith('http')) return path
  const kind = resolveIdeaIconKind(idea.title, idea.description ?? '')
  return ideaPlaceholderSrc(kind)
}

/** Inline SVG paths for Leaflet DivIcon (no React in marker HTML). */
export const IDEA_ICON_SVG_PATHS: Record<IdeaIconKind, string> = {
  tree: `<path d="M12 22v-7"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3s-3-1-3-3"/><path d="M7 15a4 4 0 0 1 10 0c0 3-5 4-5 4s-5-1-5-4"/>`,
  dog: `<path d="M10 5.172C10 3.782 8.423 2.679 6.5 3.15c-.898.22-1.57.95-1.79 1.848-.22.898.15 1.95.95 2.5L12 12"/><path d="M14.12 14.12 18 18"/><path d="M8 12h.01"/><path d="M16 12a4 4 0 0 0-8 0v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1"/><path d="M18 8c1.5 0 2.5 1 2.5 2.5S19.5 13 18 13"/>`,
  bike: `<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h3"/>`,
  light: `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>`,
  playground: `<circle cx="12" cy="5" r="2"/><path d="m8 12 4-4 4 4"/><path d="M6 20v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M10 12v4"/><path d="M14 12v4"/>`,
  sport: `<path d="M6.5 6.5h11"/><path d="m6 12 6-3 6 3"/><path d="M6 18h12"/><path d="M12 9v9"/>`,
  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
  bench: `<path d="M4 11h16"/><path d="M4 11v6"/><path d="M20 11v6"/><path d="M6 17h12"/><path d="M8 11V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/>`,
  garden: `<path d="M12 22v-7"/><path d="M9 8c0-2 1.5-4 3-4s3 2 3 4-1.5 3-3 3-3-1-3-3"/><path d="M6 14c0-1.5 1-3 3-3"/><path d="M18 14c0-1.5-1-3-3-3"/>`,
  default: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
}
