import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
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
}

type MapCanvasProps = {
  className?: string
  markers?: MapMarker[]
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
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lng]}
          radius={9}
          pathOptions={{
            color: marker.kind === 'idea' ? '#176B4B' : '#C45C26',
            fillColor: marker.kind === 'idea' ? '#176B4B' : '#C45C26',
            fillOpacity: 0.85,
            weight: 2,
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
