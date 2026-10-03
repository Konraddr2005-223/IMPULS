import { supabase } from './supabase'

const BUCKET = 'media'

export async function uploadPhoto(
  userId: string,
  file: File,
  folder: 'ideas' | 'faults',
): Promise<string> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  return path
}

export function publicPhotoUrl(path: string | null | undefined): string | null {
  if (!path || !supabase) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
