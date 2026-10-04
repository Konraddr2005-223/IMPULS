import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IdeaListCard } from './IdeaListCard'

describe('IdeaListCard', () => {
  it('expands project description when Szczegóły is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IdeaListCard
        title="Zielony zakątek"
        description="Nasadzenie drzew i montaż ławek przy skwerze."
        district="Krowodrza"
        likes={3}
        threshold={5}
        rankLabel="#1"
        onClick={onClick}
      />,
    )

    const details = screen.getByText(/Nasadzenie drzew i montaż ławek/i).closest('[aria-hidden]')
    expect(details).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('idea-details-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    await user.click(screen.getByTestId('idea-details-toggle'))
    expect(details).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('idea-details-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(onClick).not.toHaveBeenCalled()

    await user.click(screen.getByTestId('idea-details-toggle'))
    expect(details).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('idea-details-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('selects idea when the main card body is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IdeaListCard
        title="Wybieg dla psów"
        description="Ogrodzony wybieg."
        district="Podgórze"
        likes={2}
        threshold={5}
        rankLabel="#2"
        onClick={onClick}
      />,
    )
    await user.click(screen.getByRole('heading', { name: /Wybieg dla psów/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
