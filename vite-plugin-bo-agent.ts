import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function handleBoAgent(
  server: ViteDevServer,
  apiKey: string,
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (!apiKey) {
      sendJson(res, 503, {
        error: 'missing_cursor_key',
        detail:
          'Brak CURSOR_API_KEY w .env.local — asystent spadnie na mock po stronie klienta.',
      })
      return
    }

    const rawBody = await readBody(req)
    const input = JSON.parse(rawBody || '{}') as {
      ideaText?: string
      location?: string
      neighborComments?: string
    }

    // Runtime resolve via Vite SSR — avoids pulling this module into tsconfig.node.
    const mod = (await server.ssrLoadModule('/src/agent/runCursorAgent.ts')) as {
      runCursorBoAgent: (
        raw: {
          ideaText: string
          location?: string
          neighborComments?: string
        },
        key: string,
      ) => Promise<Record<string, unknown>>
    }

    const result = await mod.runCursorBoAgent(
      {
        ideaText: input.ideaText ?? '',
        location: input.location,
        neighborComments: input.neighborComments,
      },
      apiKey,
    )
    sendJson(res, 200, result)
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : 'Nie udało się wywołać Cursor SDK.'
    sendJson(res, 500, { error: 'cursor_agent_failed', detail })
  }
}

/**
 * Dev middleware: POST /api/bo-agent → Cursor SDK (CURSOR_API_KEY).
 * Keeps the key off the browser bundle (never VITE_*).
 */
export function boAgentApiPlugin(): Plugin {
  return {
    name: 'bo-agent-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      const apiKey = env.CURSOR_API_KEY ?? process.env.CURSOR_API_KEY ?? ''

      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || req.url?.split('?')[0] !== '/api/bo-agent') {
          next()
          return
        }
        void handleBoAgent(server, apiKey, req, res)
      })
    },
  }
}
