/**
 * Strip meta / assistant voice and GPS coordinates from BO application fields.
 * The document must read as an official city submission, not a chat summary.
 *
 * Note: JS `\b` is ASCII-only — do not use it after Polish letters (ł, ą, …).
 */

const BOUND = '(?:(?=[\\s.,;:!?…\'"»«)\\]])|$)'

const COORD_PAIR_RE =
  /\b\d{1,3}[.,]\d{3,8}\s*[,;]\s*\d{1,3}[.,]\d{3,8}\b/g
const COORD_LABEL_RE =
  /\b(?:wsp[óo]łrz[eę]dn[ae]|wspolrzedne|lat(?:itude)?|lng|lon(?:gitude)?|gps)\s*[:.]?\s*/gi

const META_VOICE_RE = [
  new RegExp(`\\bautor(?:ka)?\\s+wskazał[ay]?${BOUND}`, 'gi'),
  new RegExp(`\\bautor(?:ka)?\\s+zgłosił[ay]?${BOUND}`, 'gi'),
  new RegExp(`\\bautor(?:ka)?\\s+napisał[ay]?${BOUND}`, 'gi'),
  new RegExp(`\\bwskazan[eyoa]\\s+przez\\s+autora(?:ki)?${BOUND}`, 'gi'),
  new RegExp(`\\bzgłoszon[eyoa]\\s+przez\\s+autora(?:ki)?${BOUND}`, 'gi'),
  new RegExp(`\\bopisane\\s+przez\\s+autora(?:ki)?${BOUND}`, 'gi'),
  new RegExp(
    `\\bużytkownik\\s+(?:wskazał|napisał|zgłosił)[ay]?${BOUND}`,
    'gi',
  ),
  new RegExp(`\\bzgodnie\\s+z\\s+pomysłem\\s+autora(?:ki)?${BOUND}`, 'gi'),
  new RegExp(`\\bw\\s+aplikacji\\s+S[aą]siedzki${BOUND}`, 'gi'),
  new RegExp(`\\brobocz[aey]\\s+treść(?:ią)?${BOUND}`, 'gi'),
  new RegExp(`\\bdo\\s+sprawdzenia\\s+przez\\s+autora(?:ki)?${BOUND}`, 'gi'),
  new RegExp(
    `\\buwagi\\s+s[aą]siad[oó]w\\s+wskazane\\s+przez\\s+autora(?:ki)?\\s*:?\\s*`,
    'gi',
  ),
  new RegExp(`\\bw\\s+treści\\s+uwzgl[eę]dniono\\s+`, 'gi'),
  new RegExp(
    `\\bokolic[ye]\\s+wskazan[eyoa]\\s+przez\\s+autora(?:ki)?${BOUND}`,
    'gi',
  ),
  /\bOcena\s+terenu\s*:[^.·\n]*/gi,
  /\bScenariusz\s+demonstracyjny[^.·\n]*/gi,
]

function cleanSpaces(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[\s·,;:-]+|[\s·,;:-]+$/g, '')
    .trim()
}

/** Remove GPS / coordinate fragments from a location string. */
export function stripCoordinates(text: string): string {
  let out = text
  out = out.replace(COORD_PAIR_RE, '')
  out = out.replace(COORD_LABEL_RE, '')
  out = out.replace(/\b\d{2}\.\d{4,}\b/g, '') // lone lat/lng token
  return cleanSpaces(out)
}

/** Remove meta phrases that break the official-application voice. */
export function stripMetaVoice(text: string): string {
  let out = text
  for (const re of META_VOICE_RE) {
    out = out.replace(re, '')
  }
  out = out.replace(/\bW okolicy\s+,/gi, 'W okolicy')
  out = out.replace(
    /\bbrakuje elementów małej architektury lub zagospodarowania odpowiadających zgłoszonej potrzebie sąsiedzkiej\b/gi,
    'brakuje elementów małej architektury odpowiadających potrzebom mieszkańców',
  )
  // Capitalize sentence starts left after stripping
  out = out.replace(/(^|[.!?]\s+)([a-ząćęłńóśźż])/g, (_, p, c: string) =>
    `${p}${c.toUpperCase()}`,
  )
  return cleanSpaces(out)
}

/**
 * Human-readable place label for the official form.
 * Rejects coordinate-only / land-assessment blobs.
 */
export function normalizeApplicationLocation(
  raw: string | undefined | null,
  fallback = 'Okolica realizacji na mapie wniosku (grunty Gminy Miejskiej Kraków)',
): string {
  if (!raw?.trim()) return fallback
  let loc = stripCoordinates(raw)
  loc = loc.replace(/\bDzielnica:\s*/gi, 'Dzielnica ')
  loc = loc.replace(/\bOcena terenu:[^·]*/gi, '')
  loc = cleanSpaces(loc)
  if (!loc || loc.length < 3) return fallback
  if (/^\d[\d\s.,;-]*$/.test(loc)) return fallback
  if (/wsp[óo]łrz|lat|lng|gps/i.test(loc)) return fallback
  return loc.slice(0, 200)
}

export function cleanupApplicationVoice(text: string): string {
  return stripMetaVoice(stripCoordinates(text))
}
