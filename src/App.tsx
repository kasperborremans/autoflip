import { useEffect, useRef, useState } from 'react'
import { backend, supabase } from './backend'
import { useAutos } from './useAutos'
import { exportJson, importJson } from './util'
import AuthGate from './components/AuthGate'
import Dashboard from './components/Dashboard'
import AutoLijst from './components/AutoLijst'
import Calculator from './components/Calculator'
import { IconAuto, IconCalculator, IconMeer, IconOverzicht } from './components/Iconen'

type Tab = 'overzicht' | 'autos' | 'calculator'

const TABS: { id: Tab; label: string; icoon: () => JSX.Element }[] = [
  { id: 'overzicht', label: 'Overzicht', icoon: IconOverzicht },
  { id: 'autos', label: "Auto's", icoon: IconAuto },
  { id: 'calculator', label: 'Calculator', icoon: IconCalculator },
]

export default function App() {
  return <AuthGate>{(email) => <Hoofdscherm email={email} />}</AuthGate>
}

function Hoofdscherm({ email }: { email: string | null }) {
  const { autos, laden, fout, opslaan, verwijder, importeer } = useAutos()
  const [tab, setTab] = useState<Tab>('overzicht')
  const [menu, setMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  useEffect(() => {
    if (!menu) return
    const sluit = () => setMenu(false)
    document.addEventListener('click', sluit)
    return () => document.removeEventListener('click', sluit)
  }, [menu])

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
        <h1><img className="logo" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" /> Autoflip</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="menu-wrap">
          <button className="ghost icon-knop" aria-label="Menu" onClick={(e) => { e.stopPropagation(); setMenu(!menu) }}>
            <IconMeer />
          </button>
          {menu && (
            <div className="menu card" onClick={(e) => e.stopPropagation()}>
              <div className="menu-info muted small">
                {backend.mode === 'gedeeld' ? `☁️ Ingelogd als ${email}` : '💾 Gegevens staan alleen in deze browser'}
              </div>
              <button className="menu-item" onClick={() => { exportJson(autos); setMenu(false) }}>Exporteren (reservekopie)</button>
              <button className="menu-item" onClick={() => { fileRef.current?.click(); setMenu(false) }}>Importeren</button>
              {supabase && <button className="menu-item neg" onClick={() => supabase!.auth.signOut()}>Uitloggen</button>}
            </div>
          )}
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
      <nav className="bottomnav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <t.icoon />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
