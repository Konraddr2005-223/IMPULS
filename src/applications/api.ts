import { krakowAdapter } from '../city'
import type { IdeaRecord } from '../ideas/types'
import { supabase } from '../lib/supabase'
import { hashInput, mockGenerateApplication } from './mockGenerate'
import type { ApplicationContent, ApplicationRecord } from './types'

const MAX_GENERATIONS_PER_IDEA = 3

export async function countGenerations(ideaId: string): Promise<number> {
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('idea_id', ideaId)
  if (error) throw error
  return count ?? 0
}

export async function fetchLatestApplication(
  ideaId: string,
): Promise<ApplicationRecord | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, idea_id, author_id, idea_revision, template_version, model, prompt_version, input_hash, content_json, generation_status, generation_request_key, summary_published, created_at, updated_at',
    )
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as ApplicationRecord | null) ?? null
}

export async function generateAndSaveApplication(input: {
  idea: IdeaRecord
  authorId: string
  selectedComments: { id: string; body: string }[]
  costItems: { catalogId: string; quantity: number }[]
  landNote?: string
}): Promise<ApplicationRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  if (input.idea.author_id !== input.authorId) {
    throw new Error('Tylko autor pomysłu może generować wniosek.')
  }
  if (input.idea.likes_count < input.idea.support_threshold) {
    throw new Error(
      `Wymagane poparcie: ${input.idea.support_threshold}. Obecnie: ${input.idea.likes_count}.`,
    )
  }

  const previous = await countGenerations(input.idea.id)
  if (previous >= MAX_GENERATIONS_PER_IDEA) {
    throw new Error(`Limit ${MAX_GENERATIONS_PER_IDEA} generowań na pomysł w demo.`)
  }

  const content: ApplicationContent = mockGenerateApplication({
    idea: input.idea,
    selectedComments: input.selectedComments,
    costItems: input.costItems,
    landNote: input.landNote,
  })

  const inputHash = hashInput({
    ideaId: input.idea.id,
    revision: input.idea.revision,
    comments: input.selectedComments.map((c) => c.id),
    costItems: input.costItems,
  })
  const requestKey = `${input.idea.id}:${input.idea.revision}:${inputHash}:${previous + 1}`

  const { data, error } = await supabase
    .from('applications')
    .insert({
      idea_id: input.idea.id,
      author_id: input.authorId,
      idea_revision: input.idea.revision,
      template_version: krakowAdapter.rulesVersion,
      model: 'mock-local',
      prompt_version: 'mock-v1',
      input_hash: inputHash,
      content_json: content,
      generation_status: 'ready',
      generation_request_key: requestKey,
      summary_published: false,
    })
    .select(
      'id, idea_id, author_id, idea_revision, template_version, model, prompt_version, input_hash, content_json, generation_status, generation_request_key, summary_published, created_at, updated_at',
    )
    .single()

  if (error) throw error
  return data as ApplicationRecord
}
