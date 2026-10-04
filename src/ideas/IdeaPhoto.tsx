import { resolveIdeaImageUrl, ideaVisualMeta } from './ideaVisuals'

type IdeaPhotoProps = {
  title: string
  description?: string
  photoPath?: string | null
  publicUrl?: string | null
  alt?: string
  className?: string
  imgClassName?: string
}

/** Always shows a photo — real upload or category placeholder. */
export function IdeaPhoto({
  title,
  description,
  photoPath,
  publicUrl,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
}: IdeaPhotoProps) {
  const src = resolveIdeaImageUrl({
    photo_path: photoPath,
    title,
    description,
    publicUrl,
  })
  const meta = ideaVisualMeta(title, description)

  return (
    <div
      className={`relative overflow-hidden bg-[var(--color-yellow-soft)] ${className}`}
    >
      <img
        src={src}
        alt={alt ?? title}
        className={imgClassName}
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget
          const fallback = `/placeholders/idea-${meta.kind}.svg`
          if (!el.src.endsWith(fallback)) el.src = fallback
        }}
      />
    </div>
  )
}
