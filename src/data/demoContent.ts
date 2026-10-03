/** Fictional demo content from specification §7 — not real local problems. */

export type DemoIdea = {
  id: string
  title: string
  description: string
  district: string
  lat: number
  lng: number
  likesCount: number
  supportThreshold: number
  category: string
  /** Optional local/demo image path under /public. */
  photoPath?: string | null
}

export type DemoFault = {
  id: string
  title: string
  description: string
  category: string
  status: string
  lat: number
  lng: number
}

export const DEMO_DISCLAIMER =
  'Wszystkie poniższe pomysły są fikcyjne i demonstracyjne. Nazwa okolicy nie oznacza rzeczywistego problemu ani potwierdzonego statusu działki.'

export const demoIdeas: DemoIdea[] = [
  {
    id: 'idea-zielony-zakatek',
    title: 'Zielony zakątek z ławkami i drzewami',
    description:
      'Nasadzenie 4 drzew miododajnych oraz montaż 2 ławek parkowych z oparciami przy ciągu pieszym.',
    district: 'Krowodrza',
    lat: 50.0712,
    lng: 19.9185,
    likesCount: 7,
    supportThreshold: 3,
    category: 'investment',
  },
  {
    id: 'idea-cien',
    title: 'Zacieniona aleja spacerowa wzdłuż Wisły',
    description:
      'Dosadzenie szpaleru drzew liściastych wzdłuż trasy pieszo-rowerowej oraz instalacja dodatkowych koszy na śmieci.',
    district: 'Grzegórzki',
    lat: 50.0558,
    lng: 19.962,
    likesCount: 8,
    supportThreshold: 5,
    category: 'investment',
  },
  {
    id: 'idea-wybieg-psow',
    title: 'Ogrodzony wybieg dla psów przy skwerze',
    description:
      'Bezpieczny wybieg z ogrodzeniem, ławkami dla opiekunów i koszami na odchody — przestrzeń dla psów i sąsiadów.',
    district: 'Podgórze',
    lat: 50.0418,
    lng: 19.9442,
    likesCount: 9,
    supportThreshold: 5,
    category: 'investment',
  },
  {
    id: 'idea-sciezka-rowerowa',
    title: 'Separowana ścieżka rowerowa i stojaki',
    description:
      'Odcinek bezpiecznej ścieżki rowerowej z oznakowaniem oraz stojaki dla rowerów przy skrzyżowaniu.',
    district: 'Krowodrza',
    lat: 50.068,
    lng: 19.912,
    likesCount: 5,
    supportThreshold: 5,
    category: 'investment',
  },
  {
    id: 'idea-warsztaty',
    title: 'Sąsiedzkie warsztaty naprawcze i wymiana książek',
    description:
      'Cykl bezpłatnych warsztatów DIY dla mieszkańców oraz montaż plenerowej szafki bookcrossingowej.',
    district: 'Nowa Huta',
    lat: 50.0725,
    lng: 20.038,
    likesCount: 6,
    supportThreshold: 5,
    category: 'non_investment',
  },
  {
    id: 'idea-seniorzy',
    title: 'Strefa odpoczynku i zieleń dla seniorów',
    description:
      'Wygodne ławki z poręczami i ergonomicznym oparciem, stół do szachów i podwyższone rabaty z kwiatami.',
    district: 'Podgórze',
    lat: 50.0452,
    lng: 19.9485,
    likesCount: 4,
    supportThreshold: 5,
    category: 'investment',
  },
  {
    id: 'idea-oswietlenie',
    title: 'Bezpieczne doświetlenie skweru i latarnie solarne',
    description:
      'Instalacja 3 energooszczędnych latarni solarnych LED przy głównym przejściu pieszym przez skwer.',
    district: 'Prądnik Czerwony',
    lat: 50.0754,
    lng: 19.9452,
    likesCount: 3,
    supportThreshold: 5,
    category: 'investment',
  },
  {
    id: 'idea-plac-zabaw',
    title: 'Nowy plac zabaw i strefa dla dzieci',
    description:
      'Zestaw urządzeń placu zabaw z bezpieczną nawierzchnią i ławkami dla opiekunów.',
    district: 'Dębniki',
    lat: 50.0475,
    lng: 19.928,
    likesCount: 7,
    supportThreshold: 5,
    category: 'investment',
  },
  {
    id: 'idea-ogrod-spoleczny',
    title: 'Ogród społeczny i strefa integracji mieszkańców',
    description:
      'Utworzenie otwartego ogrodu warzywno-ziołowego w podwyższonych skrzyniach oraz sąsiedzkie dni sadzenia.',
    district: 'Dębniki',
    lat: 50.049,
    lng: 19.924,
    likesCount: 2,
    supportThreshold: 5,
    category: 'non_investment',
  },
]

export const demoFaults: DemoFault[] = []
