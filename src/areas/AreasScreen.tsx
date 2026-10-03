import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPinned, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getCurrentPosition } from '../lib/geolocation'
import { LocationPicker } from '../map/LocationPicker'
import { copy } from '../ui/copy'
import {
  KRAKOW_DISTRICTS,
  createDistrictArea,
  createRadiusArea,
  deleteInterestArea,
  listInterestAreas,
} from './api'

type AreasScreenProps = {
  draftPoint?: { lat: number; lng: number } | null
}

export function AreasScreen({ draftPoint }: AreasScreenProps) {
  const { user, openAuthModal } = useAuth()
  const qc = useQueryClient()
  const [district, setDistrict] = useState<string>(KRAKOW_DISTRICTS[4])
  const [radiusName, setRadiusName] = useState('Moja okolica')
  const [radiusM, setRadiusM] = useState(500)
  const [lat, setLat] = useState(draftPoint?.lat ?? 50.06143)
  const [lng, setLng] = useState(draftPoint?.lng ?? 19.93658)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (draftPoint) {
      setLat(draftPoint.lat)
      setLng(draftPoint.lng)
    }
  }, [draftPoint])

  async function handleGps() {
    setLocating(true)
    setError(null)
    const pos = await getCurrentPosition()
    setLocating(false)
    if (!pos.ok) {
      setError(copy.gpsDenied)
      return
    }
    setLat(pos.lat)
    setLng(pos.lng)
  }

  const query = useQuery({
    queryKey: ['areas', user?.id],
    enabled: Boolean(user),
    queryFn: () => listInterestAreas(user!.id),
  })

  if (!user) {
    return (
      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
        <section className="rounded-[var(--radius-card)] bg-white p-6 border border-black/5 shadow-xs">
          <h2 className="m-0 text-lg font-semibold">Moje okolice</h2>
          <p className="mt-2 mb-4 text-sm text-[var(--color-text)]/70">
            Zaloguj się, aby zapisać swoje ulubione dzielnice i promienie zainteresowania na mapie.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="min-h-10 px-4 rounded-xl border-0 text-white text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90 inline-flex items-center gap-1.5"
              style={{ background: 'var(--color-action)' }}
            >
              Zaloguj się
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="min-h-10 px-4 rounded-xl border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold cursor-pointer text-[var(--color-text)] inline-flex items-center gap-1.5"
            >
              Zarejestruj się
            </button>
          </div>
        </section>
      </div>
    )
  }

  async function refresh() {
    if (!user) return
    await qc.invalidateQueries({ queryKey: ['areas', user.id] })
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-xl px-4 py-6 overflow-y-auto">
      <h2 className="m-0 text-lg font-semibold flex items-center gap-2">
        <MapPinned size={20} aria-hidden /> Moje okolice
      </h2>
      <p className="mt-1 mb-4 text-sm text-[var(--color-text)]/65">
        Dzielnice z listy lub punkt z promieniem 50–2000 m. Filtr mapy łączy obszary operatorem
        OR. Granice dzielnic nie są rysowane jako oficjalne kształty.
      </p>

      <section className="rounded-[var(--radius-card)] bg-white p-4 border border-black/5 mb-4">
        <h3 className="m-0 text-sm font-semibold">Dzielnica</h3>
        <div className="mt-2 flex gap-2">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="flex-1 min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10"
          >
            {KRAKOW_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="min-h-11 px-3 rounded-[var(--radius-card)] border-0 text-white text-sm cursor-pointer"
            style={{ background: 'var(--color-ideas)' }}
            onClick={async () => {
              setError(null)
              try {
                await createDistrictArea(user.id, district)
                await refresh()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Błąd zapisu')
              }
            }}
          >
            Dodaj
          </button>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-4 border border-black/5 mb-4 space-y-3">
        <h3 className="m-0 text-sm font-semibold">Punkt i promień</h3>
        <label className="flex flex-col gap-1 text-sm">
          Nazwa okolicy
          <input
            value={radiusName}
            onChange={(e) => setRadiusName(e.target.value)}
            placeholder="np. Moja okolica, Praca, Park"
            className="min-h-11 px-3 rounded-[var(--radius-card)] border border-black/10 text-sm"
          />
        </label>

        <div>
          <LocationPicker
            value={{ lat, lng }}
            onChange={(pt) => {
              setLat(pt.lat)
              setLng(pt.lng)
            }}
            radiusM={radiusM}
            onRadiusChange={setRadiusM}
            minRadius={50}
            maxRadius={2000}
            onGetGps={handleGps}
            locating={locating}
            accentColor="#176B4B"
            label="Wskaż środek okolicy na mapie"
            hint="Kliknij na mapie, aby ustawić centrum. Użyj suwaka poniżej, aby dobrać promień."
          />
        </div>

        {/* Hidden inputs to preserve form semantics */}
        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lng" value={lng} />
        <input type="hidden" name="radiusM" value={radiusM} />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="min-h-11 px-5 rounded-[var(--radius-card)] border-0 text-white text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--color-action)' }}
            onClick={async () => {
              setError(null)
              try {
                await createRadiusArea(user.id, radiusName, lat, lng, radiusM)
                await refresh()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Błąd zapisu')
              }
            }}
          >
            Zapisz okolicę
          </button>
        </div>
      </section>

      {error && (
        <p className="text-sm mb-3" style={{ color: 'var(--color-faults)' }}>
          {error}
        </p>
      )}

      <ul className="m-0 p-0 list-none">
        {(query.data ?? []).map((area) => (
          <li
            key={area.id}
            className="flex items-center justify-between gap-2 border border-black/5 rounded-[var(--radius-card)] bg-white px-4 py-3 mb-2"
          >
            <div>
              <p className="m-0 font-medium text-sm">{area.name}</p>
              <p className="m-0 text-xs text-[var(--color-text)]/60">
                {area.kind === 'district'
                  ? `Dzielnica: ${area.district_code}`
                  : `Promień ${area.radius_m} m · ${area.lat?.toFixed(4)}, ${area.lng?.toFixed(4)}`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Usuń okolicę"
              className="border-0 bg-transparent cursor-pointer"
              onClick={async () => {
                await deleteInterestArea(area.id, user.id)
                await refresh()
              }}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
