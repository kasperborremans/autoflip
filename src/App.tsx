import { useEffect, useState } from 'react'
import { useAutos } from './useAutos'
import { useNavKlein } from './useNavKlein'
import AuthGate from './components/AuthGate'
import Dashboard from './components/Dashboard'
import AutoLijst from './components/AutoLijst'
import Calculator from './components/Calculator'
import Verdeling from './components/Verdeling'
import Instellingen from './components/Instellingen'
import { IconAuto, IconCalculator, IconInstellingen, IconOverzicht, IconVerdeling } from './components/Iconen'

type Tab = 'overzicht' | 'autos' | 'verdeling' | 'calculator' | 'instellingen'

const TABS: { id: Tab; label: string; icoon: () => JSX.Element }[] = [
  { id: 'overzicht', label: 'Overzicht', icoon: IconOverzicht },
  { id: 'autos', label: "Auto's", icoon: IconAuto },
  { id: 'verdeling', label: 'Verdeling', icoon: IconVerdeling },
  { id: 'calculator', label: 'Calculator', icoon: IconCalculator },
  { id: 'instellingen', label: 'Instellingen', icoon: IconInstellingen },
]

export default function App() {
  return <AuthGate>{(email) => <Hoofdscherm email={email} />}</AuthGate>
}

function Hoofdscherm({ email }: { email: string | null }) {
  const { autos, laden, fout, opslaan, verwijder, importeer } = useAutos()
  const [tab, setTab] = useState<Tab>('overzicht')
  const [navKlein, setNavKlein] = useNavKlein()

  useEffect(() => {
    window.scrollTo(0, 0)
    setNavKlein(false)
  }, [tab, setNavKlein])

  const titel = TABS.find((t) => t.id === tab)!.label

  return (
    <div className={`app ${navKlein ? 'nav-klein' : ''}`}>
      <header className="topbar">
        <h1>
          <img className="logo" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <span className="alleen-desktop">Autoflip</span>
          <span className="alleen-mobiel">{titel}</span>
        </h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {fout && <div className="card neg">Gegevens laden mislukt: {fout}</div>}
        {laden ? (
          <p className="muted">Laden…</p>
        ) : (
          <>
            {tab === 'overzicht' && <Dashboard autos={autos} />}
            {tab === 'autos' && <AutoLijst autos={autos} opslaan={opslaan} verwijder={verwijder} />}
            {tab === 'verdeling' && <Verdeling autos={autos} opslaan={opslaan} />}
            {tab === 'calculator' && <Calculator autos={autos} />}
            {tab === 'instellingen' && <Instellingen autos={autos} email={email} importeer={importeer} />}
          </>
        )}
      </main>
      <nav className={`bottomnav ${navKlein ? 'klein' : ''}`}>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-label={t.label}>
            <span className="nav-icoon"><t.icoon /></span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
