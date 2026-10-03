import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { ApplicationEditor } from './applications/ApplicationEditor'
import {
  PrepareApplicationForm,
  type CostLineDraft,
} from './applications/PrepareApplicationForm'
import { generateAndSaveApplication } from './applications/api'
import type { ApplicationRecord } from './applications/types'
import { AreasScreen } from './areas/AreasScreen'
import { ideaMatchesAreas, listInterestAreas } from './areas/api'
import { AuthBar } from './auth/AuthBar'
import { useAuth } from './auth/AuthContext'
import { checkLand } from './city/checkLand'
import type { LandAssessment } from './city/types'
import type { CommentRecord } from './comments/api'
import { DEMO_DISCLAIMER, demoFaults, demoIdeas } from './data/demoContent'
import { CreateFaultForm } from './faults/CreateFaultForm'
import { FAULT_STATUS_LABELS, fetchFaults } from './faults/api'
import type { FaultRecord } from './faults/types'
import { CreateIdeaForm } from './ideas/CreateIdeaForm'
import { IdeaDetailCard } from './ideas/IdeaDetailCard'
import { fetchPublishedIdeas } from './ideas/api'
import { fetchMyLikedIdeaIds, setLike } from './ideas/likes'
import type { IdeaRecord } from './ideas/types'
import { useOnline } from './lib/online'
import { isSupabaseConfigured } from './lib/supabase'
import { LandCard } from './map/LandCard'
import { MapCanvas, type MapCircle, type MapMarker } from './map/MapCanvas'
import { MyScreen } from './me/MyScreen'
import { NotificationsScreen } from './notifications/NotificationsScreen'
import { brand } from './theme/tokens'
import { copy } from './ui/copy'

type TabId = 'mapa' | 'dodaj' | 'powiadomienia' | 'moje'
type MapLayer = 'pomysly' | 'usterki'
type MapMode = 'mapa' | 'lista'
type AddKind = 'idea' | 'fault'
type MojeView = 'home' | 'areas'

const TABS: { id: TabId; label: string }[] = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'dodaj', label: 'Dodaj' },
  { id: 'powiadomienia', label: 'Powiadomienia' },
  { id: 'moje', label: 'Moje' },
]

