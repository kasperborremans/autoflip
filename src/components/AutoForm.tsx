import { useEffect, useRef, useState } from 'react'
import type { Auto, Kost, Status } from '../types'
import { STATUS_LABELS } from '../types'
import { euro, geinvesteerd, totaleKosten, winst } from '../calc'
import { backend } from '../backend'
import { newId, today, verkleinFoto } from '../util'
import Foto from './Foto'

interface Props {
  auto?: Auto
  onSave: (a: Auto) => void
  onDelete: (a: Auto) => void
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
  fotos: [],
})

const num = (v: string) => (v === '' ? undefined : Number(v))

export default function AutoForm({ auto, onSave, onDelete, onClose }: Props) {
  const [a, setA] = useState<Auto>(auto ?? leeg())
  const [kost, setKost] = useState({ omschrijving: '', bedrag: '' })
  const [uploaden, setUploaden] = useState(0)
  const [groot, setGroot] = useState<string | null>(null)
  // Foto's worden direct geüpload, maar pas definitief bij Opslaan: bij Annuleren ruimen we nieuwe
  // uploads weer op en verwijderde foto's worden pas na Opslaan echt gewist.
  const nieuweFotos = useRef<string[]>([])
  const verwijderdeFotos = useRef<string[]>([])
  const fotoInput = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Auto>(k: K, v: Auto[K]) => setA((prev) => ({ ...prev, [k]: v }))

  function voegKostToe() {
    const bedrag = Number(kost.bedrag)
    if (!kost.omschrijving || !bedrag) return
    const nieuw: Kost = { id: newId(), omschrijving: kost.omschrijving, bedrag, datum: today() }
    set('kosten', [...a.kosten, nieuw])
    setKost({ omschrijving: '', bedrag: '' })
  }

  async function voegFotosToe(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    setUploaden((n) => n + files.length)
    await Promise.all(
      files.map(async (file) => {
        try {
          const path = await backend.uploadFoto(a.id, await verkleinFoto(file))
          nieuweFotos.current.push(path)
          setA((prev) => ({ ...prev, fotos: [...prev.fotos, path] }))
        } catch (err) {
          alert(`Foto uploaden mislukt: ${(err as Error).message}`)
        } finally {
          setUploaden((n) => n - 1)
        }
      }),
    )
  }

  function verwijderFoto(path: string) {
    set('fotos', a.fotos.filter((p) => p !== path))
    verwijderdeFotos.current.push(path)
    setGroot(null)
  }

  const maakHoofdfoto = (path: string) => set('fotos', [path, ...a.fotos.filter((p) => p !== path)])

  const ruimOp = (paths: string[]) => backend.deleteFotos(paths).catch(() => {})

  // Het formulier krijgt een eigen stap in de browsergeschiedenis, zodat de terugknop van de
  // telefoon het formulier sluit in plaats van de app te verlaten.
  const gesloten = useRef(false)
  function afronden(actie: () => void) {
    if (gesloten.current) return
    gesloten.current = true
    actie()
    if (history.state?.autoflipFormulier) history.back()
  }

  const sluit = () => afronden(() => { ruimOp(nieuweFotos.current); onClose() })

  const laatste = useRef({ sluit, groot })
  laatste.current = { sluit, groot }
  useEffect(() => {
    if (!history.state?.autoflipFormulier) history.pushState({ autoflipFormulier: true }, '')
    const onPop = () => {
      if (laatste.current.groot) {
        // Terug sluit eerst de grote foto; het formulier blijft open.
        setGroot(null)
        history.pushState({ autoflipFormulier: true }, '')
      } else laatste.current.sluit()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (laatste.current.groot) setGroot(null)
      else laatste.current.sluit()
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (uploaden) return alert("Wacht tot de foto's geüpload zijn.")
    const klaar = a.status === 'verkocht' && !a.verkoopdatum ? { ...a, verkoopdatum: today() } : a
    afronden(() => { ruimOp(verwijderdeFotos.current); onSave(klaar) })
  }

  function verwijderAuto() {
    if (!confirm('Deze auto verwijderen?')) return
    // Alles wat bij deze auto hoort opruimen, ook foto's die nog niet waren opgeslagen.
    const fotos = [...new Set([...(auto?.fotos ?? []), ...a.fotos, ...verwijderdeFotos.current])]
    afronden(() => onDelete({ ...a, fotos }))
  }

  const w = winst(a)

  return (
    <div className="modal-backdrop" onClick={sluit}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>{auto ? `${auto.merk} ${auto.model}` : 'Nieuwe auto'}</h2>
          <button type="button" className="ghost icon-knop" onClick={sluit} aria-label="Sluiten">✕</button>
        </div>

        <div className="grid">
          <Field label="Merk"><input required value={a.merk} onChange={(e) => set('merk', e.target.value)} /></Field>
          <Field label="Model"><input required value={a.model} onChange={(e) => set('model', e.target.value)} /></Field>
          <Field label="Bouwjaar"><input type="number" inputMode="numeric" value={a.bouwjaar ?? ''} onChange={(e) => set('bouwjaar', num(e.target.value))} /></Field>
          <Field label="Kilometerstand"><input type="number" inputMode="numeric" value={a.kilometerstand ?? ''} onChange={(e) => set('kilometerstand', num(e.target.value))} /></Field>
          <Field label="Kenteken"><input autoCapitalize="characters" autoCorrect="off" value={a.kenteken ?? ''} onChange={(e) => set('kenteken', e.target.value.toUpperCase())} /></Field>
          <Field label="Status">
            <select value={a.status} onChange={(e) => set('status', e.target.value as Status)}>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label="Aankoopprijs (€)"><input type="number" inputMode="numeric" required min={0} value={a.aankoopprijs || ''} onChange={(e) => set('aankoopprijs', Number(e.target.value))} /></Field>
          <Field label="Aankoopdatum"><input type="date" required value={a.aankoopdatum} onChange={(e) => set('aankoopdatum', e.target.value)} /></Field>
          <Field label="Vraagprijs (€)"><input type="number" inputMode="numeric" min={0} value={a.vraagprijs ?? ''} onChange={(e) => set('vraagprijs', num(e.target.value))} /></Field>
          {a.status === 'verkocht' && (
            <>
              <Field label="Verkoopprijs (€)"><input type="number" inputMode="numeric" required min={0} value={a.verkoopprijs ?? ''} onChange={(e) => set('verkoopprijs', num(e.target.value))} /></Field>
              <Field label="Verkoopdatum"><input type="date" value={a.verkoopdatum ?? ''} onChange={(e) => set('verkoopdatum', e.target.value)} /></Field>
            </>
          )}
        </div>

        <h3>Foto's</h3>
        <div className="fotos">
          {a.fotos.map((p, i) => (
            <div key={p} className="foto-tegel">
              <Foto path={p} className="foto" onClick={() => setGroot(p)} />
              {i === 0 && <span className="hoofd-label">Hoofdfoto</span>}
            </div>
          ))}
          {Array.from({ length: uploaden }, (_, i) => <div key={`u${i}`} className="foto foto-leeg">⏳</div>)}
          <button type="button" className="foto foto-toevoegen" onClick={() => fotoInput.current?.click()}>+ Foto</button>
          <input ref={fotoInput} type="file" accept="image/*" multiple hidden onChange={voegFotosToe} />
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
          <input type="number" inputMode="numeric" placeholder="€" value={kost.bedrag} onChange={(e) => setKost({ ...kost, bedrag: e.target.value })} />
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
            <button type="button" className="danger" onClick={verwijderAuto}>Verwijderen</button>
          )}
          <span className="spacer" />
          <button type="button" className="ghost alleen-desktop" onClick={sluit}>Annuleren</button>
          <button type="submit" className="opslaan" disabled={uploaden > 0}>{uploaden > 0 ? "Foto's uploaden…" : 'Opslaan'}</button>
        </div>
      </form>

      {groot && (
        <div className="lightbox" onClick={(e) => { e.stopPropagation(); setGroot(null) }}>
          <Foto path={groot} className="lightbox-img" />
          <div className="lightbox-acties" onClick={(e) => e.stopPropagation()}>
            {a.fotos[0] !== groot && <button type="button" onClick={() => { maakHoofdfoto(groot); setGroot(null) }}>Maak hoofdfoto</button>}
            <button type="button" className="danger" onClick={() => verwijderFoto(groot)}>Foto verwijderen</button>
            <button type="button" className="ghost" onClick={() => setGroot(null)}>Sluiten</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}
