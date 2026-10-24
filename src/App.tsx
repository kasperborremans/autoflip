import { useRef, useState } from 'react'
import { backend, supabase } from './backend'
import { useAutos } from './useAutos'
import { exportJson, importJson } from './util'
import AuthGate from './components/AuthGate'
import Dashboard from './components/Dashboard'
import AutoLijst from './components/AutoLijst'
import Calculator from './components/Calculator'

type Tab = 'overzicht' | 'autos' | 'calculator'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'autos', label: "Auto's" },
  { id: 'calculator', label: 'Calculator' },
]

export default function App() {
  return <AuthGate>{(email) => <Hoofdscherm email={email} />}</AuthGate>
}

function Hoofdscherm({ email }: { email: string | null }) {
  const { autos, laden, fout, opslaan, verwijder, importeer } = useAutos()
  const [tab, setTab] = useState<Tab>('overzicht')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await importJson(file)
      if (confirm(`${data.length} auto's importeren? Auto's met hetzelfde id worden overschreven.`)) importeer(data)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>🚗 Autoflip</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="data-actions">
          <span className="badge" title={backend.mode === 'gedeeld' ? 'Gegevens worden gedeeld via Supabase' : 'Gegevens staan alleen in deze browser'}>
            {backend.mode === 'gedeeld' ? `☁️ ${email}` : '💾 Lokaal'}
          </span>
          <button className="ghost" onClick={() => exportJson(autos)}>Exporteren</button>
          <button className="ghost" onClick={() => fileRef.current?.click()}>Importeren</button>
          {supabase && <button className="ghost" onClick={() => supabase!.auth.signOut()}>Uitloggen</button>}
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        </div>
      </header>
      <main>
        {fout && <div className="card neg">Gegevens laden mislukt: {fout}</div>}
        {laden ? (
          <p className="muted">Laden…</p>
        ) : (
          <>
            {tab === 'overzicht' && <Dashboard autos={autos} />}
            {tab === 'autos' && <AutoLijst autos={autos} opslaan={opslaan} verwijder={verwijder} />}
            {tab === 'calculator' && <Calculator />}
          </>
        )}
      </main>
    </div>
  )
}
