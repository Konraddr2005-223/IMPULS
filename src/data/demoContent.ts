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
  'Wszystkie poniższe pomysły i usterki są fikcyjne. Nazwa okolicy nie oznacza rzeczywistego problemu ani potwierdzonego statusu konkretnej działki.'

export const demoIdeas: DemoIdea[] = [
  {
    id: 'idea-zielony-zakatek',
    title: 'Zielony zakątek z ławkami',
    description: 'Dwie ławki i cztery drzewa przy trasie spacerowej.',
    district: 'Krowodrza',
    lat: 50.07,
    lng: 19.91,
    likesCount: 2,
    supportThreshold: 3,
    category: 'investment',
  },
  {
    id: 'idea-cien',
    title: 'Więcej cienia przy trasie spacerowej',
    description: 'Nasadzenia wzdłuż trasy spacerowej.',
    district: 'Grzegórzki',
    lat: 50.055,
    lng: 19.96,
    likesCount: 18,
    supportThreshold: 10,
    category: 'investment',
  },
  {
    id: 'idea-seniorzy',
    title: 'Miejsce odpoczynku dla seniorów',
    description: 'Ławki i zacienione miejsce odpoczynku.',
    district: 'Podgórze',
    lat: 50.045,
    lng: 19.949,
    likesCount: 12,
    supportThreshold: 10,
    category: 'investment',
  },
  {
    id: 'idea-warsztaty',
    title: 'Sąsiedzkie warsztaty naprawcze',
    description: 'Cykl nieodpłatnych warsztatów dla mieszkańców.',
    district: 'Nowa Huta',
    lat: 50.072,
    lng: 20.037,
    likesCount: 8,
    supportThreshold: 5,
    category: 'non_investment',
  },
  {
    id: 'idea-piknik',
    title: 'Piknik na terenie instytucji',
    description: 'Sąsiedzkie spotkanie wymagające uzgodnienia współpracy.',
    district: 'Prądnik Czerwony',
    lat: 50.075,
    lng: 19.945,
    likesCount: 6,
    supportThreshold: 5,
    category: 'non_investment',
  },
  {
    id: 'idea-skwer-inny',
    title: 'Skwer na terenie innego podmiotu',
    description: 'Propozycja skweru — scenariusz ostrzeżenia o gruncie.',
    district: 'Zabłocie',
    lat: 50.048,
    lng: 19.96,
    likesCount: 4,
    supportThreshold: 5,
    category: 'investment',
  },
]

export const demoFaults: DemoFault[] = [
  {
    id: 'fault-lawka',
    title: 'Uszkodzona ławka',
    description: 'Pęknięte siedzisko przy skwerze.',
    category: 'street_furniture',
    status: 'Nowe',
    lat: 50.0614,
    lng: 19.937,
  },
  {
    id: 'fault-kosz',
    title: 'Przepełniony kosz',
    description: 'Kosz wymaga opróżnienia.',
    category: 'waste',
    status: 'Potwierdzone przez społeczność',
    lat: 50.052,
    lng: 19.944,
  },
  {
    id: 'fault-latarnia',
    title: 'Niesprawna latarnia',
    description: 'Latarnia nie świeci po zmroku.',
    category: 'lighting',
    status: 'Autor zgłosił usunięcie',
    lat: 50.064,
    lng: 19.923,
  },
  {
    id: 'fault-nawierzchnia',
    title: 'Uszkodzona nawierzchnia',
    description: 'Dziura w chodniku.',
    category: 'pavement',
    status: 'Nowe',
    lat: 50.04,
    lng: 19.93,
  },
]
