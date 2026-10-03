import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
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
  RotateCcw,
  Sparkles,
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

function MapClickHandler({
  points,
  onAddPoint,
}: {
  points: LatLngPoint[]
  onAddPoint: (point: LatLngPoint) => void
}) {
  useMapEvents({
    click(event) {
      if (points.length >= 4) {
        return
      }
      onAddPoint({
        lat: Number(event.latlng.lat.toFixed(5)),
        lng: Number(event.latlng.lng.toFixed(5)),
      })
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
  hint = 'Klikaj na mapie, aby wyznaczyć do 4 wierzchołków wielokąta (maksymalnie czworokąt).',
}: PolygonPickerProps) {
  const [mounted, setMounted] = useState(false)

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

  function handleUndo() {
    if (points.length === 0) return
    onChange(points.slice(0, -1))
  }

  function handleReset() {
    onChange([])
  }

  function handleDefaultQuad() {
    // Quick helper to generate a default 4-point rectangle centered around the map center
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
                isComplete ? 'bg-emerald-500' : 'animate-pulse'
              }`}
              style={{ backgroundColor: isComplete ? undefined : accentColor }}
            />
            {points.length === 0 && 'Kliknij na mapie, aby postawić 1. wierzchołek'}
            {points.length === 1 && 'Postaw 2. wierzchołek'}
            {points.length === 2 && 'Postaw 3. wierzchołek, aby domknąć trójkąt'}
            {points.length === 3 && 'Możesz dodać 4. wierzchołek dla czworokąta'}
            {points.length === 4 && 'Osiągnięto limit: 4 wierzchołki (czworokąt)'}
          </div>
        </div>

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
            <MapClickHandler points={points} onAddPoint={handleAddPoint} />
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

            {/* Render each placed vertex marker */}
            {points.map((p, idx) => (
              <CircleMarker
                key={`vertex-${idx}-${p.lat}-${p.lng}`}
                center={[p.lat, p.lng]}
                radius={8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: accentColor,
                  fillOpacity: 1,
                  weight: 2.5,
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -6]}>
                  <span className="text-[10px] font-bold">W{idx + 1}</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-[var(--color-text)]/50">
            Wczytywanie mapy…
          </div>
        )}
      </div>

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
