import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PolygonPicker } from './PolygonPicker'

describe('PolygonPicker', () => {
  it('renders label, guidance, and vertex counter', () => {
    const onChange = vi.fn()

    render(
      <PolygonPicker
        points={[]}
        onChange={onChange}
        label="Granice okolicy"
      />,
    )

    expect(screen.getByText('Granice okolicy')).toBeInTheDocument()
    expect(screen.getByText(/0\/4/)).toBeInTheDocument()
    expect(screen.getByText(/Wybierz jeszcze 3 wierzchołek/i)).toBeInTheDocument()
  })

  it('triggers onGetGps when GPS button is clicked', async () => {
    const user = userEvent.setup()
    const onGetGps = vi.fn()

    render(
      <PolygonPicker
        points={[]}
        onChange={vi.fn()}
        onGetGps={onGetGps}
      />,
    )

    const gpsBtn = screen.getByRole('button', { name: /GPS/i })
    expect(gpsBtn).toBeInTheDocument()
    await user.click(gpsBtn)
    expect(onGetGps).toHaveBeenCalledOnce()
  })

  it('allows undoing the last placed vertex', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const initialPoints = [
      { lat: 50.0, lng: 19.0 },
      { lat: 50.1, lng: 19.0 },
      { lat: 50.1, lng: 19.1 },
    ]

    render(
      <PolygonPicker
        points={initialPoints}
        onChange={onChange}
      />,
    )

    expect(screen.getByText(/3\/4/)).toBeInTheDocument()
    const undoBtn = screen.getByTitle('Cofnij ostatni wierzchołek')
    await user.click(undoBtn)

    expect(onChange).toHaveBeenCalledWith([
      { lat: 50.0, lng: 19.0 },
      { lat: 50.1, lng: 19.0 },
    ])
  })

  it('allows resetting all vertices', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const initialPoints = [
      { lat: 50.0, lng: 19.0 },
      { lat: 50.1, lng: 19.0 },
    ]

    render(
      <PolygonPicker
        points={initialPoints}
        onChange={onChange}
      />,
    )

    const resetBtn = screen.getByTitle('Wyczyść wszystkie wierzchołki')
    await user.click(resetBtn)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('provides quick preset to insert a default 4-vertex quadrilateral', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <PolygonPicker
        points={[]}
        onChange={onChange}
      />,
    )

    const presetBtn = screen.getByRole('button', { name: /Wstaw przykładowy czworokąt/i })
    await user.click(presetBtn)
    expect(onChange).toHaveBeenCalledOnce()
    const addedPoints = onChange.mock.calls[0][0]
    expect(addedPoints).toHaveLength(4)
  })
})
