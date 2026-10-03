import { useEffect, useState } from 'react'
import { addComment, fetchComments, type CommentRecord } from '../comments/api'
import { publicPhotoUrl } from '../lib/storage'
import { copy } from '../ui/copy'
import { updateSupportThreshold } from './api'
import type { IdeaRecord } from './types'

type IdeaDetailCardProps = {
  idea: IdeaRecord
  liked: boolean
  canLike: boolean
  isAuthor: boolean
  userId: string | null
  onLikeToggle: (liked: boolean) => Promise<void>
  onClose: () => void
  onCheckLand: () => void
  onGenerate: (selectedComments: CommentRecord[]) => Promise<void>
  onThresholdSaved: () => void
}

export function IdeaDetailCard({
  idea,
  liked,
  canLike,
  isAuthor,
  userId,
  onLikeToggle,
  onClose,
  onCheckLand,
  onGenerate,
  onThresholdSaved,
}: IdeaDetailCardProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [threshold, setThreshold] = useState(idea.support_threshold)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setThreshold(idea.support_threshold)
  }, [idea.support_threshold, idea.id])

  useEffect(() => {
    void fetchComments(idea.id)
      .then(setComments)
      .catch(() => setComments([]))
  }, [idea.id])

  const reached = idea.likes_count >= idea.support_threshold

  async function toggleLike() {
    if (!canLike || busy) return
    setBusy(true)
    setError(null)
    try {
      await onLikeToggle(!liked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać lajka.')
    } finally {
      setBusy(false)
    }
  }

  async function submitComment() {
    if (!userId) {
      setError('Zaloguj się, aby komentować.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const created = await addComment(idea.id, userId, commentBody)
      setComments((prev) => [...prev, created])
      setCommentBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się dodać komentarza.')
    } finally {
      setBusy(false)
    }
  }

  async function saveThreshold() {
    if (!userId || !isAuthor) return
    setBusy(true)
    setError(null)
    try {
      await updateSupportThreshold(idea.id, userId, threshold)
      onThresholdSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać progu.')
    } finally {
      setBusy(false)
    }
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const chosen = comments.filter((c) => selected.has(c.id))
      await onGenerate(chosen)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generowanie nie powiodło się.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <aside
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[400px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-lg p-4 max-h-[75svh] overflow-y-auto"
      aria-label="Szczegóły pomysłu"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">{idea.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="border-0 bg-transparent cursor-pointer text-sm text-[var(--color-text)]/60"
          aria-label="Zamknij szczegóły pomysłu"
        >
          Zamknij
        </button>
      </div>

      <p className="mt-2 mb-0 text-sm text-[var(--color-text)]/80 whitespace-pre-wrap">
        {idea.description}
      </p>
      {idea.photo_path && publicPhotoUrl(idea.photo_path) && (
        <img
          src={publicPhotoUrl(idea.photo_path)!}
          alt=""
          className="mt-3 w-full max-h-48 object-cover rounded-[var(--radius-card)]"
        />
      )}

      <p className="mt-3 mb-0 text-sm">
        Poparcie: <strong>{idea.likes_count}/{idea.support_threshold}</strong>
        {reached ? ' · próg osiągnięty' : ''}
      </p>
      <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/60">
        Próg ustalony przez autora: {idea.support_threshold} os. To sygnał zainteresowania, nie
        wymóg urzędu.
      </p>
      <p className="mt-1 mb-0 text-xs text-[var(--color-text)]/60">{copy.likeDisclaimer}</p>

      {isAuthor && (
        <div className="mt-3 flex items-end gap-2">
          <label className="flex flex-col gap-1 text-sm flex-1">
            <span className="font-medium">Próg autora</span>
            <input
              type="number"
              min={1}
              max={50}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="min-h-10 px-3 rounded-[var(--radius-card)] border border-black/10"
            />
          </label>
          <button
            type="button"
            onClick={saveThreshold}
            disabled={busy}
            className="min-h-10 px-3 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm cursor-pointer"
          >
            Zapisz
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!canLike || busy}
          aria-pressed={liked}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
          style={{ background: liked ? 'var(--color-ideas)' : 'var(--color-action)' }}
        >
          {busy ? '…' : liked ? 'Cofnij lajk' : 'Lubię to'}
        </button>
        <button
          type="button"
          onClick={onCheckLand}
          className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm font-medium cursor-pointer"
        >
          Sprawdź teren
        </button>
      </div>

      <h3 className="mt-4 mb-2 text-sm font-semibold">Komentarze</h3>
      <ul className="m-0 p-0 list-none space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="text-sm border-b border-black/5 pb-2">
            {isAuthor && (
              <label className="inline-flex items-start gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={selected.has(comment.id)}
                  onChange={(e) => {
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (e.target.checked) next.add(comment.id)
                      else next.delete(comment.id)
                      return next
                    })
                  }}
                />
                <span className="text-xs text-[var(--color-text)]/55">Uwzględnij we wniosku</span>
              </label>
            )}
            <p className="m-0">{comment.body}</p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-[var(--color-text)]/55">Brak komentarzy.</li>
        )}
      </ul>

      {userId && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            rows={2}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Dodaj komentarz…"
            className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 text-sm resize-y"
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={busy || !commentBody.trim()}
            className="min-h-10 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm cursor-pointer disabled:opacity-50"
          >
            Wyślij komentarz
          </button>
        </div>
      )}

      {isAuthor && (
        <button
          type="button"
          onClick={generate}
          disabled={generating || !reached}
          className="mt-4 w-full min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--color-ideas)' }}
        >
          {generating
            ? 'Generuję wniosek (mock)…'
            : reached
              ? 'Przygotuj wniosek BO (mock AI)'
              : `Wniosek po osiągnięciu progu (${idea.likes_count}/${idea.support_threshold})`}
        </button>
      )}

      {!canLike && (
        <p className="mt-2 mb-0 text-xs text-[var(--color-text)]/60">
          Zaloguj się (Autor / Sąsiad), aby lajkować i komentować.
        </p>
      )}
      {error && (
        <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
          {error}
        </p>
      )}
    </aside>
  )
}
