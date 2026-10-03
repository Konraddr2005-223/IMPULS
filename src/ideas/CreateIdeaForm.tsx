import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, LocateFixed } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../auth/AuthContext'
import { demoAccounts } from '../auth/demoAccounts'
import { getCurrentPosition } from '../lib/geolocation'
import {
  clearOfflineDraft,
  loadOfflineDraft,
  saveOfflineDraft,
} from '../lib/offlineDraft'
import { useOnline } from '../lib/online'
import { uploadPhoto } from '../lib/storage'
import { copy } from '../ui/copy'
import { createIdea } from './api'
import { createIdeaSchema, type CreateIdeaFormValues } from './schemas'
import type { IdeaRecord } from './types'

type CreateIdeaFormProps = {
  initialPoint?: { lat: number; lng: number } | null
  onCreated: (idea: IdeaRecord) => void
  onSwitchToFault?: () => void
}

export function CreateIdeaForm({
  initialPoint,
  onCreated,
  onSwitchToFault,
}: CreateIdeaFormProps) {
  const { user, loading: authLoading, error: authError, signInDemo, clearError } =
    useAuth()
  const online = useOnline()
  const [photo, setPhoto] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<CreateIdeaFormValues>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'investment',
      districtCode: 'Krowodrza',
      supportThreshold: 3,
      lat: initialPoint?.lat ?? 50.06143,
      lng: initialPoint?.lng ?? 19.93658,
    },
  })

  useEffect(() => {
    const draft = loadOfflineDraft<CreateIdeaFormValues & { savedAt?: string }>(
      'idea',
      user?.id ?? null,
    )
    if (draft) {
      form.reset({
        title: draft.title ?? '',
        description: draft.description ?? '',
        category: draft.category ?? 'investment',
        districtCode: draft.districtCode ?? 'Krowodrza',
        supportThreshold: draft.supportThreshold ?? 3,
        lat: draft.lat ?? initialPoint?.lat ?? 50.06143,
        lng: draft.lng ?? initialPoint?.lng ?? 19.93658,
      })
    }
  }, [user?.id, form, initialPoint])

  async function onSubmit(values: CreateIdeaFormValues) {
    setFormError(null)
    clearError()
    if (!online) {
      saveOfflineDraft('idea', user?.id ?? null, values)
      setFormError(copy.offlineDraft)
      return
    }
    if (!user) {
      setFormError('Zaloguj się, aby zapisać pomysł.')
      return
    }

    try {
      let photoPath: string | null = null
      if (photo) {
        photoPath = await uploadPhoto(user.id, photo, 'ideas')
      }
      const idea = await createIdea(user.id, {
        ...values,
        districtCode: values.districtCode,
        photoPath,
      })
      clearOfflineDraft('idea', user.id)
      onCreated(idea)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nie udało się zapisać.')
    }
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6 overflow-y-auto">
      <section className="rounded-[var(--radius-card)] bg-white p-5 border border-black/5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="m-0 text-lg font-semibold">Dodaj pomysł</h2>
          {onSwitchToFault && (
            <button
              type="button"
              onClick={onSwitchToFault}
              className="border-0 bg-transparent cursor-pointer text-sm"
              style={{ color: 'var(--color-faults)' }}
            >
              Przełącz na usterkę
            </button>
          )}
        </div>
        <p className="mt-2 mb-4 text-sm text-[var(--color-text)]/70">
          Fikcyjny wpis demonstracyjny. {copy.templateStale}
        </p>
        {!online && (
          <p className="mb-3 text-sm" style={{ color: 'var(--color-faults)' }}>
            {copy.offlineDraft}
          </p>
        )}

        {!user && (
          <div className="mb-4 p-3 rounded-[var(--radius-card)] bg-[var(--color-bg)]">
            <p className="m-0 mb-2 text-xs">{copy.authNote}</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.key}
                  type="button"
                  disabled={authLoading}
                  onClick={() => signInDemo(account.key)}
                  className="min-h-11 px-3 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--color-action)' }}
                >
                  {account.label}
                </button>
              ))}
            </div>
            {authError && (
              <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
                {authError}
              </p>
            )}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Field label="Tytuł" error={form.formState.errors.title?.message}>
            <input
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              {...form.register('title')}
            />
          </Field>
          <Field label="Opis" error={form.formState.errors.description?.message}>
            <textarea
              rows={4}
              className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y"
              {...form.register('description')}
            />
          </Field>
          <Field label="Kategoria">
            <select
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              {...form.register('category')}
            >
              <option value="investment">Inwestycyjny</option>
              <option value="non_investment">Nieinwestycyjny</option>
            </select>
          </Field>
          <Field label="Dzielnica">
            <input
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              {...form.register('districtCode')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lat" error={form.formState.errors.lat?.message}>
              <input
                type="number"
                step="any"
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
                {...form.register('lat', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Lng" error={form.formState.errors.lng?.message}>
              <input
                type="number"
                step="any"
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
                {...form.register('lng', { valueAsNumber: true })}
              />
            </Field>
          </div>
          <Field label="Próg zainteresowania" error={form.formState.errors.supportThreshold?.message}>
            <input
              type="number"
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              {...form.register('supportThreshold', { valueAsNumber: true })}
            />
          </Field>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium inline-flex items-center gap-1">
              <Camera size={16} /> Zdjęcie (opcjonalnie)
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 px-4 inline-flex items-center gap-2 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm cursor-pointer"
              onClick={async () => {
                const pos = await getCurrentPosition()
                if (!pos.ok) {
                  setFormError(copy.gpsDenied)
                  return
                }
                form.setValue('lat', pos.lat)
                form.setValue('lng', pos.lng)
              }}
            >
              <LocateFixed size={16} /> GPS
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting || !user || !online}
              className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-ideas)' }}
            >
              {form.formState.isSubmitting ? 'Zapisuję…' : 'Zapisz pomysł'}
            </button>
          </div>
          <p className="m-0 text-xs text-[var(--color-text)]/60">{copy.landDisclaimer}</p>
          {formError && (
            <p className="m-0 text-sm" style={{ color: 'var(--color-faults)' }}>
              {formError}
            </p>
          )}
        </form>
      </section>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && (
        <span className="text-xs" style={{ color: 'var(--color-faults)' }}>
          {error}
        </span>
      )}
    </label>
  )
}
