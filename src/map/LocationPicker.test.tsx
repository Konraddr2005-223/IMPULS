import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocationPicker } from './LocationPicker'

describe('LocationPicker', () => {
  it('renders map guidance, selected coordinates badge, and GPS button', () => {
    const onChange = vi.fn()
    const onGetGps = vi.fn()

    render(
      <LocationPicker
        value={{ lat: 50.0614, lng: 19.9366 }}
        onChange={onChange}
        onGetGps={onGetGps}
        label="Lokalizacja pomysłu"
      />,
    )

    expect(screen.getByText('Lokalizacja pomysłu')).toBeInTheDocument()
    expect(
      screen.getByText(/Kliknij na mapie, aby wskazać dokładne miejsce/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/50.06140, 19.93660/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Użyj GPS/i })).toBeInTheDocument()
  })

  it('triggers onGetGps when GPS button is clicked', async () => {
    const user = userEvent.setup()
    const onGetGps = vi.fn()

    render(
      <LocationPicker
        value={{ lat: 50.0614, lng: 19.9366 }}
        onChange={vi.fn()}
        onGetGps={onGetGps}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Użyj GPS/i }))
    expect(onGetGps).toHaveBeenCalledOnce()
  })

  it('renders large map button and calls onPickOnMainMap', async () => {
    const user = userEvent.setup()
    const onPickOnMainMap = vi.fn()

    render(
      <LocationPicker
        value={{ lat: 50.0614, lng: 19.9366 }}
        onChange={vi.fn()}
        onPickOnMainMap={onPickOnMainMap}
      />,
    )

    const mapBtn = screen.getByRole('button', { name: /Duża mapa/i })
    expect(mapBtn).toBeInTheDocument()
    await user.click(mapBtn)
    expect(onPickOnMainMap).toHaveBeenCalledOnce()
  })

  it('renders radius slider and preset buttons when radiusM and onRadiusChange are provided', async () => {
    const user = userEvent.setup()
    const onRadiusChange = vi.fn()

    render(
      <LocationPicker
        value={{ lat: 50.0614, lng: 19.9366 }}
        onChange={vi.fn()}
        radiusM={500}
        onRadiusChange={onRadiusChange}
        minRadius={50}
        maxRadius={2000}
      />,
    )

    const slider = screen.getByRole('slider', { name: /Promień obszaru/i })
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveValue('500')
    expect(screen.getAllByText('500 m').length).toBeGreaterThanOrEqual(1)

    // Test quick preset buttons
    const presetBtn = screen.getByRole('button', { name: '1 km' })
    expect(presetBtn).toBeInTheDocument()
    await user.click(presetBtn)
    expect(onRadiusChange).toHaveBeenCalledWith(1000)
  })
})
