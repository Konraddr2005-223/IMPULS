import { useState, type FormEvent } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { runBoAgent } from './api'
import { ProposalCard } from './ProposalCard'
import type { BoAgentProposal } from './schema'
import { copy } from '../ui/copy'

type ChatRole = 'user' | 'assistant' | 'system'

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  proposal?: BoAgentProposal
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function AgentScreen() {
  const [ideaText, setIdeaText] = useState('')
  const [location, setLocation] = useState('')
  const [neighborComments, setNeighborComments] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      text:
        'Opisz pomysł zwykłym językiem. Przygotuję formalny wniosek BO + checklistę dokumentów i PDF. ' +
        'Z mapy (karta pomysłu) możesz uruchomić ten sam Asystent — to główna ścieżka. ' +
        'To nie jest złożenie w systemie miasta.',
    },
  ])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = ideaText.trim()
    if (trimmed.length < 8 || busy) return

    setError(null)
    setBusy(true)
    const userMsg: ChatMessage = {
      id: newId(),
      role: 'user',
      text: [
        trimmed,
        location.trim() ? `Lokalizacja: ${location.trim()}` : null,
        neighborComments.trim()
          ? `Komentarze: ${neighborComments.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    }
    setMessages((m) => [...m, userMsg])
    setIdeaText('')

    try {
      const result = await runBoAgent({
        ideaText: trimmed,
        location: location.trim() || undefined,
        neighborComments: neighborComments.trim() || undefined,
      })
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          role: 'assistant',
          text: `Szkic wniosku (${result.mode})`,
          proposal: result.proposal,
        },
      ])
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Nie udało się przygotować wniosku.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col mx-auto w-full max-w-2xl">
      <header className="shrink-0 px-4 pt-5 pb-3 border-b border-black/5">
        <h2 className="m-0 text-lg font-semibold flex items-center gap-2">
          <Bot size={20} aria-hidden /> Asystent BO
        </h2>
        <p className="mt-1 mb-0 text-sm text-[var(--color-text)]/65">
          Formalny wniosek + PDF. Najwygodniej odpalisz go też z karty pomysłu na
          mapie. {copy.documentDisclaimer}
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div
                key={msg.id}
                className="rounded-[var(--radius-card)] bg-[var(--color-bg)] border border-black/5 p-3 text-sm text-[var(--color-text)]/80"
              >
                {msg.text}
              </div>
            )
          }
          if (msg.role === 'user') {
            return (
              <div
                key={msg.id}
                className="ml-8 rounded-[var(--radius-card)] p-3 text-sm text-white whitespace-pre-wrap"
                style={{ background: 'var(--color-action)' }}
              >
                {msg.text}
              </div>
            )
          }
          if (msg.proposal) {
            return (
              <div key={msg.id} className="mr-2">
                <ProposalCard proposal={msg.proposal} caption={msg.text} />
              </div>
            )
          }
          return (
            <div
              key={msg.id}
              className="mr-8 rounded-[var(--radius-card)] bg-white border border-black/5 p-3 text-sm"
            >
              {msg.text}
            </div>
          )
        })}
        {error && (
          <p className="m-0 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-black/5 bg-white px-4 py-3 space-y-2"
      >
        <label className="block text-xs text-[var(--color-text)]/70">
          Lokalizacja (opcjonalnie)
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full min-h-10 px-3 rounded-[var(--radius-card)] border border-black/10 text-sm"
            placeholder="np. Park Krakowski / Kazimierz"
          />
        </label>
        <label className="block text-xs text-[var(--color-text)]/70">
          Komentarze sąsiadów (opcjonalnie)
          <input
            value={neighborComments}
            onChange={(e) => setNeighborComments(e.target.value)}
            className="mt-1 w-full min-h-10 px-3 rounded-[var(--radius-card)] border border-black/10 text-sm"
            placeholder="np. zostaw miejsce na wózek"
          />
        </label>
        <div className="flex gap-2 items-end">
          <label className="flex-1 block text-xs text-[var(--color-text)]/70">
            Twój pomysł
            <textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              rows={3}
              required
              minLength={8}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius-card)] border border-black/10 text-sm resize-y"
              placeholder="Zróbmy wybieg dla psów…"
            />
          </label>
          <button
            type="submit"
            disabled={busy || ideaText.trim().length < 8}
            className="min-h-11 min-w-11 px-3 rounded-[var(--radius-card)] border-0 text-white cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
            style={{ background: 'var(--color-action)' }}
            aria-label="Wyślij do asystenta"
          >
            {busy ? <Sparkles size={18} /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  )
}
