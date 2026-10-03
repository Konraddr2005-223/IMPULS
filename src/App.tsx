import { useEffect, useMemo, useState } from 'react'
import { AuthBar } from './auth/AuthBar'
import { useAuth } from './auth/AuthContext'
import { krakowAdapter } from './city'
import type { LandAssessment } from './city/types'
import { DEMO_DISCLAIMER, demoFaults, demoIdeas } from './data/demoContent'
import { CreateIdeaForm } from './ideas/CreateIdeaForm'
import { fetchPublishedIdeas } from './ideas/api'
import type { IdeaRecord } from './ideas/types'
import { isSupabaseConfigured } from './lib/supabase'
import { LandCard } from './map/LandCard'
import { MapCanvas, type MapMarker } from './map/MapCanvas'
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

function App() {
  const { user, displayName } = useAuth()
  const [tab, setTab] = useState<TabId>('mapa')
  const [layer, setLayer] = useState<MapLayer>('pomysly')
  const [mode, setMode] = useState<MapMode>('mapa')
  const [land, setLand] = useState<LandAssessment | null>(null)
  const [landLoading, setLandLoading] = useState(false)
  const [landError, setLandError] = useState<string | null>(null)
  const [draftPoint, setDraftPoint] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])
  const [ideasSource, setIdeasSource] = useState<'db' | 'demo'>('demo')
  const [ideasError, setIdeasError] = useState<string | null>(null)

  async function loadIdeas() {
    if (!isSupabaseConfigured) {
      setIdeas([])
      setIdeasSource('demo')
      return
    }
    try {
      const rows = await fetchPublishedIdeas()
      setIdeas(rows)
      setIdeasSource(rows.length > 0 ? 'db' : 'demo')
      setIdeasError(null)
    } catch (err) {
      setIdeas([])
      setIdeasSource('demo')
      setIdeasError(err instanceof Error ? err.message : 'Błąd odczytu pomysłów')
    }
  }

  useEffect(() => {
    void loadIdeas()
  }, [])

  async function handleMapClick(point: { lat: number; lng: number }) {
    setDraftPoint(point)
    setLandLoading(true)
    setLandError(null)
    try {
      const result = await krakowAdapter.checkLocation(point)
      setLand(result)
    } catch {
      setLand(null)
      setLandError('Nie udało się sprawdzić terenu.')
    } finally {
      setLandLoading(false)
    }
  }

  const listIdeas = ideasSource === 'db' ? ideas : null

  return (
    <div className="min-h-svh flex flex-col">
      <header className="shrink-0 px-4 py-3 border-b border-black/5 bg-white/90 backdrop-blur z-20">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold m-0" style={{ color: 'var(--color-ideas)' }}>
              {brand.name}
            </h1>
            <p className="m-0 text-sm text-[var(--color-text)]/70 hidden sm:block">
              {brand.tagline}
            </p>
          </div>
          <AuthBar />
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        {tab === 'mapa' && (
          <MapScreen
            layer={layer}
            mode={mode}
            land={land}
            landLoading={landLoading}
            landError={landError}
            ideas={listIdeas}
            ideasSource={ideasSource}
            ideasError={ideasError}
            onLayerChange={setLayer}
            onModeChange={setMode}
            onAdd={() => setTab('dodaj')}
            onMapClick={handleMapClick}
            onCloseLand={() => {
              setLand(null)
              setLandError(null)
            }}
          />
        )}
        {tab === 'dodaj' && (
          <CreateIdeaForm
            initialPoint={draftPoint}
            onCreated={() => {
              void loadIdeas()
              setTab('mapa')
            }}
          />
        )}
        {tab === 'powiadomienia' && (
          <PlaceholderScreen
            title="Powiadomienia"
            body="Zdarzenia z okolicy i statusy zgłoszeń."
          />
        )}
        {tab === 'moje' && (
          <PlaceholderScreen
            title="Moje"
            body={
              user
                ? `Zalogowano jako ${displayName ?? user.email}. Twoje pomysły i dokumenty pojawią się tutaj.`
                : 'Zaloguj się kontem prezentacyjnym (Autor / Sąsiad w nagłówku), aby zarządzać wpisami.'
            }
          />
        )}
      </main>

      <nav
        className="md:hidden shrink-0 border-t border-black/5 bg-white px-2 py-1 grid grid-cols-4 gap-1 text-xs text-center z-20"
        aria-label="Nawigacja dolna"
      >
        {TABS.map(({ id, label }) => (
          <NavButton key={id} label={label} active={tab === id} onClick={() => setTab(id)} />
        ))}
      </nav>

      <nav
        className="hidden md:flex shrink-0 border-t border-black/5 bg-white px-4 py-2 justify-center gap-6 text-sm z-20"
        aria-label="Nawigacja"
      >
        {TABS.map(({ id, label }) => (
          <NavButton key={id} label={label} active={tab === id} onClick={() => setTab(id)} />
        ))}
      </nav>
    </div>
  )
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="py-2.5 px-3 rounded-lg font-medium border-0 bg-transparent cursor-pointer"
      style={{
        color: active
          ? 'var(--color-ideas)'
          : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
      }}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  )
}

