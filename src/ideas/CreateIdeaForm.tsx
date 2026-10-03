import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { demoAccounts } from '../auth/demoAccounts'
import { krakowAdapter } from '../city'
import type { LandAssessment } from '../city/types'
import { createIdea } from './api'
import type { IdeaRecord } from './types'

type CreateIdeaFormProps = {
  initialPoint?: { lat: number; lng: number } | null
  onCreated: (idea: IdeaRecord) => void
}

export function CreateIdeaForm({ initialPoint, onCreated }: CreateIdeaFormProps) {
  const { user, loading: authLoading, error: authError, signInDemo, clearError } =
    useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'investment' | 'non_investment'>(
    'investment',
  )
  const [districtCode, setDistrictCode] = useState('')
  const [supportThreshold, setSupportThreshold] = useState(3)
  const [lat, setLat] = useState(initialPoint?.lat ?? 50.06143)
  const [lng, setLng] = useState(initialPoint?.lng ?? 19.93658)
  const [land, setLand] = useState<LandAssessment | null>(null)
  const [checkingLand, setCheckingLand] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function checkLand() {
    setCheckingLand(true)
    setFormError(null)
    try {
      setLand(await krakowAdapter.checkLocation({ lat, lng }))
    } catch {
      setFormError('Nie udało się sprawdzić terenu.')
    } finally {
      setCheckingLand(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)
    clearError()

    if (!user) {
      setFormError('Zaloguj się, aby zapisać pomysł.')
      return
    }

    if (title.trim().length < 3) {
      setFormError('Tytuł musi mieć co najmniej 3 znaki.')
      return
    }
    if (description.trim().length < 20) {
      setFormError('Opis musi mieć co najmniej 20 znaków.')
      return
    }

    setSubmitting(true)
    try {
      if (!land) {
        await checkLand()
      }
      const idea = await createIdea(user.id, {
        title,
        description,
        category,
        lat,
        lng,
        districtCode,
        supportThreshold,
      })
      setSuccess('Pomysł zapisany w bazie.')
      setTitle('')
      setDescription('')
      onCreated(idea)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nie udało się zapisać.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6">
      <section
        className="rounded-[var(--radius-card)] bg-white p-5 border border-black/5"
        aria-labelledby="create-idea-heading"
      >
        <h2 id="create-idea-heading" className="m-0 text-lg font-semibold">
          Dodaj pomysł
        </h2>
        <p className="mt-2 mb-4 text-sm text-[var(--color-text)]/70">
          Fikcyjny wpis demonstracyjny. Nie zgłaszaj rzeczywistych problemów lokalnych
          bez kontekstu prezentacji.
        </p>

        {!user && (
          <div className="mb-4 p-3 rounded-[var(--radius-card)] bg-[var(--color-bg)]">
            <p className="m-0 mb-2 text-sm font-medium">Konto prezentacyjne</p>
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
            <span className="font-medium">Tytuł</span>
            <input
              required
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Opis</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-card)] border border-black/10 bg-white resize-y"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Kategoria</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as 'investment' | 'non_investment')
              }
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white"
            >
              <option value="investment">Inwestycyjny</option>
              <option value="non_investment">Nieinwestycyjny</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Dzielnica (opcjonalnie)</span>
            <input
              value={districtCode}
              onChange={(e) => setDistrictCode(e.target.value)}
              placeholder="np. Krowodrza"
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Szerokość (lat)</span>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Długość (lng)</span>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Próg zainteresowania (lajki)</span>
            <input
              type="number"
              min={1}
              max={50}
              value={supportThreshold}
              onChange={(e) => setSupportThreshold(Number(e.target.value))}
              className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 bg-white"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={checkLand}
              disabled={checkingLand}
              className="min-h-11 px-4 rounded-[var(--radius-card)] border border-black/10 bg-[var(--color-bg)] text-sm font-medium cursor-pointer"
            >
              {checkingLand ? 'Sprawdzam…' : 'Sprawdź teren'}
            </button>
            <button
              type="submit"
              disabled={submitting || authLoading || !user}
              className="min-h-11 px-4 rounded-[var(--radius-card)] border-0 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-ideas)' }}
            >
              {submitting ? 'Zapisuję…' : 'Zapisz pomysł'}
            </button>
          </div>

          {land && (
            <p className="m-0 text-sm text-[var(--color-text)]/75">
              Teren: {land.assessment}
              {land.scenarioDescription ? ` — ${land.scenarioDescription}` : ''}
            </p>
          )}
          {formError && user && (
            <p className="m-0 text-sm" style={{ color: 'var(--color-faults)' }}>
              {formError}
            </p>
          )}
          {success && (
            <p className="m-0 text-sm" style={{ color: 'var(--color-ideas)' }}>
              {success}
            </p>
          )}
        </form>
      </section>
    </div>
  )
}
