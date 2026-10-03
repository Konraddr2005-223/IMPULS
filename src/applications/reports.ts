import { listIdeaLikerIds } from '../ideas/likes'
import { createNotification } from '../notifications/api'
import { supabase } from '../lib/supabase'

async function recipientsForIdea(ideaId: string, authorId: string) {
  const likers = await listIdeaLikerIds(ideaId)
  return [...new Set(likers.filter((id) => id !== authorId))]
}

export async function publishApplicationSummary(
  applicationId: string,
  authorId: string,
  ideaId: string,
  ideaTitle: string,
) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('applications')
    .update({ summary_published: true })
    .eq('id', applicationId)
    .eq('author_id', authorId)
  if (error) throw error

  const recipients = await recipientsForIdea(ideaId, authorId)
  for (const recipientId of recipients) {
    await createNotification({
      recipientId,
      ideaId,
      type: 'application_summary',
      eventKey: `summary:${applicationId}:${recipientId}`,
      payload: {
        title: ideaTitle,
        message: 'Autor przygotował projekt wniosku.',
      },
    })
  }
}

export async function reportSubmission(
  applicationId: string,
  authorId: string,
  officialProjectId: string,
  ideaId: string,
  ideaTitle: string,
) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  if (!officialProjectId.trim()) {
    throw new Error('Podaj oficjalny numer projektu.')
  }

  const { error } = await supabase
    .from('applications')
    .update({
      official_project_id: officialProjectId.trim(),
      submitted_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('author_id', authorId)
  if (error) throw error

  const recipients = await recipientsForIdea(ideaId, authorId)
  for (const recipientId of recipients) {
    await createNotification({
      recipientId,
      ideaId,
      type: 'submitted',
      eventKey: `submitted:${applicationId}:${recipientId}`,
      payload: {
        title: ideaTitle,
        message: 'Autor zgłosił złożenie projektu. Sprawdź instrukcję podpisów.',
        officialProjectId,
      },
    })
  }
}

export async function reportSignatures(
  applicationId: string,
  authorId: string,
  ideaId: string,
  ideaTitle: string,
) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('applications')
    .update({ signatures_reported_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('author_id', authorId)
  if (error) throw error

  const recipients = await recipientsForIdea(ideaId, authorId)
  for (const recipientId of recipients) {
    await createNotification({
      recipientId,
      ideaId,
      type: 'signatures',
      eventKey: `signatures:${applicationId}:${recipientId}`,
      payload: {
        title: ideaTitle,
        message: 'Według autora wymagana lista poparcia została zebrana.',
      },
    })
  }
}
