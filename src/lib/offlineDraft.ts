type DraftKind = 'idea' | 'fault'

function key(kind: DraftKind, userId: string | null) {
  return `sasiedzki:draft:${kind}:${userId ?? 'anon'}`
}

export function saveOfflineDraft(
  kind: DraftKind,
  userId: string | null,
  data: Record<string, unknown>,
): void {
  try {
    localStorage.setItem(
      key(kind, userId),
      JSON.stringify({ ...data, savedAt: new Date().toISOString() }),
    )
  } catch {
    // quota / private mode
  }
}

export function loadOfflineDraft<T extends Record<string, unknown>>(
  kind: DraftKind,
  userId: string | null,
): T | null {
  try {
    const raw = localStorage.getItem(key(kind, userId))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function clearOfflineDraft(kind: DraftKind, userId: string | null): void {
  try {
    localStorage.removeItem(key(kind, userId))
  } catch {
    // ignore
  }
}
