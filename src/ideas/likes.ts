import { supabase } from '../lib/supabase'

/** Idempotent like state: insert when liked, delete when not. */
export async function setLike(ideaId: string, userId: string, liked: boolean) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  if (liked) {
    const { error } = await supabase.from('idea_likes').upsert(
      { idea_id: ideaId, user_id: userId },
      { onConflict: 'idea_id,user_id', ignoreDuplicates: true },
    )
    if (error) throw error
    await supabase.rpc('notify_threshold_reached', { p_idea_id: ideaId })
  } else {
    const { error } = await supabase
      .from('idea_likes')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
    if (error) throw error
  }
}

export async function fetchMyLikedIdeaIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set()

  const { data, error } = await supabase
    .from('idea_likes')
    .select('idea_id')
    .eq('user_id', userId)

  if (error) throw error
  return new Set((data ?? []).map((row) => row.idea_id as string))
}

export async function listIdeaLikerIds(ideaId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_idea_liker_ids', {
    p_idea_id: ideaId,
  })
  if (error) {
    const fb = await supabase
      .from('idea_likes')
      .select('user_id')
      .eq('idea_id', ideaId)
    if (fb.error) throw fb.error
    return (fb.data ?? []).map((r) => r.user_id as string)
  }
  return (data ?? []).map((r: { user_id: string }) => r.user_id)
}
