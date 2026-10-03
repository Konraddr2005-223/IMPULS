import { krakowAdapter } from './index'

export type WmsProbeResult = {
  id: string
  title: string
  ok: boolean
  status?: number
  timedOut: boolean
  error?: string
  durationMs: number
}

/** Read-only GetCapabilities probe with timeout — does not parse ownership. */
export async function probeWmsSources(
  timeoutMs = 4000,
): Promise<WmsProbeResult[]> {
  const sources = krakowAdapter.getWmsSources()
  return Promise.all(
    sources.map(async (source) => {
      const started = performance.now()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const url = `${source.url}?SERVICE=WMS&REQUEST=GetCapabilities`
        const response = await fetch(url, {
          signal: controller.signal,
          mode: 'cors',
        })
        return {
          id: source.id,
          title: source.title,
          ok: response.ok,
          status: response.status,
          timedOut: false,
          durationMs: Math.round(performance.now() - started),
        }
      } catch (err) {
        const timedOut = err instanceof DOMException && err.name === 'AbortError'
        return {
          id: source.id,
          title: source.title,
          ok: false,
          timedOut,
          error: timedOut ? 'timeout' : err instanceof Error ? err.message : 'error',
          durationMs: Math.round(performance.now() - started),
        }
      } finally {
        clearTimeout(timer)
      }
    }),
  )
}