function App() {
  const { user, displayName } = useAuth()
  const online = useOnline()
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabId>('mapa')
  const [addKind, setAddKind] = useState<AddKind>('idea')
  const [mojeView, setMojeView] = useState<MojeView>('home')
  const [layer, setLayer] = useState<MapLayer>('pomysly')
  const [mode, setMode] = useState<MapMode>('mapa')
  const [filterByAreas, setFilterByAreas] = useState(false)
  const [land, setLand] = useState<LandAssessment | null>(null)
  const [landLoading, setLandLoading] = useState(false)
  const [landError, setLandError] = useState<string | null>(null)
  const [draftPoint, setDraftPoint] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [prepareOpen, setPrepareOpen] = useState(false)
  const [prepareComments, setPrepareComments] = useState<CommentRecord[]>([])
  const [generateBusy, setGenerateBusy] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const ideasQuery = useQuery({
    queryKey: ['ideas'],
    queryFn: fetchPublishedIdeas,
    enabled: isSupabaseConfigured,
  })
  const faultsQuery = useQuery({
    queryKey: ['faults'],
    queryFn: fetchFaults,
    enabled: isSupabaseConfigured,
  })
  const areasQuery = useQuery({
    queryKey: ['areas', user?.id],
    queryFn: () => listInterestAreas(user!.id),
    enabled: Boolean(user),
  })
  const likesQuery = useQuery({
    queryKey: ['liked', user?.id],
    queryFn: () => fetchMyLikedIdeaIds(user!.id),
    enabled: Boolean(user),
  })

  const ideas = ideasQuery.data ?? []
  const faults = faultsQuery.data ?? []
  const areas = areasQuery.data ?? []
  const ideasFromDb = ideas.length > 0
  const faultsFromDb = faults.length > 0

  useEffect(() => {
    if (likesQuery.data) setLikedIds(likesQuery.data)
  }, [likesQuery.data])

  const filteredIdeas = useMemo(() => {
    if (!filterByAreas || areas.length === 0) return ideas
    return ideas.filter((idea) => ideaMatchesAreas(idea, areas))
  }, [ideas, areas, filterByAreas])

  async function handleMapClick(point: { lat: number; lng: number }) {
    setSelectedIdeaId(null)
    setDraftPoint(point)
    setLandLoading(true)
    setLandError(null)
    try {
      const result = await checkLand(point)
      setLand(result)
    } catch {
      setLand(null)
      setLandError(copy.landError)
    } finally {
      setLandLoading(false)
    }
  }

  async function handleLikeToggle(ideaId: string, liked: boolean) {
    if (!user) throw new Error('Wymagane logowanie.')
    const previous = new Set(likedIds)
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (liked) next.add(ideaId)
      else next.delete(ideaId)
      return next
    })
    try {
      await setLike(ideaId, user.id, liked)
      await qc.invalidateQueries({ queryKey: ['ideas'] })
      await qc.invalidateQueries({ queryKey: ['notifications', user.id] })
    } catch (err) {
      setLikedIds(previous)
      throw err
    }
  }

  async function handleGenerate(
    idea: IdeaRecord,
    comments: CommentRecord[],
    costItems: CostLineDraft[],
  ) {
    if (!user) throw new Error('Wymagane logowanie.')
    setGenerateBusy(true)
    setGenerateError(null)
    try {
      const landNote = land
        ? `Ocena terenu: ${land.assessment}${land.scenarioDescription ? ` — ${land.scenarioDescription}` : ''}`
        : undefined
      const doc = await generateAndSaveApplication({
        idea,
        authorId: user.id,
        selectedComments: comments.map((c) => ({ id: c.id, body: c.body })),
        costItems,
        landNote,
      })
      setPrepareOpen(false)
      setApplication(doc)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generowanie nie powiodło się.')
    } finally {
      setGenerateBusy(false)
    }
  }

  const selectedIdea =
    filteredIdeas.find((idea) => idea.id === selectedIdeaId) ?? null

  if (application) {
    return (
      <div className="min-h-svh flex flex-col">
        <header className="shrink-0 px-4 py-3 border-b border-black/5 bg-white/90">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <h1 className="text-xl font-semibold m-0" style={{ color: 'var(--color-ideas)' }}>
              {brand.name}
            </h1>
            <AuthBar />
          </div>
        </header>
        <ApplicationEditor
          application={application}
          ideaTitle={selectedIdea?.title}
          onClose={() => setApplication(null)}
        />
      </div>
    )
  }

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
              {!online ? ` · ${copy.offlineDraft}` : ''}
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
            ideas={ideasFromDb ? filteredIdeas : null}
            faults={faultsFromDb ? faults : null}
            areas={areas}
            filterByAreas={filterByAreas}
            ideasSource={ideasFromDb ? 'db' : 'demo'}
            faultsSource={faultsFromDb ? 'db' : 'demo'}
            selectedIdea={selectedIdea}
            likedIds={likedIds}
            userId={user?.id ?? null}
            onFilterByAreasChange={setFilterByAreas}
            onLayerChange={setLayer}
            onModeChange={setMode}
            onAdd={() => {
              setAddKind(layer === 'usterki' ? 'fault' : 'idea')
              setTab('dodaj')
            }}
            onMapClick={handleMapClick}
            onSelectIdea={(id) => {
              setSelectedIdeaId(id)
              setLand(null)
              setLandError(null)
            }}
            onCloseIdea={() => setSelectedIdeaId(null)}
            onLikeToggle={handleLikeToggle}
            onCloseLand={() => {
              setLand(null)
              setLandError(null)
            }}
            onCheckLandForIdea={(idea) => {
              void handleMapClick({ lat: idea.lat, lng: idea.lng })
            }}
            onPrepareApplication={(comments) => {
              setPrepareComments(comments)
              setPrepareOpen(true)
              setGenerateError(null)
            }}
            prepareOpen={prepareOpen}
            generateBusy={generateBusy}
            generateError={generateError}
            onCancelPrepare={() => {
              setPrepareOpen(false)
              setGenerateError(null)
            }}
            onConfirmPrepare={(items) => {
              if (!selectedIdea) return
              void handleGenerate(selectedIdea, prepareComments, items)
            }}
            onThresholdSaved={() => void qc.invalidateQueries({ queryKey: ['ideas'] })}
          />
        )}
        {tab === 'dodaj' && addKind === 'idea' && (
          <CreateIdeaForm
            initialPoint={draftPoint}
            onSwitchToFault={() => setAddKind('fault')}
            onCreated={() => {
              void qc.invalidateQueries({ queryKey: ['ideas'] })
              setLayer('pomysly')
              setTab('mapa')
            }}
          />
        )}
        {tab === 'dodaj' && addKind === 'fault' && (
          <CreateFaultForm
            initialPoint={draftPoint}
            onSwitchToIdea={() => setAddKind('idea')}
            onCreated={() => {
              void qc.invalidateQueries({ queryKey: ['faults'] })
              setLayer('usterki')
              setTab('mapa')
            }}
          />
        )}
        {tab === 'powiadomienia' && <NotificationsScreen />}
        {tab === 'moje' && mojeView === 'home' && (
          <MyScreen
            onOpenAreas={() => setMojeView('areas')}
            onOpenApplication={(app) => setApplication(app)}
          />
        )}
        {tab === 'moje' && mojeView === 'areas' && (
          <div className="flex-1 min-h-0 flex flex-col">
            <button
              type="button"
              className="self-start m-3 text-sm border-0 bg-transparent cursor-pointer"
              style={{ color: 'var(--color-action)' }}
              onClick={() => setMojeView('home')}
            >
              ← Wróć do Moje
            </button>
            <AreasScreen draftPoint={draftPoint} />
          </div>
        )}
      </main>

      <nav
        className="md:hidden shrink-0 border-t border-black/5 bg-white px-2 py-1 grid grid-cols-4 gap-1 text-xs text-center z-20"
        aria-label="Nawigacja dolna"
      >
        {TABS.map(({ id, label }) => (
          <NavButton
            key={id}
            label={label}
            active={tab === id}
            onClick={() => {
              setTab(id)
              if (id === 'moje') setMojeView('home')
            }}
          />
        ))}
      </nav>

      <nav
        className="hidden md:flex shrink-0 border-t border-black/5 bg-white px-4 py-2 justify-center gap-6 text-sm z-20"
        aria-label="Nawigacja"
      >
        {TABS.map(({ id, label }) => (
          <NavButton
            key={id}
            label={label}
            active={tab === id}
            onClick={() => {
              setTab(id)
              if (id === 'moje') setMojeView('home')
            }}
          />
        ))}
      </nav>
      {displayName ? null : null}
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
  faults: FaultRecord[] | null
  areas: { id: string; lat: number | null; lng: number | null; radius_m: number | null; kind: string }[]
  filterByAreas: boolean
  ideasSource: 'db' | 'demo'
  faultsSource: 'db' | 'demo'
  selectedIdea: IdeaRecord | null
  likedIds: Set<string>
  userId: string | null
  onFilterByAreasChange: (v: boolean) => void
  onLayerChange: (layer: MapLayer) => void
  onModeChange: (mode: MapMode) => void
  onAdd: () => void
  onMapClick: (point: { lat: number; lng: number }) => void
  onSelectIdea: (id: string) => void
  onCloseIdea: () => void
  onLikeToggle: (ideaId: string, liked: boolean) => Promise<void>
  onCloseLand: () => void
  onCheckLandForIdea: (idea: IdeaRecord) => void
  onPrepareApplication: (comments: CommentRecord[]) => void
  prepareOpen: boolean
  generateBusy: boolean
  generateError: string | null
  onCancelPrepare: () => void
  onConfirmPrepare: (items: CostLineDraft[]) => void
  onThresholdSaved: () => void
}

