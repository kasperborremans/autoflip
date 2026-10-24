import { useEffect, useState } from 'react'
import type { Auto, Status } from '../types'
import { STATUS_LABELS, STATUSSEN } from '../types'
import { dagenInBezit, euro, geinvesteerd, winst } from '../calc'
import { useMobiel } from '../useMobiel'
import AutoForm from './AutoForm'
import Foto from './Foto'
import { IconAuto, IconOog, IconPlus, IconZoek } from './Iconen'

interface Props {
  autos: Auto[]
  opslaan: (a: Auto) => void
  verwijder: (a: Auto) => void
}

type Bewerk = { auto: Auto } | { nieuw: 'gekocht' | 'interessant' } | null

export default function AutoLijst({ autos, opslaan, verwijder }: Props) {
  const [filter, setFilter] = useState<Status | 'alle'>('alle')
  const [zoek, setZoek] = useState('')
  const [bewerk, setBewerk] = useState<Bewerk>(null)
  const [toevoegMenu, setToevoegMenu] = useState(false)
  const mobiel = useMobiel()

  useEffect(() => {
    if (!toevoegMenu) return
    const sluit = () => setToevoegMenu(false)
    document.addEventListener('click', sluit)
    return () => document.removeEventListener('click', sluit)
  }, [toevoegMenu])

  const term = zoek.trim().toLowerCase()
  const zichtbaar = autos
    .filter((a) => filter === 'alle' || a.status === filter)
    .filter((a) => !term || [a.merk, a.model, a.kenteken, a.bouwjaar].some((v) => String(v ?? '').toLowerCase().includes(term)))
    .sort((a, b) => b.aankoopdatum.localeCompare(a.aankoopdatum))

  // Gegroepeerd per status, in de volgorde van het traject: op het oog → gekocht → … → verkocht.
  const groepen = STATUSSEN.map((s) => ({ status: s, autos: zichtbaar.filter((a) => a.status === s) })).filter((g) => g.autos.length)

  const aantal = (s: Status | 'alle') => (s === 'alle' ? autos.length : autos.filter((a) => a.status === s).length)
  const nieuw = (soort: 'gekocht' | 'interessant') => { setToevoegMenu(false); setBewerk({ nieuw: soort }) }

  const toevoegKeuzes = (
    <div className="toevoeg-menu card" onClick={(e) => e.stopPropagation()}>
      <button className="menu-item" onClick={() => nieuw('gekocht')}>
        <IconAuto /> <span><strong>Gekochte auto</strong><small className="muted">Een auto die we gekocht hebben</small></span>
      </button>
      <button className="menu-item" onClick={() => nieuw('interessant')}>
        <IconOog /> <span><strong>Op het oog</strong><small className="muted">Een interessante auto om in de gaten te houden</small></span>
      </button>
    </div>
  )

  return (
    <section className="stack">
      <div className="toolbar">
        <label className="zoek">
          <IconZoek />
          <input type="search" placeholder="Zoek merk, model of kenteken" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        </label>
        {!mobiel && (
          <div className="toevoeg-wrap">
            <button onClick={(e) => { e.stopPropagation(); setToevoegMenu(!toevoegMenu) }}>+ Toevoegen</button>
            {toevoegMenu && toevoegKeuzes}
          </div>
        )}
      </div>

      <div className="chips">
        {(['alle', ...STATUSSEN] as const).map((s) => (
          <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'alle' ? 'Alle' : STATUS_LABELS[s]} <span className="muted">{aantal(s)}</span>
          </button>
        ))}
      </div>

      {groepen.length === 0 ? (
        <div className="card muted">{autos.length ? "Geen auto's gevonden." : "Nog geen auto's. Tik op + om je eerste auto toe te voegen."}</div>
      ) : (
        groepen.map((g) => (
          <div key={g.status} className="groep">
            <h3 className="groep-kop">
              <span className={`stip s-${g.status}`} /> {STATUS_LABELS[g.status]} <span className="muted">{g.autos.length}</span>
            </h3>
            {mobiel ? (
              <div className="auto-kaarten">
                {g.autos.map((a) => <AutoKaart key={a.id} auto={a} onClick={() => setBewerk({ auto: a })} />)}
              </div>
            ) : (
              <AutoTabel autos={g.autos} onKies={(a) => setBewerk({ auto: a })} />
            )}
          </div>
        ))
      )}
      {mobiel && <div className="fab-ruimte" />}

      {mobiel && (
        <>
          {toevoegMenu && <div className="fab-menu">{toevoegKeuzes}</div>}
          <button className={`fab ${toevoegMenu ? 'open' : ''}`} aria-label="Toevoegen" onClick={(e) => { e.stopPropagation(); setToevoegMenu(!toevoegMenu) }}>
            <IconPlus />
          </button>
        </>
      )}

      {bewerk && (
        <AutoForm
          auto={'auto' in bewerk ? bewerk.auto : undefined}
          soort={'nieuw' in bewerk ? bewerk.nieuw : undefined}
          onSave={(a) => { opslaan(a); setBewerk(null) }}
          onDelete={(a) => { verwijder(a); setBewerk(null) }}
          onClose={() => setBewerk(null)}
        />
      )}
    </section>
  )
}

