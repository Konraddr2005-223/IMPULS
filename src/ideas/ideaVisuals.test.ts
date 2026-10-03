import { describe, expect, it } from 'vitest'
import {
  resolveIdeaIconKind,
  resolveIdeaImageUrl,
  ideaVisualMeta,
} from './ideaVisuals'

describe('resolveIdeaIconKind', () => {
  it('maps common BO themes to icons', () => {
    expect(resolveIdeaIconKind('Zielony zakątek z drzewami')).toBe('tree')
    expect(resolveIdeaIconKind('Wybieg dla psów')).toBe('dog')
    expect(resolveIdeaIconKind('Ścieżka rowerowa')).toBe('bike')
    expect(resolveIdeaIconKind('Latarnie solarne i doświetlenie')).toBe('light')
    expect(resolveIdeaIconKind('Plac zabaw dla dzieci')).toBe('playground')
    expect(resolveIdeaIconKind('Warsztaty i bookcrossing')).toBe('book')
    expect(resolveIdeaIconKind('Ogród społeczny warzywny')).toBe('garden')
  })
})

describe('resolveIdeaImageUrl', () => {
  it('uses placeholder when no photo', () => {
    expect(
      resolveIdeaImageUrl({
        photo_path: null,
        title: 'Wybieg dla psów',
      }),
    ).toBe('/placeholders/idea-dog.svg')
  })

  it('keeps absolute demo paths', () => {
    expect(
      resolveIdeaImageUrl({
        photo_path: '/placeholders/idea-tree.svg',
        title: 'X',
      }),
    ).toBe('/placeholders/idea-tree.svg')
  })
})

describe('ideaVisualMeta', () => {
  it('returns polish labels', () => {
    expect(ideaVisualMeta('Nasadzenia drzew').label).toMatch(/Zieleń/i)
  })
})
