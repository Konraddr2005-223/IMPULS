import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  KRAKOW_CENTER,
  KRAKOW_DEFAULT_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from './krakow'

type MapCanvasProps = {
  className?: string
}

export function MapCanvas({ className }: MapCanvasProps) {
  return (
    <MapContainer
      center={[KRAKOW_CENTER.lat, KRAKOW_CENTER.lng]}
      zoom={KRAKOW_DEFAULT_ZOOM}
      className={className}
      scrollWheelZoom
      aria-label="Mapa Krakowa"
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
    </MapContainer>
  )
}
