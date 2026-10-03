import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, LocateFixed } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  { id: 'street_furniture', label: 'Mała architektura' },
  { id: 'waste', label: 'Odpady' },
  { id: 'lighting', label: 'Oświetlenie' },
  { id: 'pavement', label: 'Nawierzchnia' },
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
  const { user, loading: authLoading, error: authError, signInDemo, clearError } =
    useAuth()
  const online = useOnline()
  const [photo, setPhoto] = useState<File | null>(null)
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

  async function onSubmit(values: CreateFaultFormValues) {
    setFormError(null)
    clearError()
    if (!online) {
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
      onCreated(fault)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nie udało się zapisać.')
    }
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6 overflow-y-auto">
      <section className="rounded-[var(--radius-card)] bg-white p-5 border border-black/5">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h2 className="m-0 text-lg font-semibold">Dodaj usterkę</h2>
          <button
            type="button"
            onClick={onSwitchToIdea}
            className="border-0 bg-transparent cursor-pointer text-sm"
            style={{ color: 'var(--color-action)' }}
          >
            Przełącz na pomysł
          </button>
        </div>
        <p className="mt-0 mb-4 text-sm text-[var(--color-text)]/70">
          {copy.faultDisclaimer}
        </p>
        {!online && (
          <p className="mb-3 text-sm" style={{ color: 'var(--color-faults)' }}>
            {copy.offlineDraft}
          </p>
        )}

        {!user && (
          <div className="mb-4 p-3 rounded-[var(--radius-card)] bg-[var(--color-bg)]">
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
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Kategoria</span>
            <select
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              {...form.register('category')}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Opis</span>
            <textarea
              rows={3}
              className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <span className="text-xs" style={{ color: 'var(--color-faults)' }}>
                {form.formState.errors.description.message}
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Lat
              <input
                type="number"
                step="any"
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
                {...form.register('lat', { valueAsNumber: true })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Lng
              <input
                type="number"
                step="any"
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
                {...form.register('lng', { valueAsNumber: true })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium inline-flex items-center gap-1">
              <Camera size={16} /> Zdjęcie
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
              style={{ background: 'var(--color-faults)' }}
            >
              {form.formState.isSubmitting ? 'Zapisuję…' : 'Zapisz usterkę'}
            </button>
          </div>
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
