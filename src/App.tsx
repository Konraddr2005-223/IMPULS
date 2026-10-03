import { useState } from 'react'
import { MapCanvas } from './map/MapCanvas'
import { brand } from './theme/tokens'

type TabId = 'mapa' | 'dodaj' | 'powiadomienia' | 'moje'
type MapLayer = 'pomysly' | 'usterki'
type MapMode = 'mapa' | 'lista'

const TABS: { id: TabId; label: string }[] = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'dodaj', label: 'Dodaj' },
  { id: 'powiadomienia', label: 'Powiadomienia' },
  { id: 'moje', label: 'Moje' },
]

const PLACEHOLDER_IDEAS = [
  { id: '1', title: 'Ławka przy skwerze', place: 'Kazimierz' },
  { id: '2', title: 'Donice na podwórku', place: 'Podgórze' },
  { id: '3', title: 'Oświetlenie przejścia', place: 'Krowodrza' },
] as const

const PLACEHOLDER_FAULTS = [
  { id: '1', title: 'Uszkodzona nawierzchnia', place: 'Stare Miasto' },
  { id: '2', title: 'Przepełniony kosz', place: 'Zabłocie' },
] as const

function App() {
  const [tab, setTab] = useState<TabId>('mapa')
  const [layer, setLayer] = useState<MapLayer>('pomysly')
  const [mode, setMode] = useState<MapMode>('mapa')

  const items = layer === 'pomysly' ? PLACEHOLDER_IDEAS : PLACEHOLDER_FAULTS

  return (
    <div className="min-h-svh flex flex-col">
      <header className="shrink-0 px-4 py-3 border-b border-black/5 bg-white/90 backdrop-blur z-20">
        <div className="mx-auto max-w-6xl flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-semibold m-0" style={{ color: 'var(--color-ideas)' }}>
            {brand.name}
          </h1>
          <p className="m-0 text-sm text-[var(--color-text)]/70 hidden sm:block">{brand.tagline}</p>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        {tab === 'mapa' ? (
          <MapScreen
            layer={layer}
            mode={mode}
            items={items}
            onLayerChange={setLayer}
            onModeChange={setMode}
            onAdd={() => setTab('dodaj')}
          />
        ) : (
          <PlaceholderScreen tab={tab} />
        )}
      </main>

      <nav
        className="md:hidden shrink-0 border-t border-black/5 bg-white px-2 py-1 grid grid-cols-4 gap-1 text-xs text-center z-20"
        aria-label="Nawigacja dolna"
      >
        {TABS.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="py-2.5 rounded-lg font-medium border-0 bg-transparent cursor-pointer"
              style={{ color: active ? 'var(--color-ideas)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </button>
          )
        })}
      </nav>

      <nav
        className="hidden md:flex shrink-0 border-t border-black/5 bg-white px-4 py-2 justify-center gap-6 text-sm z-20"
        aria-label="Nawigacja"
      >
        {TABS.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="py-2 px-3 rounded-lg font-medium border-0 bg-transparent cursor-pointer"
              style={{ color: active ? 'var(--color-ideas)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

type ListItem = { id: string; title: string; place: string }

type MapScreenProps = {
  layer: MapLayer
  mode: MapMode
  items: readonly ListItem[]
  onLayerChange: (layer: MapLayer) => void
  onModeChange: (mode: MapMode) => void
  onAdd: () => void
}

function MapScreen({
  layer,
  mode,
  items,
  onLayerChange,
  onModeChange,
  onAdd,
}: MapScreenProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-black/5 bg-white flex flex-wrap items-center gap-2 z-10">
        <div
          className="inline-flex rounded-[var(--radius-card)] bg-[var(--color-bg)] p-1"
          role="tablist"
          aria-label="Warstwa mapy"
        >
          <LayerTab
            active={layer === 'pomysly'}
            onClick={() => onLayerChange('pomysly')}
            accent="var(--color-ideas)"
          >
            Pomysły
          </LayerTab>
          <LayerTab
            active={layer === 'usterki'}
            onClick={() => onLayerChange('usterki')}
            accent="var(--color-faults)"
          >
            Usterki
          </LayerTab>
        </div>

        <div
          className="inline-flex rounded-[var(--radius-card)] bg-[var(--color-bg)] p-1 ml-auto"
          role="group"
          aria-label="Widok"
        >
          <ModeButton active={mode === 'mapa'} onClick={() => onModeChange('mapa')}>
            Mapa
          </ModeButton>
          <ModeButton active={mode === 'lista'} onClick={() => onModeChange('lista')}>
            Lista
          </ModeButton>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="hidden md:inline-flex items-center justify-center min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer"
          style={{ background: 'var(--color-action)' }}
        >
          Dodaj
        </button>
      </div>

      <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(260px,340px)_1fr]">
        <aside
          className={`${mode === 'lista' ? 'flex' : 'hidden'} md:flex flex-col min-h-0 border-r border-black/5 bg-white overflow-y-auto`}
          aria-label={layer === 'pomysly' ? 'Lista pomysłów' : 'Lista usterek'}
        >
          <ul className="m-0 p-0 list-none">
            {items.map((item) => (
              <li key={item.id} className="border-b border-black/5 px-4 py-3">
                <p className="m-0 font-medium">{item.title}</p>
                <p className="m-0 mt-1 text-sm text-[var(--color-text)]/65">{item.place}</p>
              </li>
            ))}
          </ul>
          <p className="m-0 px-4 py-3 text-xs text-[var(--color-text)]/55">
            Przykładowe wpisy — dane z bazy dojdą w kolejnym kroku.
          </p>
        </aside>

        <section
          className={`${mode === 'mapa' ? 'relative' : 'hidden md:relative'} min-h-[50svh] md:min-h-0`}
          aria-label="Mapa okolicy"
        >
          <MapCanvas className="absolute inset-0 h-full w-full z-0" />
          <button
            type="button"
            onClick={onAdd}
            className="md:hidden absolute bottom-4 right-4 z-10 min-h-12 min-w-12 px-4 rounded-full border-0 text-white text-sm font-medium shadow-md cursor-pointer"
            style={{ background: 'var(--color-action)' }}
            aria-label="Dodaj wpis"
          >
            +
          </button>
        </section>
      </div>
    </div>
  )
}

function LayerTab({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean
  onClick: () => void
  accent: string
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="min-h-10 px-3 rounded-[calc(var(--radius-card)-4px)] border-0 text-sm font-medium cursor-pointer"
      style={{
        background: active ? accent : 'transparent',
        color: active ? '#fff' : 'var(--color-text)',
      }}
    >
      {children}
    </button>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="min-h-10 px-3 rounded-[calc(var(--radius-card)-4px)] border-0 text-sm font-medium cursor-pointer"
      style={{
        background: active ? '#fff' : 'transparent',
        color: 'var(--color-text)',
        boxShadow: active ? '0 0 0 1px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function PlaceholderScreen({ tab }: { tab: Exclude<TabId, 'mapa'> }) {
  const copy: Record<Exclude<TabId, 'mapa'>, { title: string; body: string }> = {
    dodaj: {
      title: 'Dodaj',
      body: 'Formularz pomysłu lub usterki pojawi się tutaj.',
    },
    powiadomienia: {
      title: 'Powiadomienia',
      body: 'Zdarzenia z okolicy i statusy zgłoszeń.',
    },
    moje: {
      title: 'Moje',
      body: 'Twoje pomysły, dokumenty i usterki.',
    },
  }

  const { title, body } = copy[tab]

  return (
    <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
      <section
        className="rounded-[var(--radius-card)] bg-white p-6 border border-black/5"
        aria-labelledby="placeholder-heading"
      >
        <h2 id="placeholder-heading" className="m-0 text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 mb-0 text-[var(--color-text)]/80">{body}</p>
      </section>
    </div>
  )
}

export default App
