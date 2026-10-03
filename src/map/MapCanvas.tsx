import { Fragment, useRef } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  WMSTileLayer,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  KRAKOW_CENTER,
  KRAKOW_DEFAULT_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from './krakow'
import { wmsSources } from '../city/krakow/config'

export type MapMarker = {
  id: string
  lat: number
  lng: number
  kind: 'idea' | 'fault'
  label: string
  sublabel?: string
  highlight?: boolean
  selected?: boolean
}

export type MapCircle = {
  id: string
  lat: number
  lng: number
  radiusM: number
}

export type WmsLayerId = 'none' | 'mpzp' | 'ownership'

type MapCanvasProps = {
  className?: string
  markers?: MapMarker[]
  circles?: MapCircle[]
  draftPoint?: { lat: number; lng: number } | null
  wmsLayer?: WmsLayerId
  onMapClick?: (point: { lat: number; lng: number }) => void
  onMarkerClick?: (marker: MapMarker) => void
}

export const PROXIMITY_THRESHOLD_PX = 32

export function findClosestMarker(
  clickPoint: { x: number; y: number },
  markers: MapMarker[],
  project: (coords: { lat: number; lng: number }) => { x: number; y: number },
  thresholdPx: number = PROXIMITY_THRESHOLD_PX,
): MapMarker | null {
  let closestMarker: MapMarker | null = null
  let minDistance = Infinity

  for (const marker of markers) {
    const markerPoint = project({ lat: marker.lat, lng: marker.lng })
    const dist = Math.hypot(markerPoint.x - clickPoint.x, markerPoint.y - clickPoint.y)
    if (dist < minDistance) {
      minDistance = dist
      closestMarker = marker
    }
  }

  if (closestMarker && minDistance <= thresholdPx) {
    return closestMarker
  }
  return null
}

function ClickHandler({
  markers = [],
  onMapClick,
  onMarkerClick,
  lastMarkerClickTimeRef,
}: {
  markers?: MapMarker[]
  onMapClick?: (point: { lat: number; lng: number }) => void
  onMarkerClick?: (marker: MapMarker) => void
  lastMarkerClickTimeRef: React.MutableRefObject<number>
}) {
  const map = useMapEvents({
    click(event) {
      if (Date.now() - lastMarkerClickTimeRef.current < 200) {
        return
      }

      if (markers.length > 0 && onMarkerClick) {
        const clickPoint =
          event.containerPoint ??
          (event.latlng ? map.latLngToContainerPoint(event.latlng) : null)

        if (clickPoint) {
          const closest = findClosestMarker(
            clickPoint,
            markers,
            (coords) => map.latLngToContainerPoint([coords.lat, coords.lng]),
            PROXIMITY_THRESHOLD_PX,
          )

          if (closest) {
            lastMarkerClickTimeRef.current = Date.now()
            onMarkerClick(closest)
            return
          }
        }
      }

      onMapClick?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

const wmsConfigs = {
  ownership: wmsSources.find((s) => s.id === 'ownership'),
  mpzp: wmsSources.find((s) => s.id === 'mpzp'),
}

export function MapCanvas({
  className,
  markers = [],
  circles = [],
  draftPoint,
  wmsLayer = 'none',
  onMapClick,
  onMarkerClick,
}: MapCanvasProps) {
  const lastMarkerClickTimeRef = useRef(0)

  return (
    <MapContainer
      center={[KRAKOW_CENTER.lat, KRAKOW_CENTER.lng]}
      zoom={KRAKOW_DEFAULT_ZOOM}
      className={className}
      scrollWheelZoom
      aria-label="Mapa Krakowa"
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />

      {wmsLayer === 'mpzp' && wmsConfigs.mpzp && (
        <WMSTileLayer
          url={wmsConfigs.mpzp.url}
          layers={wmsConfigs.mpzp.layers}
          format="image/png"
          transparent
          opacity={0.65}
          attribution="&copy; MSIP Kraków — Plany Zagospodarowania (MPZP)"
        />
      )}

      {wmsLayer === 'ownership' && wmsConfigs.ownership && (
        <WMSTileLayer
          url={wmsConfigs.ownership.url}
          layers={wmsConfigs.ownership.layers}
          format="image/png"
          transparent
          opacity={0.65}
          attribution="&copy; MSIP Kraków — Struktura Własności"
        />
      )}

      <ClickHandler
        markers={markers}
        onMapClick={onMapClick}
        onMarkerClick={onMarkerClick}
        lastMarkerClickTimeRef={lastMarkerClickTimeRef}
      />

      {draftPoint && (
        <>
          <CircleMarker
            center={[draftPoint.lat, draftPoint.lng]}
            radius={14}
            pathOptions={{
              color: '#2457D6',
              fillColor: '#2457D6',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '4, 4',
            }}
          />
          <CircleMarker
            center={[draftPoint.lat, draftPoint.lng]}
            radius={6}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#2457D6',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              <span className="text-xs font-semibold">Wybrany punkt</span>
            </Tooltip>
          </CircleMarker>
        </>
      )}

      {circles.map((c) => (
        <Circle
          key={c.id}
          center={[c.lat, c.lng]}
          radius={c.radiusM}
          pathOptions={{
            color: '#2457D6',
            fillColor: '#2457D6',
            fillOpacity: 0.08,
            weight: 1,
          }}
        />
      ))}

      {markers.map((marker) => {
        const isIdea = marker.kind === 'idea'
        const color = isIdea ? '#176B4B' : '#C45C26'
        const radius = marker.selected ? 13 : marker.highlight ? 12 : 9

        return (
          <Fragment key={marker.id}>
            {marker.selected && (
              <CircleMarker
                center={[marker.lat, marker.lng]}
                radius={20}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '3, 3',
                }}
              />
            )}
            <CircleMarker
              center={[marker.lat, marker.lng]}
              radius={radius}
              pathOptions={{
                color: marker.selected ? '#ffffff' : marker.highlight ? '#FBBF24' : color,
                fillColor: color,
                fillOpacity: 0.95,
                weight: marker.selected ? 3 : marker.highlight ? 3 : 2,
              }}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent?.stopPropagation?.()
                  lastMarkerClickTimeRef.current = Date.now()
                  onMarkerClick?.(marker)
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="text-xs">
                  <p className="m-0 font-semibold">{marker.label}</p>
                  {marker.sublabel && (
                    <p className="m-0 text-[10px] opacity-75">{marker.sublabel}</p>
                  )}
                  {marker.highlight && (
                    <span className="text-[10px] text-amber-600 font-bold">★ Wyróżniony w okolicy</span>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          </Fragment>
        )
      })}
    </MapContainer>
  )
}

