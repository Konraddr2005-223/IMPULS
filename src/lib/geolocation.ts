export type GeoResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'unsupported' | 'denied' | 'unavailable' }

export function getCurrentPosition(timeoutMs = 8000): Promise<GeoResult> {
  if (!navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: 'unsupported' })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, reason: 'denied' })
          return
        }
        resolve({ ok: false, reason: 'unavailable' })
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    )
  })
}
