import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Layers,
  MapPinned,
  Pencil,
  Plus,
  Shapes,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getCurrentPosition } from '../lib/geolocation'
import { PolygonPicker } from '../map/PolygonPicker'
import { copy } from '../ui/copy'
import {
  KRAKOW_DISTRICTS,
  createDistrictArea,
  createPolygonArea,
  deleteInterestArea,
  listInterestAreas,
  updateDistrictArea,
  updatePolygonArea,
  type InterestArea,
} from './api'
import {
  mergePolygonAreas,
  type LatLngPoint,
} from './polygon'

type AreasScreenProps = {
  draftPoint?: { lat: number; lng: number } | null
}

function makeDefaultQuad(center: LatLngPoint): LatLngPoint[] {
  const deltaLat = 0.002
  const deltaLng = 0.003
  return [
    { lat: Number((center.lat + deltaLat).toFixed(5)), lng: Number((center.lng - deltaLng).toFixed(5)) },
    { lat: Number((center.lat + deltaLat).toFixed(5)), lng: Number((center.lng + deltaLng).toFixed(5)) },
    { lat: Number((center.lat - deltaLat).toFixed(5)), lng: Number((center.lng + deltaLng).toFixed(5)) },
    { lat: Number((center.lat - deltaLat).toFixed(5)), lng: Number((center.lng - deltaLng).toFixed(5)) },
  ]
}

