import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertCircle,
  CheckCircle2,
  LocateFixed,
  Move,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
import {
  calculateCentroid,
  sortPointsClockwise,
  type LatLngPoint,
} from '../areas/polygon'
import { KRAKOW_CENTER, OSM_ATTRIBUTION, OSM_TILE_URL } from './krakow'

export type PolygonPickerProps = {
  points: LatLngPoint[]
  onChange: (points: LatLngPoint[]) => void
  onGetGps?: () => void
  locating?: boolean
  accentColor?: string
  label?: string
  hint?: string
}

function getVertexIcon(index: number, isSelected: boolean, accentColor: string) {
  const bg = isSelected ? '#D97706' : accentColor
  const size = isSelected ? 28 : 24
  const half = size / 2
  return L.divIcon({
    className: 'polygon-vertex-icon',
    html: `<div class="polygon-vertex-pin" style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background-color: ${bg};
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-${half}px, -${half}px);
    ">W${index + 1}</div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
  })
}

function MapClickHandler({
  points,
  selectedIdx,
  onAddPoint,
  onMovePoint,
}: {
  points: LatLngPoint[]
  selectedIdx: number | null
  onAddPoint: (point: LatLngPoint) => void
  onMovePoint: (index: number, point: LatLngPoint) => void
}) {
  useMapEvents({
    click(event) {
      const clickPoint = {
        lat: Number(event.latlng.lat.toFixed(5)),
        lng: Number(event.latlng.lng.toFixed(5)),
      }

      // If a vertex is currently selected, clicking anywhere moves that vertex!
      if (selectedIdx != null && selectedIdx >= 0 && selectedIdx < points.length) {
        onMovePoint(selectedIdx, clickPoint)
        return
      }

      // Otherwise add a new point if under 4
      if (points.length < 4) {
        onAddPoint(clickPoint)
      }
    },
  })
  return null
}

function MapCenterSync({ center }: { center: LatLngPoint }) {
  const map = useMap()
  useEffect(() => {
    if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.panTo([center.lat, center.lng], { animate: true })
    }
  }, [center.lat, center.lng, map])
  return null
}

function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export function PolygonPicker({
  points,
  onChange,
  onGetGps,
  locating = false,
  accentColor = '#176B4B',
  label = 'Wskaż wierzchołki okolicy na mapie',
  hint = 'Klikaj na mapie, aby wyznaczyć wierzchołki (maks. 4). Możesz przeciągać postawione punkty w dowolnej chwili.',
}: PolygonPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const centroid = useMemo(() => {
    if (points.length > 0) return calculateCentroid(points)
    return KRAKOW_CENTER
  }, [points])

  const sortedPoints = useMemo(() => {
    if (points.length < 3) return points
    return sortPointsClockwise(points)
  }, [points])

  function handleAddPoint(point: LatLngPoint) {
    if (points.length >= 4) return
    onChange([...points, point])
  }

  function handleMovePoint(index: number, point: LatLngPoint) {
    const next = [...points]
    next[index] = point
    onChange(next)
  }

  function handleDeletePoint(index: number) {
    const next = points.filter((_, i) => i !== index)
    onChange(next)
    if (selectedIdx === index) {
      setSelectedIdx(null)
    } else if (selectedIdx != null && selectedIdx > index) {
      setSelectedIdx(selectedIdx - 1)
    }
  }

  function handleUndo() {
    if (points.length === 0) return
    if (selectedIdx === points.length - 1) {
      setSelectedIdx(null)
    }
    onChange(points.slice(0, -1))
  }

  function handleReset() {
    setSelectedIdx(null)
    onChange([])
  }

  function handleDefaultQuad() {
    const center = centroid
    const deltaLat = 0.0025
    const deltaLng = 0.004
    onChange([
      { lat: Number((center.lat + deltaLat).toFixed(5)), lng: Number((center.lng - deltaLng).toFixed(5)) },
      { lat: Number((center.lat + deltaLat).toFixed(5)), lng: Number((center.lng + deltaLng).toFixed(5)) },
      { lat: Number((center.lat - deltaLat).toFixed(5)), lng: Number((center.lng + deltaLng).toFixed(5)) },
      { lat: Number((center.lat - deltaLat).toFixed(5)), lng: Number((center.lng - deltaLng).toFixed(5)) },
    ])
  }

  const isComplete = points.length === 4
  const isValidPolygon = points.length >= 3

  return (
    <div className="space-y-2">
      {/* Header controls & status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: accentColor }}
            />
            {label}
          </span>
          {hint && <p className="m-0 text-[11px] text-[var(--color-text)]/65">{hint}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          {onGetGps && (
            <button
              type="button"
              disabled={locating}
              onClick={onGetGps}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-black/10 bg-[var(--color-bg)] hover:bg-black/5 cursor-pointer text-[var(--color-action)] font-medium transition-colors disabled:opacity-50"
            >
              <LocateFixed size={13} className={locating ? 'animate-spin' : ''} />
              {locating ? 'Pobieranie…' : 'GPS'}
            </button>
          )}

          <button
            type="button"
            disabled={points.length === 0}
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-black/10 bg-white hover:bg-black/5 cursor-pointer text-[var(--color-text)]/80 font-medium transition-colors disabled:opacity-40"
            title="Cofnij ostatni wierzchołek"
          >
            <Undo2 size={13} />
            <span className="hidden sm:inline">Cofnij</span>
          </button>

          <button
            type="button"
            disabled={points.length === 0}
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-black/10 bg-white hover:bg-black/5 cursor-pointer text-[var(--color-text)]/80 font-medium transition-colors disabled:opacity-40"
            title="Wyczyść wszystkie wierzchołki"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Wyczyść</span>
          </button>
        </div>
      </div>

      {/* Map container */}
      <div
        className="relative w-full h-72 rounded-[var(--radius-card)] overflow-hidden border border-black/15 shadow-inner bg-[#f2efe9]"
        style={{ touchAction: 'none' }}
      >
        {/* Floating guidance banner */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-1000 pointer-events-none">
          <div className="mx-auto max-w-fit px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-medium text-[var(--color-text)] shadow-md border border-black/10 flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                selectedIdx != null
                  ? 'bg-amber-500 animate-ping'
                  : isComplete
                    ? 'bg-emerald-500'
                    : 'animate-pulse'
              }`}
              style={{
                backgroundColor:
                  selectedIdx != null ? '#D97706' : isComplete ? undefined : accentColor,
              }}
            />
            {selectedIdx != null
              ? `Przesuwasz wierzchołek W${selectedIdx + 1} — przeciągnij go lub kliknij w nowe miejsce`
              : points.length === 0
                ? 'Kliknij na mapie, aby postawić 1. wierzchołek'
                : points.length === 1
                  ? 'Postaw 2. wierzchołek (możesz też przeciągać W1)'
                  : points.length === 2
                    ? 'Postaw 3. wierzchołek, aby domknąć trójkąt'
                    : points.length === 3
                      ? 'Możesz dodać 4. wierzchołek lub przeciągać istniejące'
                      : 'Czworokąt gotowy — przeciągaj wierzchołki W1–W4, aby zmienić kształt'}
          </div>
        </div>

        {/* Selected vertex action badge */}
        {selectedIdx != null && (
          <div className="absolute top-11 left-2.5 right-2.5 z-1000 flex items-center justify-center pointer-events-auto">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold shadow-lg flex items-center gap-2 border border-amber-600/30">
              <Move size={14} />
              <span>Przesuwanie W{selectedIdx + 1}</span>
              <button
                type="button"
                onClick={() => setSelectedIdx(null)}
                className="px-2 py-0.5 rounded-md bg-white/25 hover:bg-white/40 text-white text-[11px] font-bold border-0 cursor-pointer transition-colors"
              >
                Gotowe
              </button>
              <button
                type="button"
                onClick={() => handleDeletePoint(selectedIdx)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold border-0 cursor-pointer transition-colors"
                title="Usuń ten wierzchołek"
              >
                <Trash2 size={12} />
                Usuń
              </button>
            </div>
          </div>
        )}

        {/* Quick quad generator shortcut floating on bottom-right of map */}
        {points.length === 0 && (
          <div className="absolute bottom-2.5 right-2.5 z-1000">
            <button
              type="button"
              onClick={handleDefaultQuad}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-xs border border-black/10 shadow-md text-[11px] font-semibold text-[var(--color-text)] hover:bg-white cursor-pointer transition-all"
            >
              <Sparkles size={13} className="text-amber-500" />
              Wstaw przykładowy czworokąt
            </button>
          </div>
        )}

        {mounted ? (
          <MapContainer
            center={[centroid.lat, centroid.lng]}
            zoom={14}
            className="h-full w-full z-0"
            scrollWheelZoom={true}
            aria-label="Interaktywna mapa wyboru wielokąta"
          >
            <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
            <MapClickHandler
              points={points}
              selectedIdx={selectedIdx}
              onAddPoint={handleAddPoint}
              onMovePoint={handleMovePoint}
            />
            <MapCenterSync center={centroid} />
            <MapInvalidateSize />

            {/* Connecting lines for 2 points */}
            {points.length === 2 && (
              <Polyline
                positions={points.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: accentColor,
                  weight: 2.5,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Filled Polygon when 3 or 4 points */}
            {isValidPolygon && (
              <Polygon
                positions={sortedPoints.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: accentColor,
                  fillColor: accentColor,
                  fillOpacity: 0.22,
                  weight: 2.5,
                }}
              />
            )}

            {/* Render each placed draggable vertex marker */}
            {points.map((p, idx) => (
              <Marker
                key={`vertex-draggable-${idx}`}
                position={[p.lat, p.lng]}
                draggable={true}
                icon={getVertexIcon(idx, selectedIdx === idx, accentColor)}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent?.stopPropagation?.()
                    setSelectedIdx((prev) => (prev === idx ? null : idx))
                  },
                  dragstart: () => {
                    setSelectedIdx(idx)
                  },
                  drag: (e) => {
                    const latlng = e.target.getLatLng()
                    handleMovePoint(idx, {
                      lat: Number(latlng.lat.toFixed(5)),
                      lng: Number(latlng.lng.toFixed(5)),
                    })
                  },
                  dragend: (e) => {
                    const latlng = e.target.getLatLng()
                    handleMovePoint(idx, {
                      lat: Number(latlng.lat.toFixed(5)),
                      lng: Number(latlng.lng.toFixed(5)),
                    })
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <span className="text-[11px] font-semibold">
                    Wierzchołek {idx + 1} (przeciągnij, aby przesunąć)
                  </span>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-[var(--color-text)]/50">
            Wczytywanie mapy…
          </div>
        )}
      </div>

      {/* Vertex Chips Bar (allows direct selection/moving of each vertex) */}
      {points.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[var(--color-bg)] rounded-[var(--radius-card)] border border-black/10">
          <span className="text-[11px] font-medium text-[var(--color-text)]/70 flex items-center gap-1 mr-1">
            <Move size={12} />
            Wierzchołki:
          </span>
          {points.map((p, idx) => {
            const isSel = selectedIdx === idx
            return (
              <button
                key={`chip-${idx}`}
                type="button"
                onClick={() => setSelectedIdx(isSel ? null : idx)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                  isSel
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-[var(--color-text)] border-black/15 hover:bg-black/5'
                }`}
                title={`Kliknij, aby wybrać wierzchołek W${idx + 1} do przesunięcia`}
              >
                <span>W{idx + 1}</span>
                <span className="text-[10px] font-normal opacity-75">
                  ({p.lat.toFixed(3)}, {p.lng.toFixed(3)})
                </span>
              </button>
            )
          })}
          {selectedIdx != null && (
            <span className="text-[10px] text-amber-600 font-semibold ml-auto">
              Przeciągaj lub kliknij w nowe miejsce
            </span>
          )}
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] rounded-[var(--radius-card)] border border-black/10 text-xs">
        <div className="flex items-center gap-2">
          {isValidPolygon ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
          )}
          <span className="font-medium text-[var(--color-text)]">
            {points.length < 3 ? (
              <>Wybierz jeszcze {3 - points.length} wierzchołek/-ki (min. 3)</>
            ) : points.length === 3 ? (
              <>Utworzono trójkąt (możesz dodać 4. wierzchołek)</>
            ) : (
              <>Czworokąt gotowy (4 / 4 wierzchołki)</>
            )}
          </span>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = points.length >= step
            return (
              <span
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  isFilled ? 'bg-[var(--color-action)] scale-110' : 'bg-black/15'
                }`}
                title={`Wierzchołek ${step}`}
              />
            )
          })}
          <span className="ml-1 text-[11px] font-semibold text-[var(--color-text)]/70">
            {points.length}/4
          </span>
        </div>
      </div>
    </div>
  )
}
