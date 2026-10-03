import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
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
import { FaultDetailCard } from './faults/FaultDetailCard'
import { FAULT_CATEGORY_LABELS, FAULT_STATUS_LABELS, fetchFaults } from './faults/api'
import type { FaultRecord } from './faults/types'
import { CreateIdeaForm } from './ideas/CreateIdeaForm'
import { IdeaDetailCard } from './ideas/IdeaDetailCard'
import { fetchPublishedIdeas } from './ideas/api'
import {
  emptyIdeaFilters,
  filterIdeas,
  uniqueDistricts,
  type IdeaListFilters,
} from './ideas/filters'
import { fetchMyLikedIdeaIds, setLike } from './ideas/likes'
import type { IdeaRecord } from './ideas/types'
import { useOnline } from './lib/online'
import { isSupabaseConfigured } from './lib/supabase'
import { LandCard } from './map/LandCard'
import { MapCanvas, type MapCircle, type MapMarker, type WmsLayerId } from './map/MapCanvas'
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
  const [ideaFilters, setIdeaFilters] = useState<IdeaListFilters>(emptyIdeaFilters)
  const [wmsLayer, setWmsLayer] = useState<WmsLayerId>('none')
  const [showDistricts, setShowDistricts] = useState(false)
  const [showMunicipalLand, setShowMunicipalLand] = useState(true)
  const [land, setLand] = useState<LandAssessment | null>(null)
  const [landLoading, setLandLoading] = useState(false)
  const [landError, setLandError] = useState<string | null>(null)
  const [draftPoint, setDraftPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [selectedFaultId, setSelectedFaultId] = useState<string | null>(null)
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

  // Ranking ideas: likes_count DESC, created_at DESC, id ASC (spec §4)
  const filteredIdeas = useMemo(() => {
    let list = filterIdeas(ideas, ideaFilters)
    if (filterByAreas && areas.length > 0) {
      list = list.filter((idea) => ideaMatchesAreas(idea, areas))
    }
    return [...list].sort((a, b) => {
      if (b.likes_count !== a.likes_count) return b.likes_count - a.likes_count
      const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (timeDiff !== 0) return timeDiff
      return a.id.localeCompare(b.id)
    })
  }, [ideas, areas, filterByAreas, ideaFilters])

  const filteredDemoIdeas = useMemo(() => {
    let list = demoIdeas
    if (ideaFilters.category) {
      list = list.filter((i) => i.category === ideaFilters.category)
    }
    return [...list].sort((a, b) => b.likesCount - a.likesCount)
  }, [ideaFilters.category])

  async function handleMapClick(point: { lat: number; lng: number }) {
    setSelectedIdeaId(null)
    setSelectedFaultId(null)
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
    (ideasFromDb ? filteredIdeas : []).find((idea) => idea.id === selectedIdeaId) ?? null

  const selectedFault = useMemo(() => {
    if (!selectedFaultId) return null
    if (faultsFromDb) {
      return faults.find((f) => f.id === selectedFaultId) ?? null
    }
    return demoFaults.find((f) => f.id === selectedFaultId) ?? null
  }, [selectedFaultId, faults, faultsFromDb])

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
            draftPoint={draftPoint}
            ideas={ideasFromDb ? filteredIdeas : null}
            demoIdeas={filteredDemoIdeas}
            faults={faultsFromDb ? faults : null}
            areas={areas}
            filterByAreas={filterByAreas}
            ideaFilters={ideaFilters}
            districtOptions={uniqueDistricts(ideas)}
            wmsLayer={wmsLayer}
            showDistricts={showDistricts}
            showMunicipalLand={showMunicipalLand}
            ideasSource={ideasFromDb ? 'db' : 'demo'}
            faultsSource={faultsFromDb ? 'db' : 'demo'}
            selectedIdea={selectedIdea}
            selectedFault={selectedFault}
            likedIds={likedIds}
            userId={user?.id ?? null}
            onFilterByAreasChange={setFilterByAreas}
            onIdeaFiltersChange={setIdeaFilters}
            onWmsLayerChange={setWmsLayer}
            onShowDistrictsChange={setShowDistricts}
            onShowMunicipalLandChange={setShowMunicipalLand}
            onLayerChange={(next) => {
              setLayer(next)
              setSelectedIdeaId(null)
              setSelectedFaultId(null)
            }}
            onModeChange={setMode}
            onAdd={() => {
              setAddKind(layer === 'usterki' ? 'fault' : 'idea')
              setTab('dodaj')
            }}
            onMapClick={handleMapClick}
            onSelectIdea={(id) => {
              setSelectedIdeaId(id)
              setSelectedFaultId(null)
              setLand(null)
              setLandError(null)
            }}
            onSelectFault={(id) => {
              setSelectedFaultId(id)
              setSelectedIdeaId(null)
              setLand(null)
              setLandError(null)
            }}
            onCloseIdea={() => setSelectedIdeaId(null)}
            onCloseFault={() => setSelectedFaultId(null)}
            onFaultUpdated={() => {
              void qc.invalidateQueries({ queryKey: ['faults'] })
            }}
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
            onCheckLandForPoint={(point) => {
              void handleMapClick(point)
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
              className="self-start m-3 text-sm border-0 bg-transparent cursor-pointer font-medium"
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
  draftPoint: { lat: number; lng: number } | null
  ideas: IdeaRecord[] | null
  demoIdeas: typeof demoIdeas
  faults: FaultRecord[] | null
  areas: {
    id: string
    lat: number | null
    lng: number | null
    radius_m: number | null
    kind: string
    district_code: string | null
  }[]
  filterByAreas: boolean
  ideaFilters: IdeaListFilters
  districtOptions: string[]
  wmsLayer: WmsLayerId
  showDistricts: boolean
  showMunicipalLand: boolean
  ideasSource: 'db' | 'demo'
  faultsSource: 'db' | 'demo'
  selectedIdea: IdeaRecord | null
  selectedFault: FaultRecord | (typeof demoFaults)[0] | null
  likedIds: Set<string>
  userId: string | null
  onFilterByAreasChange: (v: boolean) => void
  onIdeaFiltersChange: (f: IdeaListFilters) => void
  onWmsLayerChange: (layer: WmsLayerId) => void
  onShowDistrictsChange: (v: boolean) => void
  onShowMunicipalLandChange: (v: boolean) => void
  onLayerChange: (layer: MapLayer) => void
  onModeChange: (mode: MapMode) => void
  onAdd: () => void
  onMapClick: (point: { lat: number; lng: number }) => void
  onSelectIdea: (id: string) => void
  onSelectFault: (id: string) => void
  onCloseIdea: () => void
  onCloseFault: () => void
  onFaultUpdated: () => void
  onLikeToggle: (ideaId: string, liked: boolean) => Promise<void>
  onCloseLand: () => void
  onCheckLandForIdea: (idea: IdeaRecord) => void
  onCheckLandForPoint: (point: { lat: number; lng: number }) => void
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
  draftPoint,
  ideas,
  demoIdeas,
  faults,
  areas,
  filterByAreas,
  ideaFilters,
  districtOptions,
  wmsLayer,
  showDistricts,
  showMunicipalLand,
  ideasSource,
  faultsSource,
  selectedIdea,
  selectedFault,
  likedIds,
  userId,
  onFilterByAreasChange,
  onIdeaFiltersChange,
  onWmsLayerChange,
  onShowDistrictsChange,
  onShowMunicipalLandChange,
  onLayerChange,
  onModeChange,
  onAdd,
  onMapClick,
  onSelectIdea,
  onSelectFault,
  onCloseIdea,
  onCloseFault,
  onFaultUpdated,
  onLikeToggle,
  onCloseLand,
  onCheckLandForIdea,
  onCheckLandForPoint,
  onPrepareApplication,
  prepareOpen,
  generateBusy,
  generateError,
  onCancelPrepare,
  onConfirmPrepare,
  onThresholdSaved,
}: MapScreenProps) {
  const topIdeaIds = useMemo(() => {
    const list = ideas ?? demoIdeas
    return new Set(list.slice(0, 3).map((i) => i.id))
  }, [ideas, demoIdeas])

  const markers: MapMarker[] = useMemo(() => {
    if (layer === 'pomysly') {
      if (ideas) {
        return ideas.map((idea) => ({
          id: idea.id,
          lat: idea.lat,
          lng: idea.lng,
          kind: 'idea' as const,
          label: idea.title,
          sublabel: `${idea.likes_count}/${idea.support_threshold} poparć`,
          highlight: topIdeaIds.has(idea.id),
        }))
      }
      return demoIdeas.map((idea) => ({
        id: idea.id,
        lat: idea.lat,
        lng: idea.lng,
        kind: 'idea' as const,
        label: idea.title,
        sublabel: `${idea.likesCount}/${idea.supportThreshold} poparć`,
        highlight: topIdeaIds.has(idea.id),
      }))
    }
    if (faults) {
      return faults.map((fault) => ({
        id: fault.id,
        lat: fault.lat,
        lng: fault.lng,
        kind: 'fault' as const,
        label: fault.description.slice(0, 40),
        sublabel: FAULT_STATUS_LABELS[fault.status] ?? fault.status,
      }))
    }
    return demoFaults.map((fault) => ({
      id: fault.id,
      lat: fault.lat,
      lng: fault.lng,
      kind: 'fault' as const,
      label: fault.title,
      sublabel: fault.status,
    }))
  }, [layer, ideas, demoIdeas, faults, topIdeaIds])

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

  const highlightedDistricts = useMemo(
    () =>
      areas
        .filter((a) => a.kind === 'district' && a.district_code)
        .map((a) => a.district_code as string),
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

        {layer === 'pomysly' && (
          <div className="hidden sm:inline-flex rounded-[var(--radius-card)] bg-[var(--color-bg)] p-1 text-xs">
            <button
              type="button"
              onClick={() => onIdeaFiltersChange({ ...ideaFilters, category: '' })}
              className={`px-2.5 py-1 rounded-md border-0 cursor-pointer font-medium ${
                ideaFilters.category === '' ? 'bg-white shadow-sm text-[var(--color-text)]' : 'bg-transparent text-[var(--color-text)]/60'
              }`}
            >
              Wszystkie
            </button>
            <button
              type="button"
              onClick={() => onIdeaFiltersChange({ ...ideaFilters, category: 'investment' })}
              className={`px-2.5 py-1 rounded-md border-0 cursor-pointer font-medium ${
                ideaFilters.category === 'investment' ? 'bg-white shadow-sm text-[var(--color-ideas)]' : 'bg-transparent text-[var(--color-text)]/60'
              }`}
            >
              Inwestycyjne
            </button>
            <button
              type="button"
              onClick={() => onIdeaFiltersChange({ ...ideaFilters, category: 'non_investment' })}
              className={`px-2.5 py-1 rounded-md border-0 cursor-pointer font-medium ${
                ideaFilters.category === 'non_investment' ? 'bg-white shadow-sm text-[var(--color-ideas)]' : 'bg-transparent text-[var(--color-text)]/60'
              }`}
            >
              Nieinwestycyjne
            </button>
          </div>
        )}

        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]/75 cursor-pointer">
          <input
            type="checkbox"
            checked={filterByAreas}
            onChange={(e) => onFilterByAreasChange(e.target.checked)}
            className="rounded"
          />
          Moje okolice
        </label>

        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]/75 cursor-pointer">
          <input
            type="checkbox"
            checked={showMunicipalLand}
            onChange={(e) => onShowMunicipalLandChange(e.target.checked)}
            className="rounded"
          />
          Grunty gminne
        </label>

        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]/75 cursor-pointer">
          <input
            type="checkbox"
            checked={showDistricts}
            onChange={(e) => onShowDistrictsChange(e.target.checked)}
            className="rounded"
          />
          Dzielnice
        </label>

        {layer === 'pomysly' && (
          <div
            className="flex flex-wrap items-center gap-1 text-xs"
            role="group"
            aria-label="Filtry listy pomysłów"
          >
            <select
              value={ideaFilters.district}
              onChange={(e) =>
                onIdeaFiltersChange({ ...ideaFilters, district: e.target.value })
              }
              className="min-h-9 px-2 rounded-[var(--radius-card)] border border-black/10 bg-white"
              aria-label="Dzielnica"
            >
              <option value="">Dzielnica: wszystkie</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={ideaFilters.category}
              onChange={(e) =>
                onIdeaFiltersChange({
                  ...ideaFilters,
                  category: e.target.value as IdeaListFilters['category'],
                })
              }
              className="min-h-9 px-2 rounded-[var(--radius-card)] border border-black/10 bg-white"
              aria-label="Kategoria"
            >
              <option value="">Kategoria: wszystkie</option>
              <option value="investment">Inwestycyjne</option>
              <option value="non_investment">Nieinwestycyjne</option>
            </select>
            <label className="inline-flex items-center gap-1 text-[var(--color-text)]/70">
              Min. lajki
              <input
                type="number"
                min={0}
                max={50}
                value={ideaFilters.minLikes}
                onChange={(e) =>
                  onIdeaFiltersChange({
                    ...ideaFilters,
                    minLikes: Number(e.target.value) || 0,
                  })
                }
                className="w-14 min-h-9 px-2 rounded-[var(--radius-card)] border border-black/10 bg-white"
              />
            </label>
          </div>
        )}

        <div className="inline-flex items-center gap-1 text-xs text-[var(--color-text)]/70">
          <Layers size={14} className="text-[var(--color-text)]/50" />
          <select
            value={wmsLayer}
            onChange={(e) => onWmsLayerChange(e.target.value as WmsLayerId)}
            className="min-h-8 px-2 py-0.5 rounded-md border border-black/10 bg-[var(--color-bg)] text-xs font-medium cursor-pointer"
            aria-label="Warstwa WMS"
          >
            <option value="none">WMS: Brak (OSM)</option>
            <option value="mpzp">WMS: MPZP Kraków</option>
            <option value="ownership">WMS: Własność</option>
          </select>
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
          className="hidden md:inline-flex items-center justify-center min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer shadow-sm hover:opacity-95"
          style={{ background: 'var(--color-action)' }}
        >
          Dodaj
        </button>
      </div>

      <p className="m-0 px-3 py-1.5 text-[11px] text-[var(--color-text)]/65 bg-[var(--color-bg)] border-b border-black/5 flex items-center justify-between">
        <span>
          {DEMO_DISCLAIMER}
          {` · Pomysły: ${ideasSource} · Usterki: ${faultsSource}`}
        </span>
        <span className="inline-flex items-center gap-2">
          {showMunicipalLand && (
            <span className="font-medium text-[#142D6E]">
              Grunty Gminy Kraków (GK)
            </span>
          )}
          {showDistricts && (
            <span className="font-medium text-emerald-800">
              Obrys dzielnic (poglądowy)
            </span>
          )}
          {wmsLayer !== 'none' && (
            <span className="font-semibold text-blue-700">
              WMS: {wmsLayer === 'mpzp' ? 'MPZP (Plany)' : 'Struktura Własności'}
            </span>
          )}
        </span>
      </p>

      <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(280px,360px)_1fr]">
        <aside
          className={`${mode === 'lista' ? 'flex' : 'hidden'} md:flex flex-col min-h-0 border-r border-black/5 bg-white overflow-y-auto`}
          aria-label={layer === 'pomysly' ? 'Lista pomysłów' : 'Lista usterek'}
        >
          {layer === 'pomysly' ? (
            <ul className="m-0 p-0 list-none divide-y divide-black/5">
              {ideas ? (
                ideas.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-[var(--color-text)]/60">
                    <p className="m-0 font-medium">{copy.emptyIdeas}</p>
                    <button
                      type="button"
                      onClick={onAdd}
                      className="mt-3 px-3 py-1.5 rounded-lg border-0 text-white text-xs font-medium cursor-pointer"
                      style={{ background: 'var(--color-ideas)' }}
                    >
                      Dodaj pomysł teraz
                    </button>
                  </li>
                ) : (
                  ideas.map((idea, index) => (
                    <li key={idea.id}>
                      <button
                        type="button"
                        onClick={() => onSelectIdea(idea.id)}
                        className="w-full text-left px-4 py-3 border-0 bg-transparent cursor-pointer hover:bg-black/5 transition-colors"
                        style={{
                          background:
                            selectedIdea?.id === idea.id
                              ? 'color-mix(in srgb, var(--color-ideas) 8%, white)'
                              : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-[var(--color-ideas)] uppercase tracking-wider">
                            {index < 3 ? `★ #${index + 1} TOP` : `#${index + 1}`}
                          </span>
                          <span className="text-[11px] text-[var(--color-text)]/50">
                            {idea.district_code ?? 'Kraków'}
                          </span>
                        </div>
                        <p className="m-0 mt-0.5 font-medium text-sm text-[var(--color-text)]">
                          {idea.title}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--color-text)]/65">
                          <span>
                            👍 <strong>{idea.likes_count}</strong> / {idea.support_threshold} poparć
                          </span>
                          <span className="text-[11px] font-medium text-emerald-700">
                            {idea.likes_count >= idea.support_threshold ? '✓ Odblokowany BO' : 'w toku'}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))
                )
              ) : (
                demoIdeas.map((idea, index) => (
                  <li key={idea.id} className="border-b border-black/5">
                    <button
                      type="button"
                      onClick={() => onMapClick({ lat: idea.lat, lng: idea.lng })}
                      className="w-full text-left px-4 py-3 border-0 bg-transparent cursor-pointer hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[var(--color-ideas)]">
                          {index < 3 ? `★ #${index + 1} TOP` : `#${index + 1}`}
                        </span>
                        <span className="text-[var(--color-text)]/50">{idea.district}</span>
                      </div>
                      <p className="m-0 mt-0.5 font-medium text-sm">{idea.title}</p>
                      <p className="m-0 mt-1 text-xs text-[var(--color-text)]/65">
                        👍 {idea.likesCount} / {idea.supportThreshold} poparć
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <ul className="m-0 p-0 list-none divide-y divide-black/5">
              {faults ? (
                faults.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-[var(--color-text)]/60">
                    Brak zgłoszonych usterek w tym widoku.
                  </li>
                ) : (
                  faults.map((fault) => (
                    <li key={fault.id}>
                      <button
                        type="button"
                        onClick={() => onSelectFault(fault.id)}
                        className="w-full text-left px-4 py-3 border-0 bg-transparent cursor-pointer hover:bg-black/5 transition-colors"
                        style={{
                          background:
                            selectedFault?.id === fault.id
                              ? 'color-mix(in srgb, var(--color-faults) 8%, white)'
                              : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
                          <span className="font-semibold text-[var(--color-faults)]">
                            {FAULT_CATEGORY_LABELS[fault.category] ?? fault.category}
                          </span>
                          <span className="text-[var(--color-text)]/60">
                            {FAULT_STATUS_LABELS[fault.status] ?? fault.status}
                          </span>
                        </div>
                        <p className="m-0 font-medium text-sm text-[var(--color-text)]">
                          {fault.description}
                        </p>
                      </button>
                    </li>
                  ))
                )
              ) : (
                demoFaults.map((fault) => (
                  <li key={fault.id}>
                    <button
                      type="button"
                      onClick={() => onSelectFault(fault.id)}
                      className="w-full text-left px-4 py-3 border-0 bg-transparent cursor-pointer hover:bg-black/5 transition-colors"
                      style={{
                        background:
                          selectedFault?.id === fault.id
                            ? 'color-mix(in srgb, var(--color-faults) 8%, white)'
                            : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[var(--color-faults)]">
                          {FAULT_CATEGORY_LABELS[fault.category] ?? fault.category}
                        </span>
                        <span className="text-[var(--color-text)]/60">{fault.status}</span>
                      </div>
                      <p className="m-0 font-medium text-sm">{fault.title}</p>
                      <p className="m-0 text-xs text-[var(--color-text)]/65">{fault.description}</p>
                    </button>
                  </li>
                ))
              )}
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
            draftPoint={draftPoint}
            wmsLayer={wmsLayer}
            showDistricts={showDistricts}
            showMunicipalLand={showMunicipalLand}
            highlightedDistricts={highlightedDistricts}
            onMapClick={onMapClick}
            onMarkerClick={(marker) => {
              if (marker.kind === 'idea') {
                onSelectIdea(marker.id)
                return
              }
              if (marker.kind === 'fault') {
                onSelectFault(marker.id)
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
          ) : null}

          {selectedIdea && !land && !landLoading && !prepareOpen && (
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
          )}

          {selectedFault && !land && !landLoading && (
            <FaultDetailCard
              fault={selectedFault}
              userId={userId}
              onClose={onCloseFault}
              onUpdated={() => onFaultUpdated()}
              onCheckLand={() =>
                onCheckLandForPoint({ lat: selectedFault.lat, lng: selectedFault.lng })
              }
            />
          )}

          {!selectedIdea && !selectedFault && (
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
            className="md:hidden absolute bottom-4 right-4 z-10 min-h-12 min-w-12 px-4 rounded-full border-0 text-white text-sm font-medium shadow-lg cursor-pointer"
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