export function AreasScreen({ draftPoint }: AreasScreenProps) {
  const { user, openAuthModal } = useAuth()
  const qc = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(Boolean(draftPoint))
  const [editingArea, setEditingArea] = useState<InterestArea | null>(null)
  const [formKind, setFormKind] = useState<'polygon' | 'district'>('polygon')

  const [district, setDistrict] = useState<string>(KRAKOW_DISTRICTS[4])
  const [areaName, setAreaName] = useState('Moja okolica')
  const [polygonPoints, setPolygonPoints] = useState<LatLngPoint[]>(
    draftPoint ? makeDefaultQuad(draftPoint) : [],
  )

  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null)

  useEffect(() => {
    if (draftPoint) {
      setPolygonPoints(makeDefaultQuad(draftPoint))
      setIsFormOpen(true)
      setFormKind('polygon')
    }
  }, [draftPoint])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (justUpdatedId) {
      const timer = setTimeout(() => {
        setJustUpdatedId(null)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [justUpdatedId])

  async function handleGps() {
    setLocating(true)
    setError(null)
    const pos = await getCurrentPosition()
    setLocating(false)
    if (!pos.ok) {
      setError(copy.gpsDenied)
      return
    }
    setPolygonPoints(makeDefaultQuad({ lat: pos.lat, lng: pos.lng }))
  }

  const query = useQuery({
    queryKey: ['areas', user?.id],
    enabled: Boolean(user),
    queryFn: () => listInterestAreas(user!.id),
  })

  if (!user) {
    return (
      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
        <section className="rounded-[var(--radius-card)] bg-white p-6 border border-black/5 shadow-xs">
          <h2 className="m-0 text-lg font-semibold">Moje okolice</h2>
          <p className="mt-2 mb-4 text-sm text-[var(--color-text)]/70">
            Zaloguj się, aby zapisać swoje ulubione wielokątne okolice i dzielnice na mapie.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="min-h-10 px-4 rounded-xl border-0 text-white text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90 inline-flex items-center gap-1.5"
              style={{ background: 'var(--color-action)' }}
            >
              Zaloguj się
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="min-h-10 px-4 rounded-xl border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold cursor-pointer text-[var(--color-text)] inline-flex items-center gap-1.5"
            >
              Zarejestruj się
            </button>
          </div>
        </section>
      </div>
    )
  }

  async function refresh() {
    if (!user) return
    await qc.invalidateQueries({ queryKey: ['areas', user.id] })
  }

  function startAdding() {
    setEditingArea(null)
    setFormKind('polygon')
    setAreaName('Moja okolica')
    setPolygonPoints(draftPoint ? makeDefaultQuad(draftPoint) : [])
    setDistrict(KRAKOW_DISTRICTS[4])
    setError(null)
    setIsFormOpen(true)
  }

  function startEditing(area: InterestArea) {
    setEditingArea(area)
    setAreaName(area.name)
    if (area.kind === 'district') {
      setFormKind('district')
      setDistrict(area.district_code ?? KRAKOW_DISTRICTS[0])
    } else {
      setFormKind('polygon')
      if (area.polygon_points && area.polygon_points.length >= 3) {
        setPolygonPoints(area.polygon_points)
      } else if (area.lat != null && area.lng != null) {
        setPolygonPoints(makeDefaultQuad({ lat: area.lat, lng: area.lng }))
      } else {
        setPolygonPoints([])
      }
    }
    setError(null)
    setIsFormOpen(true)
  }

  function cancelForm() {
    setIsFormOpen(false)
    setEditingArea(null)
    setError(null)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      if (formKind === 'polygon') {
        if (polygonPoints.length < 3 || polygonPoints.length > 4) {
          throw new Error('Obszar musi posiadać 3 lub 4 wierzchołki (maksymalnie czworokąt).')
        }
      }

      if (editingArea) {
        if (formKind === 'polygon') {
          await updatePolygonArea(editingArea.id, user.id, areaName, polygonPoints)
        } else {
          await updateDistrictArea(editingArea.id, user.id, district)
        }
        setSuccessMessage(
          `Zaktualizowano okolicę: ${formKind === 'polygon' ? areaName : district}`,
        )
        setJustUpdatedId(editingArea.id)
      } else {
        if (formKind === 'polygon') {
          await createPolygonArea(user.id, areaName, polygonPoints)
        } else {
          await createDistrictArea(user.id, district)
        }
        setSuccessMessage(
          `Dodano nową okolicę: ${formKind === 'polygon' ? areaName : district}`,
        )
      }
      await refresh()
      setIsFormOpen(false)
      setEditingArea(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  const areas = query.data ?? []

  // Check if multiple polygon areas exist and calculate merged union
  const polygonAreas = useMemo(
    () =>
      areas.filter(
        (a) =>
          (a.kind === 'polygon' && a.polygon_points && a.polygon_points.length >= 3) ||
          (a.polygon_points && a.polygon_points.length >= 3),
      ),
    [areas],
  )

  const mergedPolygons = useMemo(
    () => mergePolygonAreas(polygonAreas.map((a) => a.polygon_points!)),
    [polygonAreas],
  )

  const hasMergedIntersection =
    polygonAreas.length > 1 && mergedPolygons.length < polygonAreas.length

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6 overflow-y-auto">
      {/* Screen header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="m-0 text-lg font-semibold flex items-center gap-2">
          <MapPinned size={20} aria-hidden /> Moje okolice
        </h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={startAdding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-action)' }}
          >
            <Plus size={15} /> Dodaj okolicę
          </button>
        )}
      </div>

      <p className="mt-0 mb-4 text-xs text-[var(--color-text)]/65">
        Obszary wielokątne (maksymalnie czworokąty) lub całe dzielnice. Przecinające się okolice
        automatycznie łączą się w jeden wspólny obszar na mapie. Na mapie włącz „Grunty gminne”,
        żeby zobaczyć granatowe działki Gminy Kraków (MSIP, poglądowo).
      </p>

      {/* Success notification banner */}
      {successMessage && (
        <div
          role="status"
          className="mb-4 p-3 rounded-[var(--radius-card)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-2 shadow-xs transition-all"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700/60 hover:text-emerald-900 border-0 bg-transparent cursor-pointer p-1"
            aria-label="Zamknij komunikat"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Error notification banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-[var(--radius-card)] bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-2 shadow-xs transition-all"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700/60 hover:text-rose-900 border-0 bg-transparent cursor-pointer p-1"
            aria-label="Zamknij błąd"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Merged Areas Banner */}
      {polygonAreas.length > 1 && (
        <div
          className={`mb-4 p-3 rounded-[var(--radius-card)] border flex items-center gap-3 text-xs shadow-xs transition-all ${
            hasMergedIntersection
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}
        >
          <Layers size={18} className={hasMergedIntersection ? 'text-emerald-600 shrink-0' : 'text-blue-600 shrink-0'} />
          <div>
            <span className="font-semibold block">
              {hasMergedIntersection
                ? 'Połączone okolice (Merged) ✨'
                : 'Zasada łączenia okolic'}
            </span>
            <span className="opacity-80">
              {hasMergedIntersection
                ? `Przecinające się wielokąty (${polygonAreas.length}) tworzą na mapie ${
                    mergedPolygons.length === 1 ? '1 dużą wspólną strefę' : `${mergedPolygons.length} połączone strefy`
                  }.`
                : `${polygonAreas.length} zapisane okolice są obecnie rozłączne. Jeśli ich granice przetną się, połączą się w 1 obszar.`}
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {isFormOpen && (
        <section
          aria-label={editingArea ? 'Edycja okolicy' : 'Nowa okolica'}
          className="rounded-[var(--radius-card)] bg-white p-4 sm:p-5 border border-black/10 shadow-sm mb-6 space-y-4 transition-all"
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <div className="flex items-center gap-2">
              {editingArea ? (
                <Pencil size={16} className="text-[var(--color-action)]" />
              ) : (
                <Plus size={16} className="text-[var(--color-action)]" />
              )}
              <h3 className="m-0 text-sm font-semibold text-[var(--color-text)]">
                {editingArea ? `Edycja okolicy: ${editingArea.name}` : 'Nowa okolica'}
              </h3>
            </div>
            <button
              type="button"
              onClick={cancelForm}
              className="p-1 rounded-md text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5 border-0 bg-transparent cursor-pointer transition-colors"
              aria-label="Zamknij formularz"
              title="Zamknij formularz"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Kind tabs */}
          <div className="flex p-0.5 rounded-lg bg-black/5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFormKind('polygon')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
                formKind === 'polygon'
                  ? 'bg-white text-[var(--color-text)] shadow-xs font-semibold'
                  : 'bg-transparent text-[var(--color-text)]/70 hover:text-[var(--color-text)]'
              }`}
            >
              <Shapes size={14} /> Wielokąt (maks. 4 wierzchołki)
            </button>
            <button
              type="button"
              onClick={() => setFormKind('district')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
                formKind === 'district'
                  ? 'bg-white text-[var(--color-text)] shadow-xs font-semibold'
                  : 'bg-transparent text-[var(--color-text)]/70 hover:text-[var(--color-text)]'
              }`}
            >
              <Building2 size={14} /> Cała dzielnica
            </button>
          </div>

          {/* Fields for Polygon */}
          {formKind === 'polygon' && (
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Nazwa okolicy
                <input
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="np. Mój rewir, Okolica biura, Park"
                  className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 text-sm"
                />
              </label>

              <div>
                <PolygonPicker
                  points={polygonPoints}
                  onChange={setPolygonPoints}
                  onGetGps={handleGps}
                  locating={locating}
                  accentColor="#176B4B"
                  label="Wyznacz wierzchołki na mapie"
                  hint="Klikaj na mapie, aby ustawić do 4 wierzchołków. Min. 3 dla trójkąta, max. 4 dla czworokąta."
                />
              </div>
            </div>
          )}

          {/* Fields for District */}
          {formKind === 'district' && (
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Wybierz dzielnicę
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 text-sm bg-white"
                >
                  {KRAKOW_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* Form action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              className="min-h-10 px-4 rounded-[var(--radius-card)] border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold cursor-pointer text-[var(--color-text)] transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (formKind === 'polygon' && polygonPoints.length < 3)}
              className="min-h-10 px-5 rounded-[var(--radius-card)] border-0 text-white text-xs font-semibold cursor-pointer transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              style={{ background: 'var(--color-action)' }}
            >
              {saving
                ? 'Zapisywanie…'
                : editingArea
                  ? 'Zapisz zmiany'
                  : 'Zapisz okolicę'}
            </button>
          </div>
        </section>
      )}

      {/* Areas List Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="m-0 text-sm font-semibold text-[var(--color-text)]">
          Twoje zapisane okolice ({areas.length})
        </h3>
      </div>

      {/* Empty State */}
      {areas.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-[var(--radius-card)] bg-white border border-dashed border-black/15 shadow-xs">
          <Shapes size={32} className="mx-auto text-[var(--color-text)]/30 mb-2" />
          <p className="m-0 font-medium text-sm text-[var(--color-text)]">
            Brak zapisanych okolic
          </p>
          <p className="mt-1 mb-4 text-xs text-[var(--color-text)]/60 max-w-sm mx-auto">
            Wyznacz na mapie wielokąty (maksymalnie czworokąty) lub całe dzielnice, aby filtrować
            pomysły i usterki.
          </p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={startAdding}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white cursor-pointer shadow-xs hover:opacity-90"
              style={{ background: 'var(--color-action)' }}
            >
              <Plus size={15} /> Dodaj pierwszą okolicę
            </button>
          )}
        </div>
      ) : (
        <ul className="m-0 p-0 list-none space-y-2">
          {areas.map((area) => {
            const isPolygon =
              area.kind === 'polygon' ||
              Boolean(area.polygon_points && area.polygon_points.length >= 3)
            const vertexCount = area.polygon_points?.length ?? (area.kind === 'radius' ? 4 : 0)

            return (
              <li
                key={area.id}
                className={`flex items-center justify-between gap-3 border rounded-[var(--radius-card)] bg-white px-4 py-3 transition-all ${
                  editingArea?.id === area.id
                    ? 'border-[var(--color-action)] ring-2 ring-[var(--color-action)]/20 shadow-xs'
                    : justUpdatedId === area.id
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-black/5 hover:border-black/10'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="mt-0.5 p-2 rounded-lg shrink-0"
                    style={{
                      background:
                        area.kind === 'district'
                          ? 'var(--color-ideas)/10'
                          : 'var(--color-action)/10',
                      color:
                        area.kind === 'district'
                          ? 'var(--color-ideas)'
                          : 'var(--color-action)',
                    }}
                  >
                    {area.kind === 'district' ? (
                      <Building2 size={16} />
                    ) : (
                      <Shapes size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 font-medium text-sm text-[var(--color-text)] truncate">
                      {area.name}
                    </p>
                    <p className="m-0 text-xs text-[var(--color-text)]/60 truncate">
                      {area.kind === 'district'
                        ? `Dzielnica: ${area.district_code}`
                        : isPolygon
                          ? `Wielokąt · ${vertexCount} ${vertexCount === 4 ? 'wierzchołki (czworokąt)' : 'wierzchołki'}`
                          : `Okolica punktowa · ${area.lat?.toFixed(4)}, ${area.lng?.toFixed(4)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Edytuj okolicę"
                    title="Edytuj okolicę"
                    onClick={() => startEditing(area)}
                    className="p-2 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-[var(--color-text)]/75 hover:text-[var(--color-text)] cursor-pointer transition-colors inline-flex items-center gap-1 text-xs"
                  >
                    <Pencil size={15} />
                    <span className="hidden sm:inline font-medium">Edytuj</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Usuń okolicę"
                    title="Usuń okolicę"
                    onClick={async () => {
                      if (editingArea?.id === area.id) {
                        cancelForm()
                      }
                      await deleteInterestArea(area.id, user.id)
                      setSuccessMessage(`Usunięto okolicę: ${area.name}`)
                      await refresh()
                    }}
                    className="p-2 rounded-lg border border-black/10 bg-white hover:bg-rose-50 text-[var(--color-text)]/75 hover:text-rose-600 hover:border-rose-200 cursor-pointer transition-colors inline-flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
