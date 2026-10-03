import { supabase } from '../lib/supabase'

export type CommentRecord = {
  id: string
  idea_id: string
  author_id: string
  body: string
  status: string
  created_at: string
}

export async function fetchComments(ideaId: string): Promise<CommentRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('comments')
    .select('id, idea_id, author_id, body, status, created_at')
    .eq('idea_id', ideaId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as CommentRecord[]) ?? []
}

export async function addComment(
  ideaId: string,
  authorId: string,
  body: string,
): Promise<CommentRecord> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const trimmed = body.trim()
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error('Komentarz musi mieć 1–2000 znaków.')
  }
  const { data, error } = await supabase
    .from('comments')
    .insert({
      idea_id: ideaId,
      author_id: authorId,
      body: trimmed,
      status: 'visible',
    })
    .select('id, idea_id, author_id, body, status, created_at')
    .single()
  if (error) throw error
  return data as CommentRecord
}
