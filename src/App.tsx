import { brand } from './theme/tokens'

function App() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="px-4 py-3 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-semibold m-0" style={{ color: 'var(--color-ideas)' }}>
            {brand.name}
          </h1>
          <p className="m-0 text-sm text-[var(--color-text)]/70">{brand.tagline}</p>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <section
          className="rounded-[var(--radius-card)] bg-white p-6 border border-black/5"
          aria-labelledby="scaffold-heading"
        >
          <h2 id="scaffold-heading" className="m-0 text-lg font-semibold">
            Szkielet aplikacji
          </h2>
          <p className="mt-2 mb-0 text-[var(--color-text)]/80">
            React + TypeScript + Vite + Tailwind. Kolejny krok: mapa Krakowa (Leaflet).
          </p>
        </section>
      </main>

      <nav
        className="md:hidden border-t border-black/5 bg-white px-2 py-2 grid grid-cols-4 gap-1 text-xs text-center"
        aria-label="Nawigacja dolna"
      >
        <span className="py-2 font-medium" style={{ color: 'var(--color-ideas)' }}>
          Mapa
        </span>
        <span className="py-2 text-[var(--color-text)]/60">Dodaj</span>
        <span className="py-2 text-[var(--color-text)]/60">Powiadomienia</span>
        <span className="py-2 text-[var(--color-text)]/60">Moje</span>
      </nav>
    </div>
  )
}

export default App
