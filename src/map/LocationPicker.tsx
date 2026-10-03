import { useEffect, useState } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, MapPin, Maximize2, Sliders } from 'lucide-react'
import { KRAKOW_CENTER, OSM_ATTRIBUTION, OSM_TILE_URL } from './krakow'

export type LocationPickerProps = {
  value: { lat: number; lng: number }
  onChange: (point: { lat: number; lng: number }) => void
  radiusM?: number
  onRadiusChange?: (radius: number) => void
  minRadius?: number
  maxRadius?: number
  onGetGps?: () => void
  locating?: boolean
  onPickOnMainMap?: () => void
  accentColor?: string
  label?: string
  hint?: string
}

function MapClickHandler({
  onPointChange,
}: {
  onPointChange: (point: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(event) {
      onPointChange({
        lat: Number(event.latlng.lat.toFixed(5)),
        lng: Number(event.latlng.lng.toFixed(5)),
      })
    },
  })
  return null
}

function MapCenterSync({ center }: { center: { lat: number; lng: number } }) {
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

export function LocationPicker({
  value,
  onChange,
  radiusM,
  onRadiusChange,
  minRadius = 50,
  maxRadius = 2000,
  onGetGps,
  locating = false,
  onPickOnMainMap,
  accentColor = '#176B4B',
  label = 'Wskaż miejsce na mapie',
  hint = 'Kliknij na mapie, aby ustawić punkt.',
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLat = value?.lat ?? KRAKOW_CENTER.lat
  const currentLng = value?.lng ?? KRAKOW_CENTER.lng

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">
            <MapPin size={16} style={{ color: accentColor }} />
            {label}
          </span>
          {hint && <p className="m-0 text-[11px] text-[var(--color-text)]/65">{hint}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onPickOnMainMap && (
            <button
              type="button"
              onClick={onPickOnMainMap}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-black/10 bg-white hover:bg-black/5 cursor-pointer text-[var(--color-text)]/80 font-medium transition-colors"
              title="Wskaż punkt na pełnoekranowej mapie"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline">Duża mapa</span>
            </button>
          )}

          {onGetGps && (
            <button
              type="button"
              disabled={locating}
              onClick={onGetGps}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-black/10 bg-[var(--color-bg)] hover:bg-black/5 cursor-pointer text-[var(--color-action)] font-medium transition-colors disabled:opacity-50"
            >
              <LocateFixed size={13} className={locating ? 'animate-spin' : ''} />
              {locating ? 'Pobieranie GPS…' : 'Użyj GPS'}
            </button>
          )}
        </div>
      </div>

      <div
        className="relative w-full h-64 rounded-[var(--radius-card)] overflow-hidden border border-black/15 shadow-inner bg-[#f2efe9]"
        style={{ touchAction: 'none' }}
      >
        {/* Floating guidance banner */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-1000 pointer-events-none">
          <div className="mx-auto max-w-fit px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-medium text-[var(--color-text)] shadow-md border border-black/10 flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            Kliknij na mapie, aby wskazać dokładne miejsce
          </div>
        </div>

        {mounted ? (
          <MapContainer
            center={[currentLat, currentLng]}
            zoom={14}
            className="h-full w-full z-0"
            scrollWheelZoom={true}
            aria-label="Interaktywna mapa wyboru lokalizacji"
          >
            <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
            <MapClickHandler onPointChange={onChange} />
            <MapCenterSync center={{ lat: currentLat, lng: currentLng }} />
            <MapInvalidateSize />

            {/* Radius circle around selected point (e.g. for interest areas) */}
            {radiusM != null && radiusM > 0 && (
              <Circle
                center={[currentLat, currentLng]}
                radius={radiusM}
                pathOptions={{
                  color: accentColor,
                  fillColor: accentColor,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '4, 4',
                }}
              />
            )}

            {/* Marker representing the selected pin */}
            <CircleMarker
              center={[currentLat, currentLng]}
              radius={18}
              pathOptions={{
                color: accentColor,
                fillColor: accentColor,
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '3, 4',
              }}
            />
            <CircleMarker
              center={[currentLat, currentLng]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                fillColor: accentColor,
                fillOpacity: 1,
                weight: 2.5,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <span className="text-[11px] font-semibold">
                  {radiusM != null && radiusM > 0 ? 'Środek okolicy' : 'Wybrane miejsce'}
                </span>
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-[var(--color-text)]/50">
            Wczytywanie mapy…
          </div>
        )}

        {/* Floating bottom coords indicator */}
        <div className="absolute bottom-2 left-2 z-1000 pointer-events-none">
          <div className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-[11px] font-mono text-[var(--color-text)]/80 shadow-xs border border-black/10 flex items-center gap-1.5">
            <span className="font-sans font-medium text-[var(--color-text)]">Wybrano:</span>
            <span>
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </span>
            {radiusM != null && radiusM > 0 && (
              <span className="text-[var(--color-text)]/70 font-sans">
                · {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(2)} km` : `${radiusM} m`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Radius slider control when picking an area */}
      {radiusM != null && onRadiusChange != null && (
        <div className="p-3 bg-[var(--color-bg)] rounded-[var(--radius-card)] border border-black/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label
              htmlFor="radius-slider"
              className="flex items-center gap-1.5 text-[var(--color-text)] cursor-pointer"
            >
              <Sliders size={14} style={{ color: accentColor }} />
              Promień obszaru:
            </label>
            <span className="font-mono text-sm font-semibold" style={{ color: accentColor }}>
              {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(2)} km` : `${radiusM} m`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--color-text)]/60 font-mono">{minRadius} m</span>
            <input
              id="radius-slider"
              type="range"
              min={minRadius}
              max={maxRadius}
              step={25}
              value={radiusM}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="flex-1 accent-[var(--color-action)] cursor-pointer h-2 bg-black/10 rounded-lg"
              aria-label="Promień obszaru"
            />
            <span className="text-[11px] text-[var(--color-text)]/60 font-mono">
              {maxRadius >= 1000 ? `${(maxRadius / 1000).toFixed(1)} km` : `${maxRadius} m`}
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-[var(--color-text)]/65 mr-1">Szybki wybór:</span>
            {[100, 250, 500, 1000, 1500, 2000]
              .filter((preset) => preset >= minRadius && preset <= maxRadius)
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onRadiusChange(preset)}
                  className={`px-2 py-0.5 text-xs rounded-md border transition-colors cursor-pointer ${
                    radiusM === preset
                      ? 'bg-[var(--color-action)] text-white border-transparent font-medium shadow-xs'
                      : 'bg-white border-black/10 text-[var(--color-text)]/80 hover:bg-black/5'
                  }`}
                >
                  {preset >= 1000 ? `${preset / 1000} km` : `${preset} m`}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
