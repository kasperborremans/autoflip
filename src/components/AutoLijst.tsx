import { useState } from 'react'
import type { Auto, Status } from '../types'
import { STATUS_LABELS } from '../types'
import { dagenInBezit, euro, geinvesteerd, winst } from '../calc'
import { useMobiel } from '../useMobiel'
import AutoForm from './AutoForm'
import Foto from './Foto'
import { IconPlus, IconZoek } from './Iconen'

interface Props {
  autos: Auto[]
  opslaan: (a: Auto) => void
  verwijder: (a: Auto) => void
}

const STATUSSEN = Object.keys(STATUS_LABELS) as Status[]

export default function AutoLijst({ autos, opslaan, verwijder }: Props) {
  const [filter, setFilter] = useState<Status | 'alle'>('alle')
  const [zoek, setZoek] = useState('')
  const [bewerk, setBewerk] = useState<Auto | 'nieuw' | null>(null)
  const mobiel = useMobiel()

  const term = zoek.trim().toLowerCase()
  const zichtbaar = autos
    .filter((a) => filter === 'alle' || a.status === filter)
    .filter((a) => !term || [a.merk, a.model, a.kenteken, a.bouwjaar].some((v) => String(v ?? '').toLowerCase().includes(term)))
    .sort((a, b) => b.aankoopdatum.localeCompare(a.aankoopdatum))

  const aantal = (s: Status | 'alle') => (s === 'alle' ? autos.length : autos.filter((a) => a.status === s).length)

  return (
    <section className="stack">
      <div className="toolbar">
        <label className="zoek">
          <IconZoek />
          <input type="search" placeholder="Zoek merk, model of kenteken" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        </label>
        {!mobiel && <button onClick={() => setBewerk('nieuw')}>+ Nieuwe auto</button>}
      </div>

      <div className="chips">
        {(['alle', ...STATUSSEN] as const).map((s) => (
          <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'alle' ? 'Alle' : STATUS_LABELS[s]} <span className="muted">{aantal(s)}</span>
          </button>
        ))}
      </div>

      {zichtbaar.length === 0 ? (
        <div className="card muted">{autos.length ? "Geen auto's gevonden." : 'Nog geen auto\'s. Tik op + om je eerste auto toe te voegen.'}</div>
      ) : mobiel ? (
        <div className="auto-kaarten">
          {zichtbaar.map((a) => <AutoKaart key={a.id} auto={a} onClick={() => setBewerk(a)} />)}
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th className="foto-kolom"></th><th>Auto</th><th>Status</th><th className="num">Geïnvesteerd</th>
                <th className="num">Vraag / verkoop</th><th className="num">Winst</th><th className="num">Dagen</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((a) => {
                const w = winst(a)
                return (
                  <tr key={a.id} className="clickable" onClick={() => setBewerk(a)}>
                    <td className="foto-kolom">{a.fotos[0] ? <Foto path={a.fotos[0]} className="thumb" /> : <div className="thumb foto-leeg">🚗</div>}</td>
                    <td>
                      <strong>{a.merk} {a.model}</strong>
                      <div className="muted small">{[a.bouwjaar, a.kenteken].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td><span className={`badge s-${a.status}`}>{STATUS_LABELS[a.status]}</span></td>
                    <td className="num">{euro(geinvesteerd(a))}</td>
                    <td className="num">{euro((a.status === 'verkocht' ? a.verkoopprijs : a.vraagprijs) ?? 0)}</td>
                    <td className={`num ${w === undefined ? 'muted' : w >= 0 ? 'pos' : 'neg'}`}>
                      {w === undefined ? '—' : euro(w)}
                    </td>
                    <td className="num">{dagenInBezit(a)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {mobiel && (
        <button className="fab" aria-label="Nieuwe auto" onClick={() => setBewerk('nieuw')}>
          <IconPlus />
        </button>
      )}

      {bewerk && (
        <AutoForm
          auto={bewerk === 'nieuw' ? undefined : bewerk}
          onSave={(a) => { opslaan(a); setBewerk(null) }}
          onDelete={(a) => { verwijder(a); setBewerk(null) }}
          onClose={() => setBewerk(null)}
        />
      )}
    </section>
  )
}

function AutoKaart({ auto: a, onClick }: { auto: Auto; onClick: () => void }) {
  const w = winst(a)
  return (
    <button className="auto-kaart card" onClick={onClick}>
      {a.fotos[0] ? <Foto path={a.fotos[0]} className="kaart-foto" /> : <div className="kaart-foto foto-leeg">🚗</div>}
      <div className="kaart-midden">
        <strong className="kaart-titel">{a.merk} {a.model}</strong>
        <span className="muted small">{[a.bouwjaar, a.kenteken].filter(Boolean).join(' · ') || ' '}</span>
        <span className={`badge s-${a.status}`}>{STATUS_LABELS[a.status]}</span>
      </div>
      <div className="kaart-rechts">
        <strong className={w === undefined ? 'muted' : w >= 0 ? 'pos' : 'neg'}>{w === undefined ? '—' : euro(w)}</strong>
        <span className="muted small">{a.status === 'verkocht' ? 'winst' : w === undefined ? 'geen vraagprijs' : 'verwacht'}</span>
        <span className="muted small">{dagenInBezit(a)} dagen</span>
      </div>
    </button>
  )
}
