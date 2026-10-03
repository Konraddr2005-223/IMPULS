/**
 * Lightweight Polish typo / slang cleanup for BO drafts.
 * Applied after the model (and in mock) so user typos don't land in the PDF.
 */
const WORD_FIXES: Array<{ pattern: RegExp; to: string }> = [
  { pattern: /\binizjatyw([ayę])/gi, to: 'inicjatyw$1' },
  { pattern: /\binicjatywe\b/gi, to: 'inicjatywę' },
  { pattern: /\binicjatywa\b/gi, to: 'inicjatywa' },
  { pattern: /\bbudzetu\b/gi, to: 'budżetu' },
  { pattern: /\bbudzetem\b/gi, to: 'budżetem' },
  { pattern: /\bbudzetowi\b/gi, to: 'budżetowi' },
  { pattern: /\bbudzet\b/gi, to: 'budżet' },
  { pattern: /\bBudzet\b/g, to: 'Budżet' },
  { pattern: /\bobywatelskiem\b/gi, to: 'obywatelskim' },
  { pattern: /\bobywatelskiego\b/gi, to: 'obywatelskiego' },
  { pattern: /\bkrakowie\b/gi, to: 'Krakowie' },
  { pattern: /\bkrakowa\b/gi, to: 'Krakowa' },
  { pattern: /\bkrakow\b/gi, to: 'Kraków' },
  { pattern: /\bgminie\b/gi, to: 'Gminie' },
  { pattern: /\bgminy\b/gi, to: 'Gminy' },
  { pattern: /\blokalziacj([aię])/gi, to: 'lokalizacj$1' },
  { pattern: /\bloklizacj([aię])/gi, to: 'lokalizacj$1' },
  { pattern: /\blokalizacjia\b/gi, to: 'lokalizacja' },
  { pattern: /\buzasadneinie\b/gi, to: 'uzasadnienie' },
  { pattern: /\buzasadnenie\b/gi, to: 'uzasadnienie' },
  { pattern: /\buzasadnieniee\b/gi, to: 'uzasadnienie' },
  { pattern: /\bkoszturys\b/gi, to: 'kosztorys' },
  { pattern: /\bkosztoryse\b/gi, to: 'kosztorysie' },
  { pattern: /\bharmonoram\b/gi, to: 'harmonogram' },
  { pattern: /\bharmonogarm\b/gi, to: 'harmonogram' },
  { pattern: /\bogolnodostepn/gi, to: 'ogólnodostępn' },
  { pattern: /\bogólnodostepn/gi, to: 'ogólnodostępn' },
  { pattern: /\bogolnodostepny\b/gi, to: 'ogólnodostępny' },
  { pattern: /\bogolnodostepne\b/gi, to: 'ogólnodostępne' },
  { pattern: /\bogolnodostepnosci\b/gi, to: 'ogólnodostępności' },
  { pattern: /\bmieszkancami\b/gi, to: 'mieszkańcami' },
  { pattern: /\bmieszkancow\b/gi, to: 'mieszkańców' },
  { pattern: /\bmieszkancy\b/gi, to: 'mieszkańcy' },
  { pattern: /\bmieszkanca\b/gi, to: 'mieszkańca' },
  { pattern: /\bmieszkaniec\b/gi, to: 'mieszkaniec' },
  { pattern: /\bdzialk([aię])/gi, to: 'działk$1' },
  { pattern: /\bsciezk([aię])/gi, to: 'ścieżk$1' },
  { pattern: /\bsciezke\b/gi, to: 'ścieżkę' },
  { pattern: /\bsciezki\b/gi, to: 'ścieżki' },
  { pattern: /\blawk([aię])/gi, to: 'ławk$1' },
  { pattern: /\blawki\b/gi, to: 'ławki' },
  { pattern: /\blawek\b/gi, to: 'ławek' },
  { pattern: /\blawka\b/gi, to: 'ławka' },
  { pattern: /\bglownej\b/gi, to: 'głównej' },
  { pattern: /\bglowna\b/gi, to: 'główna' },
  { pattern: /\bpostawic\b/gi, to: 'postawić' },
  { pattern: /\bmontaz\b/gi, to: 'montaż' },
  { pattern: /\bzrobmy\b/gi, to: 'zróbmy' },
  { pattern: /\bchceemy\b/gi, to: 'chcemy' },
  { pattern: /\boswietleni([ae])/gi, to: 'oświetleni$1' },
  { pattern: /\bloswietleni([ae])/gi, to: 'oświetleni$1' },
  { pattern: /\bwybeig\b/gi, to: 'wybieg' },
  { pattern: /\bwybiegu\b/gi, to: 'wybiegu' },
  { pattern: /\bpsow\b/gi, to: 'psów' },
  { pattern: /\bniepelnosprawn/gi, to: 'niepełnosprawn' },
  { pattern: /\bsasiedz([kc])/gi, to: 'sąsiedz$1' },
  { pattern: /\bpropozyci([ae])/gi, to: 'propozycj$1' },
  { pattern: /\bzadnie\b/gi, to: 'zadanie' },
  { pattern: /\bzadania\b/gi, to: 'zadania' },
  { pattern: /\binwestyja\b/gi, to: 'inwestycja' },
  { pattern: /\binwestycji\b/gi, to: 'inwestycji' },
  { pattern: /\bplac zabab\b/gi, to: 'plac zabaw' },
  { pattern: /\bplac zabawy\b/gi, to: 'plac zabaw' },
  { pattern: /\bkazimiezu\b/gi, to: 'Kazimierzu' },
  { pattern: /\bkazimierza\b/gi, to: 'Kazimierza' },
  { pattern: /\bkazimierz\b/gi, to: 'Kazimierz' },
  { pattern: /\bpodgorze\b/gi, to: 'Podgórze' },
  { pattern: /\bpodgorzu\b/gi, to: 'Podgórzu' },
  { pattern: /\bpradniku\b/gi, to: 'Prądniku' },
  { pattern: /\bpradnik\b/gi, to: 'Prądnik' },
  { pattern: /\bnowa huta\b/gi, to: 'Nowa Huta' },
  { pattern: /\bnowej hucie\b/gi, to: 'Nowej Hucie' },
  { pattern: /\bdrzewa\b/gi, to: 'drzewa' },
  { pattern: /\bnasadzen\b/gi, to: 'nasadzeń' },
  { pattern: /\bnasadzenia\b/gi, to: 'nasadzenia' },
  { pattern: /\bspacerowej\b/gi, to: 'spacerowej' },
  { pattern: /\brealizacjia\b/gi, to: 'realizacja' },
  { pattern: /\brealizacjie\b/gi, to: 'realizację' },
  { pattern: /\bpotrzebe\b/gi, to: 'potrzebę' },
  { pattern: /\bpotrzeba\b/gi, to: 'potrzeba' },
]

/** Correct common typos / missing diacritics in free-text BO fields. */
export function correctTypos(text: string): string {
  let out = text
  for (const { pattern, to } of WORD_FIXES) {
    out = out.replace(pattern, to)
  }
  out = out.replace(/([a-ząćęłńóśźż])\1{2,}/gi, '$1$1')
  return out
}

export function correctTyposInFields<T extends Record<string, unknown>>(
  fields: T,
  keys: (keyof T)[],
): T {
  const next = { ...fields }
  for (const key of keys) {
    const value = next[key]
    if (typeof value === 'string') {
      next[key] = correctTypos(value) as T[keyof T]
    } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      next[key] = value.map((v) => correctTypos(String(v))) as T[keyof T]
    }
  }
  return next
}
