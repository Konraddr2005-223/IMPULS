import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, ThumbsUp } from 'lucide-react'
import { IdeaPhoto } from './IdeaPhoto'
import { ideaVisualMeta } from './ideaVisuals'

type IdeaListCardProps = {
  title: string
  description?: string
  district: string
  likes: number
  threshold: number
  photoPath?: string | null
  publicUrl?: string | null
  rankLabel: string
  selected?: boolean
  unlocked?: boolean
  onClick: () => void
}

export function IdeaListCard({
  title,
  description,
  district,
  likes,
  threshold,
  photoPath,
  publicUrl,
  rankLabel,
  selected,
  unlocked,
  onClick,
}: IdeaListCardProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = ideaVisualMeta(title, description)
  const detailsId = `idea-details-${rankLabel.replace(/\s+/g, '-')}`

  return (
    <article
      data-testid="idea-list-card"
      className={`w-full text-left relative overflow-hidden rounded-xl p-3 transition-all ${
        selected
          ? 'bg-white ring-2 ring-[var(--color-primary)] shadow-md'
          : 'bg-white shadow-sm hover:bg-[var(--color-yellow-soft)]'
      }`}
    >
      {selected && (
        <span className="absolute top-0 left-0 bottom-0 w-1.5 bg-[var(--color-primary)]" />
      )}

      <button
        type="button"
        onClick={onClick}
        className="w-full text-left border-0 bg-transparent p-0 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.badgeClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {meta.label}
          </span>
          <span className="font-mono text-[11px] font-bold text-amber-800">
            {rankLabel}
          </span>
        </div>
        <h3 className="m-0 text-sm sm:text-base font-bold leading-snug text-[var(--color-text)] mb-2">
          {title}
        </h3>
        <div className="flex items-center gap-2.5">
          <IdeaPhoto
            title={title}
            description={description}
            photoPath={photoPath}
            publicUrl={publicUrl}
            className="w-16 h-14 sm:w-[4.5rem] sm:h-16 rounded-lg shrink-0"
          />
          <div className="min-w-0 text-xs text-[var(--color-text-muted)] space-y-1">
            <p className="m-0 flex items-center gap-1 text-[var(--color-text)]">
              <MapPin size={13} className="shrink-0 opacity-60" />
              <span className="truncate">{district}</span>
            </p>
            <p
              className={`m-0 flex items-center gap-1 font-semibold ${
                unlocked ? 'text-amber-800' : ''
              }`}
            >
              <ThumbsUp size={13} className="shrink-0" />
              {likes} / {threshold} poparć
            </p>
          </div>
        </div>
      </button>

      <div
        id={detailsId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? 'grid-rows-[1fr] mt-2.5' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden min-h-0">
          <div className="rounded-lg bg-[var(--color-bg)] border border-[var(--color-outline)] px-3 py-2.5">
            <p className="m-0 text-xs sm:text-sm text-[var(--color-text)]/85 leading-relaxed whitespace-pre-wrap">
              {description?.trim() || 'Brak dodatkowego opisu projektu.'}
            </p>
            <p className="m-0 mt-2 text-[11px] text-[var(--color-text-muted)]">
              Kategoria: {meta.label}
              {unlocked ? ' · Próg BO osiągnięty' : ' · Zbieranie poparcia'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2.5">
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {unlocked ? '✓ Próg BO osiągnięty' : 'Zbieranie poparcia'}
        </span>
        <button
          type="button"
          data-testid="idea-details-toggle"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-ink)] text-[11px] font-bold border-0 cursor-pointer hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          {expanded ? (
            <>
              Zwiń <ChevronUp size={14} aria-hidden />
            </>
          ) : (
            <>
              Szczegóły <ChevronDown size={14} aria-hidden />
            </>
          )}
        </button>
      </div>
    </article>
  )
}