type MapScreenProps = {
  layer: MapLayer
  mode: MapMode
  land: LandAssessment | null
  landLoading: boolean
  landError: string | null
  ideas: IdeaRecord[] | null
  ideasSource: 'db' | 'demo'
  ideasError: string | null
  onLayerChange: (layer: MapLayer) => void
  onModeChange: (mode: MapMode) => void
  onAdd: () => void
  onMapClick: (point: { lat: number; lng: number }) => void
  onCloseLand: () => void
}

function MapScreen({
  layer,
  mode,
  land,
  landLoading,
  landError,
  ideas,
  ideasSource,
  ideasError,
  onLayerChange,
  onModeChange,
  onAdd,
  onMapClick,
  onCloseLand,
}: MapScreenProps) {
  const markers: MapMarker[] = useMemo(() => {
    if (layer === 'pomysly') {
      if (ideas) {
        return ideas.map((idea) => ({
          id: idea.id,
          lat: idea.lat,
          lng: idea.lng,
          kind: 'idea' as const,
          label: idea.title,
        }))
      }
      return demoIdeas.map((idea) => ({
        id: idea.id,
        lat: idea.lat,
        lng: idea.lng,
        kind: 'idea' as const,
        label: idea.title,
      }))
    }
    return demoFaults.map((fault) => ({
      id: fault.id,
      lat: fault.lat,
      lng: fault.lng,
      kind: 'fault' as const,
      label: fault.title,
    }))
  }, [layer, ideas])

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

      <p className="m-0 px-3 py-1.5 text-xs text-[var(--color-text)]/60 bg-[var(--color-bg)] border-b border-black/5">
        {DEMO_DISCLAIMER}
        {isSupabaseConfigured ? ' · Supabase: OK' : ' · Supabase: brak konfiguracji'}
        {` · Źródło pomysłów: ${ideasSource === 'db' ? 'baza' : 'dane lokalne'}`}
        {ideasError ? ` · ${ideasError}` : ''}
        {' · Kliknij mapę, aby sprawdzić teren (dane demo).'}
      </p>

      <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(260px,340px)_1fr]">
        <aside
          className={`${mode === 'lista' ? 'flex' : 'hidden'} md:flex flex-col min-h-0 border-r border-black/5 bg-white overflow-y-auto`}
          aria-label={layer === 'pomysly' ? 'Lista pomysłów' : 'Lista usterek'}
        >
          {layer === 'pomysly' ? (
            <ul className="m-0 p-0 list-none">
              {ideas
                ? ideas.map((idea) => (
                    <li key={idea.id} className="border-b border-black/5 px-4 py-3">
                      <p className="m-0 font-medium">{idea.title}</p>
                      <p className="m-0 mt-1 text-sm text-[var(--color-text)]/65">
                        {idea.district_code ?? 'Kraków'} · {idea.likes_count}/
                        {idea.support_threshold} poparć
                      </p>
                    </li>
                  ))
                : demoIdeas.map((idea) => (
                    <li key={idea.id} className="border-b border-black/5 px-4 py-3">
                      <p className="m-0 font-medium">{idea.title}</p>
                      <p className="m-0 mt-1 text-sm text-[var(--color-text)]/65">
                        {idea.district} · {idea.likesCount}/{idea.supportThreshold} poparć
                      </p>
                    </li>
                  ))}
            </ul>
          ) : (
            <ul className="m-0 p-0 list-none">
              {demoFaults.map((fault) => (
                <li key={fault.id} className="border-b border-black/5 px-4 py-3">
                  <p className="m-0 font-medium">{fault.title}</p>
                  <p className="m-0 mt-1 text-sm text-[var(--color-text)]/65">
                    {fault.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section
          className={`${mode === 'mapa' ? 'relative' : 'hidden md:relative'} min-h-[50svh] md:min-h-0`}
          aria-label="Mapa okolicy"
        >
          <MapCanvas
            className="absolute inset-0 h-full w-full z-0"
            markers={markers}
            onMapClick={onMapClick}
            onMarkerClick={(marker) => onMapClick({ lat: marker.lat, lng: marker.lng })}
          />
          <LandCard
            assessment={land}
            loading={landLoading}
            error={landError}
            onClose={onCloseLand}
          />
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

function PlaceholderScreen({ title, body }: { title: string; body: string }) {
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
