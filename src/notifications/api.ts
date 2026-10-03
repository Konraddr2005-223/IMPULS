import { supabase } from '../lib/supabase'

export type NotificationRecord = {
  id: string
  recipient_id: string
  idea_id: string | null
  type: string
  event_key: string
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export async function listNotifications(
  userId: string,
): Promise<NotificationRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, recipient_id, idea_id, type, event_key, payload, read_at, created_at',
    )
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as NotificationRecord[]) ?? []
}

export async function markNotificationRead(id: string, userId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', userId)
  if (error) throw error
}

export async function createNotification(input: {
  recipientId: string
  ideaId?: string | null
  type: string
  eventKey: string
  payload?: Record<string, unknown>
}) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.from('notifications').upsert(
    {
      recipient_id: input.recipientId,
      idea_id: input.ideaId ?? null,
      type: input.type,
      event_key: input.eventKey,
      payload: input.payload ?? {},
    },
    { onConflict: 'recipient_id,event_key', ignoreDuplicates: true },
  )
  if (error) throw error
}
