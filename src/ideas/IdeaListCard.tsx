import { MapPin, ThumbsUp } from 'lucide-react'
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
  const meta = ideaVisualMeta(title, description)

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="idea-list-card"
      className={`w-full text-left border-0 cursor-pointer transition-all relative overflow-hidden rounded-xl p-3 ${
        selected
          ? 'bg-white ring-2 ring-[var(--color-primary)] shadow-md'
          : 'bg-white hover:bg-[var(--color-yellow-soft)] shadow-sm'
      }`}
    >
      {selected && (
        <span className="absolute top-0 left-0 bottom-0 w-1.5 bg-[var(--color-primary)]" />
      )}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.badgeClass}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {meta.label}
        </span>
        <span className="font-mono text-[11px] font-bold text-amber-800">{rankLabel}</span>
      </div>
      <h3 className="m-0 text-sm font-bold leading-snug text-[var(--color-text)] mb-2">
        {title}
      </h3>
      <div className="flex items-center gap-2.5 mb-2">
        <IdeaPhoto
          title={title}
          description={description}
          photoPath={photoPath}
          publicUrl={publicUrl}
          className="w-16 h-14 rounded-lg shrink-0"
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
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {unlocked ? '✓ Próg BO osiągnięty' : 'Zbieranie poparcia'}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-ink)] text-[11px] font-bold">
          Szczegóły
        </span>
      </div>
    </button>
  )
}
