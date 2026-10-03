import type {
  ApplicationTemplate,
  CityCalendar,
  CostCatalog,
  SubmissionInstructions,
  WmsLayerConfig,
} from '../types'

export const KRAKOW_CITY_ID = 'krakow'
export const KRAKOW_EDITION = '2026-demo'
export const KRAKOW_RULES_VERSION = 'krakow-bo-2026-v1'

/** Match radius for synthetic demo points (metres). */
export const DEMO_MATCH_RADIUS_M = 80

export const DEMO_NO_DATA_WARNING =
  'Brak danych demonstracyjnych dla tego punktu. Nie przypisano najbliższej znanej lokalizacji.'

export const SYNTHETIC_DEMO_WARNING =
  'Scenariusz demonstracyjny. Status nie opisuje rzeczywistej nieruchomości.'

export const LAND_DISCLAIMER =
  'Informacja poglądowa. Ostateczną możliwość realizacji ocenia miasto.'

export const applicationTemplate: ApplicationTemplate = {
  version: KRAKOW_RULES_VERSION,
  supportSignaturesRequired: 15,
  supportListDaysAfterSubmission: 10,
  fields: [
    { id: 'title', label: 'Tytuł', maxLength: 60, required: true },
    {
      id: 'summary',
      label: 'Krótki opis',
      minLength: 60,
      maxLength: 250,
      required: true,
    },
    { id: 'location', label: 'Lokalizacja', required: true },
    { id: 'description', label: 'Opis szczegółowy', required: true },
    { id: 'justification', label: 'Uzasadnienie', required: true },
    { id: 'accessibility', label: 'Ogólnodostępność', required: true },
    { id: 'costEstimate', label: 'Kosztorys', required: true },
    { id: 'schedule', label: 'Harmonogram', required: true },
  ],
  notes: [
    'Lajki w aplikacji nie zastępują oficjalnej listy poparcia BO.',
    'Wymagane jest co najmniej 15 podpisów mieszkańców właściwej dzielnicy lub Krakowa, zależnie od zasięgu projektu.',
  ],
}

export const costCatalog: CostCatalog = {
  version: 'krakow-cennik-demo-v1',
  sourceUrl: 'https://plikimpi.krakow.pl/zalacznik/546216',
  sourceLabel: 'Miejski cennik BO Kraków (zakresy źródłowe)',
  checkedAt: '2026-10-03',
  taxNote:
    'Zakresy z cennika miejskiego. Nie dopisujemy arbitralnie VAT — netto/brutto wg źródła lub brak informacji.',
  items: [
    {
      id: 'bench_backrest_installation',
      label: 'Ławka z oparciem i montażem',
      unit: 'szt.',
      minPln: 1897.5,
      maxPln: 4950,
      scopeNote: 'Zakup + montaż wg pozycji cennika',
    },
    {
      id: 'tree_16_18_planting',
      label: 'Zakup i posadzenie drzewa, obwód 16–18 cm',
      unit: 'szt.',
      minPln: 1500,
      maxPln: 1700,
      scopeNote: 'Materiał + posadzenie',
    },
    {
      id: 'bin_50l_installation',
      label: 'Kosz 50 l z montażem',
      unit: 'szt.',
      minPln: 1000,
      maxPln: 2000,
      scopeNote: 'Zakup + montaż',
    },
    {
      id: 'bike_rack',
      label: 'Stojak rowerowy',
      unit: 'szt.',
      minPln: 800,
      maxPln: 2200,
    },
    {
      id: 'planter_box',
      label: 'Donica / skrzynia nasadzeniowa',
      unit: 'szt.',
      minPln: 600,
      maxPln: 1800,
    },
    {
      id: 'path_surface_m2',
      label: 'Nawierzchnia ścieżki',
      unit: 'm²',
      minPln: 120,
      maxPln: 350,
    },
    {
      id: 'lighting_pole',
      label: 'Latarnia / punkt świetlny',
      unit: 'szt.',
      minPln: 3500,
      maxPln: 9000,
    },
    {
      id: 'playground_element',
      label: 'Element placu zabaw',
      unit: 'szt.',
      minPln: 4000,
      maxPln: 15000,
    },
  ],
}

export const submissionInstructions: SubmissionInstructions = {
  title: 'Złożenie projektu w systemie miasta',
  simulationNotice: 'Symulacja procesu według zasad 2026.',
  officialFormUrl: 'https://budzet.krakow.pl/',
  signatureListUrl:
    'https://budzet.krakow.pl/polecamy/309228,1910,komunikat,listy_poparcia.html',
  steps: [
    'Przygotuj treść projektu w Sąsiedzkim i sprawdź ją przed kopiowaniem.',
    'Złóż projekt w oficjalnym systemie Budżetu Obywatelskiego Miasta Krakowa.',
    'W ciągu 10 dni dostarcz listę poparcia zgodnie z instrukcją miasta.',
    'Lajki w aplikacji nie są podpisami ani głosami.',
  ],
}

export const cityCalendar: CityCalendar = {
  edition: KRAKOW_EDITION,
  simulationLabel: 'Symulacja procesu według zasad 2026',
  submissionClosedOn: '2026-03-17',
  votingClosedOn: '2026-09-28',
  notes: [
    'Nabór 2026 zakończył się 17 marca; głosowanie — 28 września.',
    'Terminów kolejnej edycji nie należy zgadywać w UI.',
  ],
}

/** Working WMS endpoints verified in the project plan (2026-10-03). */
export const wmsSources: WmsLayerConfig[] = [
  {
    id: 'ownership',
    title: 'Struktura własności',
    url: 'https://msip.um.krakow.pl/arcgis/services/Obserwatorium/K01_GR_WLASNOSCI/MapServer/WMSServer',
    layers: '0',
    note: 'GetCapabilities / GetFeatureInfo zweryfikowane; do publicznego dema używaj danych syntetycznych do czasu wyjaśnienia warunków MSIP.',
  },
  {
    id: 'mpzp',
    title: 'Plany obowiązujące (MPZP)',
    url: 'https://msip.um.krakow.pl/arcgis/services/Obserwatorium/BP_MPZP/MapServer/WMSServer',
    layers: '1,5,6,7',
    note: 'Warstwa 7 — przeznaczenia do skali 1:1000. Daty źródeł własności i MPZP mogą się różnić.',
  },
]
