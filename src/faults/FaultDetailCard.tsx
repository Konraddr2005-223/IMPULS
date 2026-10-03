import { AlertTriangle, CheckCircle2, Clock, MapPin, X } from 'lucide-react'
import { publicPhotoUrl } from '../lib/storage'
import { copy } from '../ui/copy'
import { FAULT_STATUS_LABELS } from './api'
import type { FaultRecord } from './types'
import type { DemoFault } from '../data/demoContent'

export const FAULT_CATEGORY_LABELS: Record<string, string> = {
  street_furniture: 'Mała architektura',
  waste: 'Odpady',
  lighting: 'Oświetlenie',
  pavement: 'Nawierzchnia',
  other: 'Inne',
}

type FaultDetailCardProps = {
  fault: FaultRecord | DemoFault
  onClose: () => void
  onCheckLand?: () => void
}

export function FaultDetailCard({ fault, onClose, onCheckLand }: FaultDetailCardProps) {
  const isDemo = !('author_id' in fault)
  const categoryLabel = FAULT_CATEGORY_LABELS[fault.category] ?? fault.category
  const statusLabel =
    FAULT_STATUS_LABELS[fault.status] ??
    (fault.status in FAULT_STATUS_LABELS ? FAULT_STATUS_LABELS[fault.status] : fault.status)

  const photoPath = 'photo_path' in fault ? fault.photo_path : null
  const photoUrl = photoPath ? publicPhotoUrl(photoPath) : null
  const createdAt = 'created_at' in fault ? new Date(fault.created_at).toLocaleDateString('pl-PL') : null

  return (
    <aside
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-[380px] bottom-4 z-10 rounded-[var(--radius-card)] bg-white border border-black/10 shadow-xl p-4 max-h-[85vh] overflow-y-auto flex flex-col gap-3"
      aria-label="Szczegóły usterki"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded-full text-white"
            style={{ background: 'var(--color-faults)' }}
          >
            {categoryLabel}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-[var(--color-bg)] text-[var(--color-text)] font-medium border border-black/5">
            {fault.status === 'author_resolved' ? (
              <CheckCircle2 size={13} className="text-green-600" />
            ) : fault.status === 'community_confirmed' ? (
              <AlertTriangle size={13} className="text-amber-600" />
            ) : (
              <Clock size={13} className="text-gray-500" />
            )}
            {statusLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5 border-0 bg-transparent cursor-pointer"
          aria-label="Zamknij szczegóły usterki"
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <h3 className="m-0 text-base font-semibold text-[var(--color-text)]">
          {'title' in fault ? fault.title : fault.description.slice(0, 50)}
        </h3>
        <p className="mt-1 mb-0 text-sm text-[var(--color-text)]/85 whitespace-pre-wrap">
          {fault.description}
        </p>
      </div>

      {photoUrl && (
        <div className="rounded-lg overflow-hidden border border-black/5 max-h-48 bg-black/5">
          <img
            src={photoUrl}
            alt="Zdjęcie usterki"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--color-text)]/60 pt-1 border-t border-black/5">
        <span className="flex items-center gap-1">
          <MapPin size={13} />
          {fault.lat.toFixed(4)}, {fault.lng.toFixed(4)}
        </span>
        {createdAt && <span>Zgłoszono: {createdAt}</span>}
        {isDemo && <span className="font-medium text-amber-700">Wpis demo</span>}
      </div>

      <div className="rounded-lg bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]/75 border border-black/5">
        <p className="m-0 font-medium text-amber-800">Ważna informacja:</p>
        <p className="m-0 mt-0.5">{copy.faultDisclaimer}</p>
      </div>

      {onCheckLand && (
        <button
          type="button"
          onClick={onCheckLand}
          className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-black/10 bg-white hover:bg-[var(--color-bg)] cursor-pointer text-[var(--color-action)] transition-colors"
        >
          Sprawdź teren pod tym punktem
        </button>
      )}
    </aside>
  )
}
