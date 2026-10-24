import { useState } from 'react'
import type { Auto, Kost, Status } from '../types'
import { STATUS_LABELS } from '../types'
import { euro, geinvesteerd, totaleKosten, winst } from '../calc'
import { newId, today } from '../storage'

interface Props {
  auto?: Auto
  onSave: (a: Auto) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const leeg = (): Auto => ({
  id: newId(),
  merk: '',
  model: '',
  status: 'gekocht',
  aankoopprijs: 0,
  aankoopdatum: today(),
  kosten: [],
  notities: '',
})

const num = (v: string) => (v === '' ? undefined : Number(v))

export default function AutoForm({ auto, onSave, onDelete, onClose }: Props) {
  const [a, setA] = useState<Auto>(auto ?? leeg())
  const [kost, setKost] = useState({ omschrijving: '', bedrag: '' })

  const set = <K extends keyof Auto>(k: K, v: Auto[K]) => setA((prev) => ({ ...prev, [k]: v }))

  function voegKostToe() {
    const bedrag = Number(kost.bedrag)
    if (!kost.omschrijving || !bedrag) return
    const nieuw: Kost = { id: newId(), omschrijving: kost.omschrijving, bedrag, datum: today() }
    set('kosten', [...a.kosten, nieuw])
    setKost({ omschrijving: '', bedrag: '' })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const klaar = a.status === 'verkocht' && !a.verkoopdatum ? { ...a, verkoopdatum: today() } : a
    onSave(klaar)
  }

  const w = winst(a)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>{auto ? `${auto.merk} ${auto.model}` : 'Nieuwe auto'}</h2>
          <button type="button" className="ghost" onClick={onClose} aria-label="Sluiten">✕</button>
        </div>

        <div className="grid">
          <Field label="Merk"><input required value={a.merk} onChange={(e) => set('merk', e.target.value)} /></Field>
          <Field label="Model"><input required value={a.model} onChange={(e) => set('model', e.target.value)} /></Field>
          <Field label="Bouwjaar"><input type="number" value={a.bouwjaar ?? ''} onChange={(e) => set('bouwjaar', num(e.target.value))} /></Field>
          <Field label="Kilometerstand"><input type="number" value={a.kilometerstand ?? ''} onChange={(e) => set('kilometerstand', num(e.target.value))} /></Field>
          <Field label="Kenteken"><input value={a.kenteken ?? ''} onChange={(e) => set('kenteken', e.target.value.toUpperCase())} /></Field>
          <Field label="Status">
            <select value={a.status} onChange={(e) => set('status', e.target.value as Status)}>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label="Aankoopprijs (€)"><input type="number" required min={0} value={a.aankoopprijs} onChange={(e) => set('aankoopprijs', Number(e.target.value))} /></Field>
          <Field label="Aankoopdatum"><input type="date" required value={a.aankoopdatum} onChange={(e) => set('aankoopdatum', e.target.value)} /></Field>
          <Field label="Vraagprijs (€)"><input type="number" min={0} value={a.vraagprijs ?? ''} onChange={(e) => set('vraagprijs', num(e.target.value))} /></Field>
          {a.status === 'verkocht' && (
            <>
              <Field label="Verkoopprijs (€)"><input type="number" required min={0} value={a.verkoopprijs ?? ''} onChange={(e) => set('verkoopprijs', num(e.target.value))} /></Field>
              <Field label="Verkoopdatum"><input type="date" value={a.verkoopdatum ?? ''} onChange={(e) => set('verkoopdatum', e.target.value)} /></Field>
            </>
          )}
        </div>

        <h3>Kosten</h3>
        {a.kosten.length > 0 && (
          <ul className="kosten">
            {a.kosten.map((k) => (
              <li key={k.id}>
                <span>{k.omschrijving}</span>
                <span className="num">{euro(k.bedrag)}</span>
                <button type="button" className="ghost small" onClick={() => set('kosten', a.kosten.filter((x) => x.id !== k.id))}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="kost-add">
          <input placeholder="bv. remblokken, APK, poetsen" value={kost.omschrijving} onChange={(e) => setKost({ ...kost, omschrijving: e.target.value })} />
          <input type="number" placeholder="€" value={kost.bedrag} onChange={(e) => setKost({ ...kost, bedrag: e.target.value })} />
          <button type="button" className="ghost" onClick={voegKostToe}>Toevoegen</button>
        </div>

        <Field label="Notities"><textarea rows={3} value={a.notities} onChange={(e) => set('notities', e.target.value)} /></Field>

        <div className="summary">
          <span>Kosten: <strong>{euro(totaleKosten(a))}</strong></span>
          <span>Geïnvesteerd: <strong>{euro(geinvesteerd(a))}</strong></span>
          <span>{a.status === 'verkocht' ? 'Winst' : 'Verwachte winst'}: <strong className={w === undefined ? '' : w >= 0 ? 'pos' : 'neg'}>{w === undefined ? '—' : euro(w)}</strong></span>
        </div>

        <div className="modal-actions">
          {auto && (
            <button type="button" className="danger" onClick={() => confirm('Deze auto verwijderen?') && onDelete(a.id)}>Verwijderen</button>
          )}
          <span className="spacer" />
          <button type="button" className="ghost" onClick={onClose}>Annuleren</button>
          <button type="submit">Opslaan</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}
