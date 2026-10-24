import { useState } from 'react'
import type { Auto, Status } from '../types'
import { STATUS_LABELS } from '../types'
import { dagenInBezit, euro, geinvesteerd, winst } from '../calc'
import AutoForm from './AutoForm'

interface Props {
  autos: Auto[]
  setAutos: React.Dispatch<React.SetStateAction<Auto[]>>
}

export default function AutoLijst({ autos, setAutos }: Props) {
  const [filter, setFilter] = useState<Status | 'alle'>('alle')
  const [bewerk, setBewerk] = useState<Auto | 'nieuw' | null>(null)

  const zichtbaar = autos
    .filter((a) => filter === 'alle' || a.status === filter)
    .sort((a, b) => b.aankoopdatum.localeCompare(a.aankoopdatum))

  function opslaan(auto: Auto) {
    setAutos((prev) => (prev.some((a) => a.id === auto.id) ? prev.map((a) => (a.id === auto.id ? auto : a)) : [...prev, auto]))
    setBewerk(null)
  }

  function verwijder(id: string) {
    setAutos((prev) => prev.filter((a) => a.id !== id))
    setBewerk(null)
  }

  return (
    <section className="stack">
      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value as Status | 'alle')}>
          <option value="alle">Alle statussen</option>
          {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button onClick={() => setBewerk('nieuw')}>+ Nieuwe auto</button>
      </div>

      {zichtbaar.length === 0 ? (
        <div className="card muted">Geen auto's gevonden.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Auto</th><th>Status</th><th className="num">Geïnvesteerd</th>
                <th className="num">Vraag / verkoop</th><th className="num">Winst</th><th className="num">Dagen</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((a) => {
                const w = winst(a)
                return (
                  <tr key={a.id} className="clickable" onClick={() => setBewerk(a)}>
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

      {bewerk && (
        <AutoForm
          auto={bewerk === 'nieuw' ? undefined : bewerk}
          onSave={opslaan}
          onDelete={verwijder}
          onClose={() => setBewerk(null)}
        />
      )}
    </section>
  )
}
