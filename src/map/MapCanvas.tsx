import { Circle, CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  KRAKOW_CENTER,
  KRAKOW_DEFAULT_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from './krakow'

export type MapMarker = {
  id: string
  lat: number
  lng: number
  kind: 'idea' | 'fault'
  label: string
  highlight?: boolean
}

export type MapCircle = {
  id: string
  lat: number
  lng: number
  radiusM: number
}

type MapCanvasProps = {
  className?: string
  markers?: MapMarker[]
  circles?: MapCircle[]
  onMapClick?: (point: { lat: number; lng: number }) => void
  onMarkerClick?: (marker: MapMarker) => void
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: (point: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(event) {
      onMapClick?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

export function MapCanvas({
  className,
  markers = [],
  circles = [],
  onMapClick,
  onMarkerClick,
}: MapCanvasProps) {
  return (
    <MapContainer
      center={[KRAKOW_CENTER.lat, KRAKOW_CENTER.lng]}
      zoom={KRAKOW_DEFAULT_ZOOM}
      className={className}
      scrollWheelZoom
      aria-label="Mapa Krakowa"
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
      <ClickHandler onMapClick={onMapClick} />
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
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lng]}
          radius={marker.highlight ? 12 : 9}
          pathOptions={{
            color: marker.kind === 'idea' ? '#176B4B' : '#C45C26',
            fillColor: marker.kind === 'idea' ? '#176B4B' : '#C45C26',
            fillOpacity: 0.85,
            weight: marker.highlight ? 3 : 2,
          }}
          eventHandlers={{
            click: (event) => {
              event.originalEvent.stopPropagation()
              onMarkerClick?.(marker)
            },
          }}
        />
      ))}
    </MapContainer>
  )
}
