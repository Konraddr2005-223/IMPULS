import type { IdeaRecord } from '../ideas/types'
import { MAX_GENERATIONS_PER_IDEA, MAX_SELECTED_COMMENTS } from './limits'

/** Pure gates for generator access — unit-tested (§8.3–4). */
export function assertCanGenerate(input: {
  idea: IdeaRecord
  authorId: string
  selectedCommentCount: number
  previousGenerations: number
}): void {
  if (input.idea.author_id !== input.authorId) {
    throw new Error('Tylko autor pomysłu może generować wniosek.')
  }
  if (input.idea.likes_count < input.idea.support_threshold) {
    throw new Error(
      `Wymagane poparcie: ${input.idea.support_threshold}. Obecnie: ${input.idea.likes_count}.`,
    )
  }
  if (input.selectedCommentCount > MAX_SELECTED_COMMENTS) {
    throw new Error(`Maks. ${MAX_SELECTED_COMMENTS} komentarzy we wniosku.`)
  }
  if (input.previousGenerations >= MAX_GENERATIONS_PER_IDEA) {
    throw new Error(`Limit ${MAX_GENERATIONS_PER_IDEA} generowań na pomysł w demo.`)
  }
}
