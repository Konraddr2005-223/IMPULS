import { Heart, MapPin, Send, Sparkles, ThumbsUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { addComment, fetchComments, type CommentRecord } from '../comments/api'
import { publicPhotoUrl } from '../lib/storage'
import { copy } from '../ui/copy'
import { updateSupportThreshold } from './api'
import { IdeaPhoto } from './IdeaPhoto'
import { ideaVisualMeta } from './ideaVisuals'
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
  onPrepareApplication: (selectedComments: CommentRecord[]) => void
  /** Primary path: open Asystent BO panel on the map (PDF). */
  onOpenAgent: (selectedComments: CommentRecord[]) => void
  onThresholdSaved: () => void
}

export function IdeaDetailCard({
  idea,
  liked,
  canLike: _canLike,
  isAuthor,
  userId,
  onLikeToggle,
  onClose,
  onCheckLand,
  onPrepareApplication,
  onOpenAgent,
  onThresholdSaved,
}: IdeaDetailCardProps) {
  const { openAuthModal } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [threshold, setThreshold] = useState(idea.support_threshold)

  useEffect(() => {
    setThreshold(idea.support_threshold)
  }, [idea.support_threshold, idea.id])

  useEffect(() => {
    void fetchComments(idea.id)
      .then(setComments)
      .catch(() => setComments([]))
  }, [idea.id])

  const reached = idea.likes_count >= idea.support_threshold
  const progressPercent = Math.min(100, Math.round((idea.likes_count / Math.max(1, idea.support_threshold)) * 100))

  async function toggleLike() {
    if (!userId) {
      openAuthModal('login')
      return
    }
    if (busy) return
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
    if (!commentBody.trim()) return
    setBusy(true)
    setError(null)
    try {
      const created = await addComment(idea.id, userId, commentBody.trim())
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

  function selectedComments() {
    return comments.filter((c) => selected.has(c.id))
  }

  function openAgent() {
    setError(null)
    onOpenAgent(selectedComments())
  }

  function openPrepare() {
    setError(null)
    onPrepareApplication(selectedComments())
  }

  const photoUrl = idea.photo_path ? publicPhotoUrl(idea.photo_path) : null
  const visual = ideaVisualMeta(idea.title, idea.description)

  return (
    <aside
      className="absolute z-10 left-2 right-2 sm:left-3 sm:right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[min(70vh,560px)] md:inset-y-3 md:left-auto md:right-3 md:bottom-3 md:max-h-none md:w-[min(400px,calc(100%-1.5rem))] rounded-[var(--radius-card)] bg-white border border-[var(--color-outline)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col ring-1 ring-black/5"
      aria-label="Szczegóły pomysłu"
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[var(--radius-card)] bg-[var(--color-primary)] z-[1]" />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${visual.badgeClass}`}
            >
              {visual.label}
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700">
              {idea.category === 'investment' ? 'Inwestycyjny' : 'Nieinwestycyjny'}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              {idea.district_code ?? 'Kraków'}
            </span>
          </div>
          <h2 className="m-0 text-base font-bold tracking-tight text-[var(--color-text)]">
            {idea.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5 border-0 bg-transparent cursor-pointer"
          aria-label="Zamknij szczegóły pomysłu"
        >
          <X size={18} />
        </button>
      </div>

      <IdeaPhoto
        title={idea.title}
        description={idea.description}
        photoPath={idea.photo_path}
        publicUrl={photoUrl}
        className="rounded-xl border border-[var(--color-outline)] max-h-48 aspect-[16/10]"
      />

      {/* Description */}
      <p className="m-0 text-sm text-[var(--color-text)]/85 whitespace-pre-wrap leading-relaxed">
        {idea.description}
      </p>

      {/* Progress & Support Section */}
      <div className="rounded-lg bg-[var(--color-bg)] p-3 border border-black/5 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-[var(--color-text)] flex items-center gap-1">
            <ThumbsUp size={13} className="text-[var(--color-ideas)]" />
            Poparcie sąsiadów:
          </span>
          <span className="font-bold text-[var(--color-ideas)]">
            {idea.likes_count} z {idea.support_threshold} głosów
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              background: reached ? '#10B981' : 'var(--color-ideas)',
            }}
          />
        </div>

        <p className="m-0 text-[11px] text-[var(--color-text)]/65 leading-tight">
          Próg ustalony przez autora: {idea.support_threshold} os. To sygnał zainteresowania, nie wymóg urzędu.
        </p>

        <p className="m-0 text-[11px] text-[var(--color-text)]/65 leading-tight italic">
          {copy.likeDisclaimer}
        </p>
      </div>

      {/* Author threshold settings */}
      {isAuthor && (
        <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100 flex items-center gap-2 text-xs">
          <label className="flex-1 flex flex-col gap-0.5">
            <span className="font-medium text-emerald-950">Twój próg poparcia (autor):</span>
            <input
              type="number"
              min={1}
              max={50}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="min-h-8 px-2 rounded-md border border-black/15 bg-white text-xs font-semibold"
            />
          </label>
          <button
            type="button"
            onClick={saveThreshold}
            disabled={busy || threshold === idea.support_threshold}
            className="min-h-8 self-end px-3 rounded-md border border-black/10 bg-white hover:bg-emerald-100 text-xs font-medium cursor-pointer disabled:opacity-40"
          >
            Zmień próg
          </button>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={toggleLike}
          disabled={busy}
          aria-pressed={liked}
          className="flex-1 min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm transition-all"
          style={{ background: liked ? 'var(--color-ideas)' : 'var(--color-action)' }}
        >
          {liked ? <Heart size={16} fill="white" /> : <ThumbsUp size={16} />}
          {busy ? 'Zapisuję…' : liked ? 'Popierasz pomysł' : 'Popieram ten pomysł'}
        </button>

        <button
          type="button"
          onClick={onCheckLand}
          className="min-h-11 px-3.5 rounded-[var(--radius-card)] border border-black/10 bg-white hover:bg-[var(--color-bg)] text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 transition-colors"
        >
          <MapPin size={14} className="text-[var(--color-action)]" />
          Karta terenu
        </button>
      </div>

      {/* Comments section */}
      <div className="pt-2 border-t border-black/5">
        <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]/70 flex items-center justify-between">
          <span>Komentarze sąsiadów ({comments.length})</span>
          {isAuthor && comments.length > 0 && (
            <span className="text-[10px] text-emerald-700 font-normal">
              Zaznacz uwagi dla wniosku BO
            </span>
          )}
        </h3>

        <ul className="m-0 p-0 list-none space-y-2 max-h-40 overflow-y-auto">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`p-2 rounded-lg text-xs border ${
                selected.has(comment.id)
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-[var(--color-bg)] border-black/5'
              }`}
            >
              {isAuthor && (
                <label className="inline-flex items-center gap-1.5 mb-1 cursor-pointer">
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
                  <span className="text-[10px] font-semibold text-emerald-800">
                    Uwzględnij we wniosku BO
                  </span>
                </label>
              )}
              <p className="m-0 text-[var(--color-text)]/90">{comment.body}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <li className="py-2 text-xs text-[var(--color-text)]/50 italic text-center">
              Brak komentarzy. Bądź pierwszą osobą, która doda opinię!
            </li>
          )}
        </ul>

        {userId ? (
          <div className="mt-2 flex gap-1.5">
            <input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitComment()
              }}
              placeholder="Napisz opinię lub sugestię do pomysłu…"
              className="flex-1 min-h-9 px-3 rounded-lg border border-black/10 text-xs bg-white focus:outline-[var(--color-ideas)]"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={busy || !commentBody.trim()}
              className="min-h-9 px-3 rounded-lg border-0 text-white text-xs font-medium cursor-pointer disabled:opacity-40 inline-flex items-center gap-1"
              style={{ background: 'var(--color-action)' }}
              aria-label="Wyślij komentarz"
            >
              <Send size={12} />
            </button>
          </div>
        ) : (
          <div className="mt-2.5 p-2.5 rounded-lg bg-[var(--color-bg)] border border-black/5 flex items-center justify-between text-xs">
            <span className="text-[var(--color-text)]/70">Zaloguj się, aby komentować i popierać</span>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-2.5 py-1 rounded-md text-white border-0 text-xs font-semibold cursor-pointer shadow-xs"
              style={{ background: 'var(--color-action)' }}
            >
              Zaloguj się
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2 rounded-lg bg-red-50 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}
      </div>

      {/* Sticky CTA: always visible at bottom of right sidebar on laptop */}
      {isAuthor && (
        <div className="shrink-0 border-t border-[var(--color-outline)] bg-white px-3 sm:px-4 py-3 space-y-2 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
          <button
            type="button"
            onClick={openAgent}
            disabled={!reached}
            className="w-full min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-sm font-bold cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md transition-all"
            style={{
              background: reached ? 'var(--color-primary)' : '#6B7280',
              color: reached ? 'var(--color-primary-ink)' : '#fff',
            }}
          >
            <Sparkles size={16} />
            {reached
              ? 'Generuj wniosek BO (+ PDF)'
              : `Wniosek od ${idea.support_threshold} poparć`}
          </button>
          {reached ? (
            <button
              type="button"
              onClick={openPrepare}
              className="w-full min-h-9 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white text-xs font-medium cursor-pointer"
            >
              Zapas: klasyczny zakres katalogu
            </button>
          ) : (
            <p className="m-0 text-[11px] text-center text-[var(--color-text-muted)]">
              Zbierz jeszcze{' '}
              {Math.max(0, idea.support_threshold - idea.likes_count)} poparć,
              aby odblokować generowanie.
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
