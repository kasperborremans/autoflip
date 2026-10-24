import { useRef, useState } from 'react'
import { exportJson, importJson, useAutos } from './storage'
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
  const [autos, setAutos] = useAutos()
  const [tab, setTab] = useState<Tab>('overzicht')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await importJson(file)
      if (confirm(`${data.length} auto's importeren? Dit vervangt de huidige gegevens.`)) setAutos(data)
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
          <button className="ghost" onClick={() => exportJson(autos)}>Exporteren</button>
          <button className="ghost" onClick={() => fileRef.current?.click()}>Importeren</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        </div>
      </header>
      <main>
        {tab === 'overzicht' && <Dashboard autos={autos} />}
        {tab === 'autos' && <AutoLijst autos={autos} setAutos={setAutos} />}
        {tab === 'calculator' && <Calculator />}
      </main>
    </div>
  )
}