function MapScreen({
  layer,
  mode,
  land,
  landLoading,
  landError,
  ideas,
  faults,
  areas,
  filterByAreas,
  ideasSource,
  faultsSource,
  selectedIdea,
  likedIds,
  userId,
  onFilterByAreasChange,
  onLayerChange,
  onModeChange,
  onAdd,
  onMapClick,
  onSelectIdea,
  onCloseIdea,
  onLikeToggle,
  onCloseLand,
  onCheckLandForIdea,
  onPrepareApplication,
  prepareOpen,
  generateBusy,
  generateError,
  onCancelPrepare,
  onConfirmPrepare,
  onThresholdSaved,
}: MapScreenProps) {
  const topIdeaIds = useMemo(() => {
    const list = ideas ?? []
    return new Set(list.slice(0, 3).map((i) => i.id))
  }, [ideas])

  const markers: MapMarker[] = useMemo(() => {
    if (layer === 'pomysly') {
      if (ideas) {
        return ideas.map((idea) => ({
          id: idea.id,
          lat: idea.lat,
          lng: idea.lng,
          kind: 'idea' as const,
          label: idea.title,
          highlight: topIdeaIds.has(idea.id),
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
    if (faults) {
      return faults.map((fault) => ({
        id: fault.id,
        lat: fault.lat,
        lng: fault.lng,
        kind: 'fault' as const,
        label: fault.description.slice(0, 40),
      }))
    }
    return demoFaults.map((fault) => ({
      id: fault.id,
      lat: fault.lat,
      lng: fault.lng,
      kind: 'fault' as const,
      label: fault.title,
    }))
  }, [layer, ideas, faults, topIdeaIds])

  const circles: MapCircle[] = useMemo(
    () =>
      areas
        .filter(
          (a) =>
            a.kind === 'radius' &&
            a.lat != null &&
            a.lng != null &&
            a.radius_m != null,
        )
        .map((a) => ({
          id: a.id,
          lat: a.lat!,
          lng: a.lng!,
          radiusM: a.radius_m!,
        })),
    [areas],
  )

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

        <label className="inline-flex items-center gap-1 text-xs text-[var(--color-text)]/70">
          <input
            type="checkbox"
            checked={filterByAreas}
            onChange={(e) => onFilterByAreasChange(e.target.checked)}
          />
          Filtr: moje okolice
        </label>

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
        {` · Pomysły: ${ideasSource} · Usterki: ${faultsSource}`}
      </p>

      <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(260px,340px)_1fr]">
        <aside
          className={`${mode === 'lista' ? 'flex' : 'hidden'} md:flex flex-col min-h-0 border-r border-black/5 bg-white overflow-y-auto`}
          aria-label={layer === 'pomysly' ? 'Lista pomysłów' : 'Lista usterek'}
        >
          {layer === 'pomysly' ? (
            <ul className="m-0 p-0 list-none">
              {ideas ? (
                ideas.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-[var(--color-text)]/60">
                    {copy.emptyIdeas}
                  </li>
                ) : (
                  ideas.map((idea) => (
                    <li key={idea.id} className="border-b border-black/5">
                      <button
                        type="button"
                        onClick={() => onSelectIdea(idea.id)}
                        className="w-full text-left px-4 py-3 border-0 bg-transparent cursor-pointer"
                        style={{
                          background:
                            selectedIdea?.id === idea.id
                              ? 'color-mix(in srgb, var(--color-ideas) 8%, white)'
                              : 'transparent',
                        }}
                      >
                        <p className="m-0 font-medium">
                          {idea.title}
                          {topIdeaIds.has(idea.id) ? ' · top' : ''}
                        </p>
                        <p className="m-0 mt-1 text-sm text-[var(--color-text)]/65">
                          {idea.district_code ?? 'Kraków'} · {idea.likes_count}/
                          {idea.support_threshold} · 👍 {idea.likes_count}
                        </p>
                      </button>
                    </li>
                  ))
                )
              ) : (
                demoIdeas.map((idea) => (
                  <li key={idea.id} className="border-b border-black/5 px-4 py-3">
                    <p className="m-0 font-medium">{idea.title}</p>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <ul className="m-0 p-0 list-none">
              {faults
                ? faults.map((fault) => (
                    <li key={fault.id} className="border-b border-black/5 px-4 py-3">
                      <p className="m-0 font-medium">{fault.description}</p>
                      <p className="m-0 mt-1 text-sm text-[var(--color-text)]/65">
                        {FAULT_STATUS_LABELS[fault.status] ?? fault.status}
                      </p>
                    </li>
                  ))
                : demoFaults.map((fault) => (
                    <li key={fault.id} className="border-b border-black/5 px-4 py-3">
                      <p className="m-0 font-medium">{fault.title}</p>
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
            circles={circles}
            onMapClick={onMapClick}
            onMarkerClick={(marker) => {
              if (marker.kind === 'idea' && ideas) {
                onSelectIdea(marker.id)
                return
              }
              onMapClick({ lat: marker.lat, lng: marker.lng })
            }}
          />
          {prepareOpen && selectedIdea ? (
            <>
              <PrepareApplicationForm
                busy={generateBusy}
                onCancel={onCancelPrepare}
                onConfirm={onConfirmPrepare}
              />
              {generateError && (
                <p
                  className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[400px] bottom-[calc(4rem+40vh)] z-20 m-0 p-2 rounded-[var(--radius-card)] bg-white border text-sm"
                  style={{ color: 'var(--color-faults)' }}
                >
                  {generateError}
                </p>
              )}
            </>
          ) : selectedIdea && !land && !landLoading ? (
            <IdeaDetailCard
              idea={selectedIdea}
              liked={likedIds.has(selectedIdea.id)}
              canLike={Boolean(userId)}
              isAuthor={Boolean(userId && userId === selectedIdea.author_id)}
              userId={userId}
              onLikeToggle={(liked) => onLikeToggle(selectedIdea.id, liked)}
              onClose={onCloseIdea}
              onCheckLand={() => onCheckLandForIdea(selectedIdea)}
              onPrepareApplication={onPrepareApplication}
              onThresholdSaved={onThresholdSaved}
            />
          ) : (
            <LandCard
              assessment={land}
              loading={landLoading}
              error={landError}
              onClose={onCloseLand}
            />
          )}
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

export default App
