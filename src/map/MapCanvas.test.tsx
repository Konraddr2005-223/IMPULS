import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MapCanvas,
  type MapMarker,
  PROXIMITY_THRESHOLD_PX,
  findClosestMarker,
} from './MapCanvas'

describe('MapCanvas', () => {
  it('renders map with markers and handles marker elements', () => {
    const onMarkerClick = vi.fn()
    const markers: MapMarker[] = [
      {
        id: 'idea-1',
        lat: 50.07,
        lng: 19.91,
        kind: 'idea',
        label: 'Zielony zakątek',
        sublabel: '2/3 poparć',
      },
    ]

    const { container } = render(
      <MapCanvas
        markers={markers}
        onMapClick={vi.fn()}
        onMarkerClick={onMarkerClick}
      />,
    )

    const leafletEl = container.querySelector('.leaflet-container')
    expect(leafletEl).toBeInTheDocument()

    const markerEl = container.querySelector('path.leaflet-interactive')
    expect(markerEl).toBeInTheDocument()
  })

  it('renders halo around selected marker', () => {
    const markers: MapMarker[] = [
      {
        id: 'idea-selected',
        lat: 50.07,
        lng: 19.91,
        kind: 'idea',
        label: 'Wybrany pomysł',
        selected: true,
      },
    ]

    const { container } = render(
      <MapCanvas
        markers={markers}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />,
    )

    // With selected: true, it renders animated pulse rings and center marker (3 CircleMarkers)
    const paths = container.querySelectorAll('path.leaflet-interactive')
    expect(paths.length).toBe(3)
  })

  it('accepts centerPoint and renders without errors', () => {
    const { container } = render(
      <MapCanvas
        centerPoint={{ lat: 50.07, lng: 19.91 }}
        markers={[]}
        onMapClick={vi.fn()}
      />,
    )
    expect(container.querySelector('.leaflet-container')).toBeInTheDocument()
  })

  it('exports PROXIMITY_THRESHOLD_PX constant of at least 28px', () => {
    expect(PROXIMITY_THRESHOLD_PX).toBeGreaterThanOrEqual(28)
  })

  describe('findClosestMarker proximity detection', () => {
    const mockMarkers: MapMarker[] = [
      {
        id: 'marker-1',
        lat: 50.07,
        lng: 19.91,
        kind: 'idea',
        label: 'Marker 1',
      },
      {
        id: 'marker-2',
        lat: 50.08,
        lng: 19.92,
        kind: 'idea',
        label: 'Marker 2',
      },
    ]

    // Projection mock: marker-1 -> (100, 100), marker-2 -> (200, 200)
    const mockProject = (coords: { lat: number; lng: number }) => {
      if (coords.lat === 50.07 && coords.lng === 19.91) return { x: 100, y: 100 }
      if (coords.lat === 50.08 && coords.lng === 19.92) return { x: 200, y: 200 }
      return { x: 0, y: 0 }
    }

    it('returns marker when click is right next to marker (e.g. 15px away)', () => {
      const clickPoint = { x: 110, y: 110 } // dist ~ 14.1px
      const result = findClosestMarker(clickPoint, mockMarkers, mockProject, 32)
      expect(result).not.toBeNull()
      expect(result?.id).toBe('marker-1')
    })

    it('returns marker when click is within threshold (e.g. 25px away)', () => {
      const clickPoint = { x: 100, y: 125 } // dist = 25px
      const result = findClosestMarker(clickPoint, mockMarkers, mockProject, 32)
      expect(result?.id).toBe('marker-1')
    })

    it('returns null when click is far from any marker (e.g. 50px away)', () => {
      const clickPoint = { x: 140, y: 140 } // dist from marker-1 = 56.5px, marker-2 = 84.8px
      const result = findClosestMarker(clickPoint, mockMarkers, mockProject, 32)
      expect(result).toBeNull()
    })

    it('picks the closest marker if multiple markers are within threshold', () => {
      // Point closer to marker-1 (dist 10) than marker-2
      const clickPoint = { x: 106, y: 108 }
      const result = findClosestMarker(clickPoint, mockMarkers, mockProject, 32)
      expect(result?.id).toBe('marker-1')
    })

    it('returns null if markers list is empty', () => {
      const clickPoint = { x: 100, y: 100 }
      const result = findClosestMarker(clickPoint, [], mockProject, 32)
      expect(result).toBeNull()
    })
  })
})
