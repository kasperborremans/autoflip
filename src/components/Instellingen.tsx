import { useRef } from 'react'
import type { Auto } from '../types'
import { backend, supabase } from '../backend'
import { useThema, type Thema } from '../thema'
import { exportJson, importJson } from '../util'
import Keuze from './Keuze'

interface Props {
  autos: Auto[]
  email: string | null
  importeer: (autos: Auto[]) => void
}

const THEMAS: { waarde: Thema; label: string }[] = [
  { waarde: 'licht', label: '☀️ Licht' },
  { waarde: 'donker', label: '🌙 Donker' },
  { waarde: 'systeem', label: 'Automatisch' },
]

export default function Instellingen({ autos, email, importeer }: Props) {
  const [thema, kiesThema] = useThema()
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
    <section className="stack">
      <div className="card stack">
        <h2>Weergave</h2>
        <Keuze label="Thema" waarde={thema} opties={THEMAS} onChange={kiesThema} />
        <small className="muted">Automatisch volgt de instelling van je telefoon.</small>
      </div>

      <div className="card stack">
        <h2>Account</h2>
        {backend.mode === 'gedeeld' ? (
          <>
            <div className="instelling-rij"><span className="muted">Ingelogd als</span><strong className="breek">{email}</strong></div>
            <button className="danger" onClick={() => confirm('Uitloggen?') && supabase!.auth.signOut()}>Uitloggen</button>
          </>
        ) : (
          <p className="muted">De gegevens staan alleen in deze browser; er is geen gedeelde database ingesteld.</p>
        )}
      </div>

      <div className="card stack">
        <h2>Gegevens</h2>
        <div className="instelling-rij"><span className="muted">Auto's</span><strong>{autos.length}</strong></div>
        <button className="ghost" onClick={() => exportJson(autos)}>Reservekopie downloaden</button>
        <button className="ghost" onClick={() => fileRef.current?.click()}>Reservekopie terugzetten</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        <small className="muted">De reservekopie bevat de gegevens van de auto's, niet de foto's.</small>
      </div>
    </section>
  )
}
