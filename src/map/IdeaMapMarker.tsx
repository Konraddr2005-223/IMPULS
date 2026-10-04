import { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import {
  IDEA_ICON_SVG_PATHS,
  type IdeaIconKind,
} from '../ideas/ideaVisuals'
import type { MapMarker } from './MapCanvas'

function buildIdeaDivIcon(
  kind: IdeaIconKind,
  selected?: boolean,
  highlight?: boolean,
): L.DivIcon {
  const paths = IDEA_ICON_SVG_PATHS[kind] ?? IDEA_ICON_SVG_PATHS.default
  const classes = [
    'idea-map-pin',
    `idea-map-pin--${kind}`,
    selected ? 'is-selected' : '',
    highlight ? 'is-highlight' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return L.divIcon({
    className: 'idea-map-pin-wrap',
    html: `<div class="${classes}" aria-hidden="true"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${paths}</svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -22],
  })
}

type IdeaMapMarkerProps = {
  marker: MapMarker
  onClick: (marker: MapMarker) => void
}

/** Yellow civic pin with category glyph (tree, dog, bike…). */
export function IdeaMapMarker({ marker, onClick }: IdeaMapMarkerProps) {
  const kind = (marker.iconKind ?? 'default') as IdeaIconKind
  const icon = useMemo(
    () => buildIdeaDivIcon(kind, marker.selected, marker.highlight),
    [kind, marker.selected, marker.highlight],
  )

  return (
    <Marker
      position={[marker.lat, marker.lng]}
      icon={icon}
      eventHandlers={{
        click: (event) => {
          event.originalEvent?.stopPropagation?.()
          onClick(marker)
        },
      }}
      zIndexOffset={marker.selected ? 1000 : marker.highlight ? 500 : 0}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        <div className="text-xs">
          <p className="m-0 font-semibold">{marker.label}</p>
          {marker.sublabel && (
            <p className="m-0 text-[10px] opacity-75">{marker.sublabel}</p>
          )}
          {marker.highlight && (
            <span className="text-[10px] text-amber-700 font-bold">
              ★ Wyróżniony w okolicy
            </span>
          )}
        </div>
      </Tooltip>
    </Marker>
  )
}
