import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Check, LocateFixed, LogIn, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../auth/AuthContext'
import { demoAccounts } from '../auth/demoAccounts'
import { createFaultSchema, type CreateFaultFormValues } from '../ideas/schemas'
import { getCurrentPosition } from '../lib/geolocation'
import {
  clearOfflineDraft,
  loadOfflineDraft,
  saveOfflineDraft,
} from '../lib/offlineDraft'
import { useOnline } from '../lib/online'
import { uploadPhoto } from '../lib/storage'
import { copy } from '../ui/copy'
import { createFault } from './api'
import type { FaultRecord } from './types'

const CATEGORIES = [
  { id: 'street_furniture', label: 'Mała architektura (ławki, wiaty)' },
  { id: 'waste', label: 'Odpady i kosze' },
  { id: 'lighting', label: 'Oświetlenie uliczne' },
  { id: 'pavement', label: 'Nawierzchnia (chodnik, ścieżka)' },
  { id: 'other', label: 'Inne' },
]

type CreateFaultFormProps = {
  initialPoint?: { lat: number; lng: number } | null
  onCreated: (fault: FaultRecord) => void
  onSwitchToIdea: () => void
}

export function CreateFaultForm({
  initialPoint,
  onCreated,
  onSwitchToIdea,
}: CreateFaultFormProps) {
  const {
    user,
    loading: authLoading,
    error: authError,
    signInDemo,
    clearError,
    openAuthModal,
  } = useAuth()
  const online = useOnline()
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<CreateFaultFormValues>({
    resolver: zodResolver(createFaultSchema),
    defaultValues: {
      category: 'street_furniture',
      description: '',
      lat: initialPoint?.lat ?? 50.06143,
      lng: initialPoint?.lng ?? 19.93658,
    },
  })

  useEffect(() => {
    const draft = loadOfflineDraft<CreateFaultFormValues>('fault', user?.id ?? null)
    if (draft) {
      form.reset({
        category: draft.category ?? 'street_furniture',
        description: draft.description ?? '',
        lat: draft.lat ?? initialPoint?.lat ?? 50.06143,
        lng: draft.lng ?? initialPoint?.lng ?? 19.93658,
      })
    } else if (initialPoint) {
      form.setValue('lat', initialPoint.lat)
      form.setValue('lng', initialPoint.lng)
    }
  }, [user?.id, form, initialPoint])

  useEffect(() => {
    if (initialPoint) {
      form.setValue('lat', initialPoint.lat)
      form.setValue('lng', initialPoint.lng)
    }
  }, [initialPoint, form])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const descVal = form.watch('description') ?? ''

  async function handleGetLocation() {
    setLocating(true)
    setFormError(null)
    try {
      const pos = await getCurrentPosition()
      if (!pos.ok) {
        setFormError(copy.gpsDenied)
        return
      }
      form.setValue('lat', Number(pos.lat.toFixed(5)))
      form.setValue('lng', Number(pos.lng.toFixed(5)))
    } catch {
      setFormError(copy.gpsDenied)
    } finally {
      setLocating(false)
    }
  }

  async function onSubmit(values: CreateFaultFormValues) {
    setFormError(null)
    clearError()
    if (!online) {
      saveOfflineDraft('fault', user?.id ?? null, values)
      setFormError(copy.offlineDraft)
      return
    }
    if (!user) {
      setFormError('Zaloguj się, aby zapisać usterkę.')
      return
    }
    try {
      let photoPath: string | null = null
      if (photo) {
        photoPath = await uploadPhoto(user.id, photo, 'faults')
      }
      const fault = await createFault(user.id, { ...values, photoPath })
      clearOfflineDraft('fault', user.id)
      onCreated(fault)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nie udało się zapisać.')
    }
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6 overflow-y-auto">
      <section className="rounded-[var(--radius-card)] bg-white p-5 border border-black/5 shadow-sm">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h2 className="m-0 text-lg font-semibold text-[var(--color-text)]">Dodaj usterkę</h2>
          <button
            type="button"
            onClick={onSwitchToIdea}
            className="border-0 bg-transparent cursor-pointer text-sm font-medium hover:underline"
            style={{ color: 'var(--color-ideas)' }}
          >
            Przełącz na pomysł →
          </button>
        </div>
        <p className="mt-0 mb-4 text-xs text-[var(--color-text)]/70">
          Zgłoszenie problemu w przestrzeni sąsiedzkiej.
        </p>

        {!online && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
            {copy.offlineDraft}
          </div>
        )}

        {!user && (
          <div className="mb-4 p-4 rounded-[var(--radius-card)] bg-[var(--color-bg)] border border-black/5">
            <p className="m-0 mb-1 text-xs font-semibold text-[var(--color-text)]">
              Wymagane logowanie do zgłoszenia usterki
            </p>
            <p className="m-0 mb-3 text-xs text-[var(--color-text)]/70">
              Przeglądanie mapy nie wymaga konta. Zaloguj się lub załóż konto, aby zgłosić usterkę.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="min-h-10 px-3.5 rounded-lg border-0 text-white text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90 inline-flex items-center gap-1.5"
                style={{ background: 'var(--color-faults)' }}
              >
                <LogIn size={14} />
                Zaloguj się
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="min-h-10 px-3.5 rounded-lg border border-black/15 bg-white hover:bg-black/5 text-xs font-medium cursor-pointer text-[var(--color-text)] inline-flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                Zarejestruj się
              </button>
              <span className="text-xs text-[var(--color-text)]/40 px-0.5">lub demo:</span>
              {demoAccounts.map((account) => (
                <button
                  key={account.key}
                  type="button"
                  disabled={authLoading}
                  onClick={() => signInDemo(account.key)}
                  className="min-h-9 px-2.5 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-xs font-medium cursor-pointer text-[var(--color-text)]/80"
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="m-0 mt-2.5 text-[10px] text-[var(--color-text)]/55">{copy.authNote}</p>
            {authError && (
              <p className="mt-2 mb-0 text-xs text-red-600 font-medium">{authError}</p>
            )}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Kategoria problemu">
            <select
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white text-sm"
              {...form.register('category')}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Opis usterki"
            hint={`${descVal.length} znaków (min. 10)`}
            error={form.formState.errors.description?.message}
          >
            <textarea
              rows={4}
              placeholder="np. Połamana ławka przy alejce parkowej, wystające ostre elementy..."
              className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y focus:outline-[var(--color-faults)] text-sm"
              {...form.register('description')}
            />
          </Field>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Lokalizacja na mapie</span>
              <button
                type="button"
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-black/10 bg-[var(--color-bg)] hover:bg-black/5 cursor-pointer text-[var(--color-action)] font-medium"
                onClick={handleGetLocation}
              >
                <LocateFixed size={14} className={locating ? 'animate-spin' : ''} />
                {locating ? 'Pobieranie GPS…' : 'Użyj GPS'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Szerokość (Lat)" error={form.formState.errors.lat?.message}>
                <input
                  type="number"
                  step="any"
                  className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 font-mono text-sm"
                  {...form.register('lat', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Długość (Lng)" error={form.formState.errors.lng?.message}>
                <input
                  type="number"
                  step="any"
                  className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 font-mono text-sm"
                  {...form.register('lng', { valueAsNumber: true })}
                />
              </Field>
            </div>
            {initialPoint && (
              <p className="m-0 text-[11px] text-[var(--color-faults)] font-medium flex items-center gap-1">
                <Check size={12} /> Pobrano punkt wskazany kliknięciem na mapie.
              </p>
            )}
          </div>

          {/* Photo upload */}
          <div className="space-y-1.5 text-sm">
            <span className="font-medium inline-flex items-center gap-1">
              <Camera size={16} /> Zdjęcie usterki (opcjonalnie)
            </span>
            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-black/10 max-h-48 w-full bg-black/5">
                <img
                  src={photoPreview}
                  alt="Podgląd zdjęcia usterki"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-600 border border-black/10 shadow-sm cursor-pointer hover:bg-white"
                  aria-label="Usuń zdjęcie"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-black/20 rounded-lg p-4 cursor-pointer hover:bg-[var(--color-bg)] transition-colors">
                <Camera size={24} className="text-[var(--color-text)]/40 mb-1" />
                <span className="text-xs text-[var(--color-text)]/70">
                  Zrób zdjęcie telefonem lub wybierz plik z galerii
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <div className="rounded-lg bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)]/75 border border-black/5">
            <span className="font-semibold block text-amber-800">Ważna uwaga:</span>
            {copy.faultDisclaimer}
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={form.formState.isSubmitting || !user || !online}
              className="min-h-11 w-full rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer shadow-md disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--color-faults)' }}
            >
              {form.formState.isSubmitting ? 'Zapisuję usterkę…' : 'Zgłoś usterkę na mapie'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[var(--color-text)]">{label}</span>
        {hint && <span className="text-xs text-[var(--color-text)]/50 font-normal">{hint}</span>}
      </div>
      {children}
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </label>
  )
}
