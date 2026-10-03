import { krakowAdapter } from '../city'
import type { IdeaRecord } from '../ideas/types'
import { supabase } from '../lib/supabase'
import { assertCanGenerate } from './gates'
import { MAX_GENERATIONS_PER_IDEA, MAX_SELECTED_COMMENTS } from './limits'
import { hashInput, mockGenerateApplication } from './mockGenerate'
import type { ApplicationContent, ApplicationRecord } from './types'

export { MAX_GENERATIONS_PER_IDEA, MAX_SELECTED_COMMENTS }

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
      'id, idea_id, author_id, idea_revision, template_version, model, prompt_version, input_hash, content_json, generation_status, generation_request_key, summary_published, official_project_id, submitted_at, signatures_reported_at, created_at, updated_at',
    )
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as ApplicationRecord | null) ?? null
}

export async function saveApplicationContent(
  applicationId: string,
  authorId: string,
  content: ApplicationContent,
): Promise<ApplicationRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { data, error } = await supabase
    .from('applications')
    .update({
      content_json: content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('author_id', authorId)
    .select(
      'id, idea_id, author_id, idea_revision, template_version, model, prompt_version, input_hash, content_json, generation_status, generation_request_key, summary_published, official_project_id, submitted_at, signatures_reported_at, created_at, updated_at',
    )
    .single()
  if (error) throw error
  return data as ApplicationRecord
}

type EdgeResult =
  | { kind: 'application'; application: ApplicationRecord }
  | { kind: 'mock' }
  | { kind: 'error'; message: string }
  | { kind: 'skip' }

async function tryEdgeGenerate(input: {
  idea: IdeaRecord
  selectedComments: { id: string; body: string }[]
  costItems: { catalogId: string; quantity: number }[]
  landNote?: string
}): Promise<EdgeResult> {
  if (!supabase) return { kind: 'skip' }
  try {
    const { data, error } = await supabase.functions.invoke('generate-application', {
      body: {
        ideaId: input.idea.id,
        selectedComments: input.selectedComments.slice(0, MAX_SELECTED_COMMENTS),
        costItems: input.costItems,
        landNote: input.landNote,
      },
    })
    if (error) return { kind: 'skip' }
    if (data?.application) {
      return { kind: 'application', application: data.application as ApplicationRecord }
    }
    if (data?.mode === 'mock') return { kind: 'mock' }
    if (data?.mode === 'openai-error' || data?.error) {
      return {
        kind: 'error',
        message:
          typeof data?.detail === 'string'
            ? data.detail
            : 'Generator AI niedostępny — użyto mocka / przykładu awaryjnego.',
      }
    }
    return { kind: 'skip' }
  } catch {
    return { kind: 'skip' }
  }
}

export async function generateAndSaveApplication(input: {
  idea: IdeaRecord
  authorId: string
  selectedComments: { id: string; body: string }[]
  costItems: { catalogId: string; quantity: number }[]
  landNote?: string
}): Promise<ApplicationRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const previous = await countGenerations(input.idea.id)
  assertCanGenerate({
    idea: input.idea,
    authorId: input.authorId,
    selectedCommentCount: input.selectedComments.length,
    previousGenerations: previous,
  })

  const { data: inflight } = await supabase
    .from('applications')
    .select('id')
    .eq('idea_id', input.idea.id)
    .eq('generation_status', 'generating')
    .limit(1)
  if (inflight && inflight.length > 0) {
    throw new Error('Trwa już generowanie dla tego pomysłu — odczekaj.')
  }

  const edge = await tryEdgeGenerate(input)
  if (edge.kind === 'application') return edge.application
  // mock / skip / openai-error → local mock (emergency example available in editor)

  const content: ApplicationContent = mockGenerateApplication({
    idea: input.idea,
    selectedComments: input.selectedComments.slice(0, MAX_SELECTED_COMMENTS),
    costItems: input.costItems,
    landNote: input.landNote,
  })
  if (edge.kind === 'error') {
    content.warnings = [
      ...content.warnings,
      `Uwaga: ${edge.message}`,
      'Możesz wczytać „Przykład awaryjny” w edytorze.',
    ]
  }

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
      'id, idea_id, author_id, idea_revision, template_version, model, prompt_version, input_hash, content_json, generation_status, generation_request_key, summary_published, official_project_id, submitted_at, signatures_reported_at, created_at, updated_at',
    )
    .single()

  if (error) throw error
  return data as ApplicationRecord
}
