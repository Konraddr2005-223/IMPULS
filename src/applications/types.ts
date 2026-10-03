export type ApplicationContent = {
  title: string
  summary: string
  location: string
  description: string
  justification: string
  accessibility: string
  schedule: { name: string; description: string; date: string | null }[]
  costItems: { catalogId: string; quantity: number }[]
  missingInformation: string[]
  warnings: string[]
  usedCommentIds: string[]
  generator: 'mock' | 'openai'
  projectType?: 'investment' | 'non_investment'
  /** Non-investment variant fields (instrukcja formularza). */
  participants?: string
  equipment?: string
}

export type ApplicationRecord = {
  id: string
  idea_id: string
  author_id: string
  idea_revision: number
  template_version: string
  model: string | null
  prompt_version: string | null
  input_hash: string | null
  content_json: ApplicationContent | null
  generation_status: string
  generation_request_key: string | null
  summary_published: boolean
  official_project_id: string | null
  submitted_at: string | null
  signatures_reported_at: string | null
  created_at: string
  updated_at: string
}
