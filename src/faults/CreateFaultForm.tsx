import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { demoAccounts } from '../auth/demoAccounts'
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
  const [category, setCategory] = useState('street_furniture')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState(initialPoint?.lat ?? 50.06143)
  const [lng, setLng] = useState(initialPoint?.lng ?? 19.93658)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    clearError()
    if (!user) {
      setFormError('Zaloguj się, aby zapisać usterkę.')
      return
    }
    if (description.trim().length < 10) {
      setFormError('Opis musi mieć co najmniej 10 znaków.')
      return
    }
    setSubmitting(true)
    try {
      const fault = await createFault(user.id, { category, description, lat, lng })
      onCreated(fault)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nie udało się zapisać.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6">
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
          Zgłoszenie fikcyjne do dema. Status jest społecznościowy, nie urzędowy.
        </p>

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
            {(authError || formError) && (
              <p className="mt-2 mb-0 text-sm" style={{ color: 'var(--color-faults)' }}>
                {authError ?? formError}
              </p>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Kategoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
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
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 resize-y"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Lat</span>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Lng</span>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting || !user}
            className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--color-faults)' }}
          >
            {submitting ? 'Zapisuję…' : 'Zapisz usterkę'}
          </button>
          {formError && user && (
            <p className="m-0 text-sm" style={{ color: 'var(--color-faults)' }}>
              {formError}
            </p>
          )}
        </form>
      </section>
    </div>
  )
}
