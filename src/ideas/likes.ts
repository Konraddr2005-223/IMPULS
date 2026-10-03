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