/** Wat er rechts bij een auto staat: winst (of verwachte winst) en een korte toelichting. */
function samenvatting(a: Auto) {
  const w = winst(a)
  const toelichting =
    a.status === 'verkocht' ? 'winst'
    : a.status === 'interessant' ? (w === undefined ? 'geen verkoopprijs' : 'mogelijke winst')
    : w === undefined ? 'geen vraagprijs' : 'verwacht'
  const dagen = dagenInBezit(a)
  const sub = a.status === 'interessant' ? `vraagt ${euro(a.aankoopprijs)}` : `${dagen} ${dagen === 1 ? 'dag' : 'dagen'}`
  return { w, toelichting, sub }
}

function AutoTabel({ autos, onKies }: { autos: Auto[]; onKies: (a: Auto) => void }) {
  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th className="foto-kolom"></th><th>Auto</th><th className="num">Geïnvesteerd</th>
            <th className="num">Vraag / verkoop</th><th className="num">Winst</th><th className="num">Dagen</th>
          </tr>
        </thead>
        <tbody>
          {autos.map((a) => {
            const { w } = samenvatting(a)
            const oog = a.status === 'interessant'
            return (
              <tr key={a.id} className="clickable" onClick={() => onKies(a)}>
                <td className="foto-kolom">{a.fotos[0] ? <Foto path={a.fotos[0]} className="thumb" /> : <div className="thumb foto-leeg">🚗</div>}</td>
                <td>
                  <strong>{a.merk} {a.model}</strong>
                  <div className="muted small">{[a.bouwjaar, a.kenteken].filter(Boolean).join(' · ')}</div>
                </td>
                <td className="num">{oog ? <span className="muted">vraagt {euro(a.aankoopprijs)}</span> : euro(geinvesteerd(a))}</td>
                <td className="num">{euro((a.status === 'verkocht' ? a.verkoopprijs : a.vraagprijs) ?? 0)}</td>
                <td className={`num ${w === undefined ? 'muted' : w >= 0 ? 'pos' : 'neg'}`}>{w === undefined ? '—' : euro(w)}</td>
                <td className="num">{oog ? '—' : dagenInBezit(a)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AutoKaart({ auto: a, onClick }: { auto: Auto; onClick: () => void }) {
  const { w, toelichting, sub } = samenvatting(a)
  return (
    <button className="auto-kaart card" onClick={onClick}>
      {a.fotos[0] ? <Foto path={a.fotos[0]} className="kaart-foto" /> : <div className="kaart-foto foto-leeg">🚗</div>}
      <div className="kaart-midden">
        <strong className="kaart-titel">{a.merk} {a.model}</strong>
        <span className="muted small">{[a.bouwjaar, a.kenteken].filter(Boolean).join(' · ') || ' '}</span>
        <span className="muted small">{sub}</span>
      </div>
      <div className="kaart-rechts">
        <strong className={w === undefined ? 'muted' : w >= 0 ? 'pos' : 'neg'}>{w === undefined ? '—' : euro(w)}</strong>
        <span className="muted small">{toelichting}</span>
      </div>
    </button>
  )
}
