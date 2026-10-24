import { useEffect, useRef, useState } from 'react'
import type { Auto, Betaler, Kost, Status } from '../types'
import { STATUS_LABELS, STATUSSEN } from '../types'
import { euro, geinvesteerd, totaleKosten, winst } from '../calc'
import { backend } from '../backend'
import { newId, today, verkleinFoto } from '../util'
import { afrekening, BETALER_LABELS, PARTNERS } from '../verdeling'
import Foto from './Foto'
import Keuze from './Keuze'
import { IconLink } from './Iconen'

const BETALERS = (Object.keys(BETALER_LABELS) as Betaler[]).map((b) => ({ waarde: b, label: BETALER_LABELS[b] }))

interface Props {
  auto?: Auto
  /** Bij een nieuwe auto: gekocht of 'op het oog'. */
  soort?: 'gekocht' | 'interessant'
  onSave: (a: Auto) => void
  onDelete: (a: Auto) => void
  onClose: () => void
}

const leeg = (status: Status): Auto => ({
  id: newId(),
  merk: '',
  model: '',
  status,
  aankoopprijs: 0,
  aankoopdatum: today(),
  kosten: [],
  notities: '',
  fotos: [],
  betaaldDoor: 'samen',
  verrekend: false,
})

const num = (v: string) => (v === '' ? undefined : Number(v))

export default function AutoForm({ auto, soort = 'gekocht', onSave, onDelete, onClose }: Props) {
  const [a, setA] = useState<Auto>(auto ?? leeg(soort))
  const [kost, setKost] = useState<{ omschrijving: string; bedrag: string; betaaldDoor: Betaler }>({ omschrijving: '', bedrag: '', betaaldDoor: 'samen' })
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
    const nieuw: Kost = { id: newId(), omschrijving: kost.omschrijving, bedrag, datum: today(), betaaldDoor: kost.betaaldDoor }
    set('kosten', [...a.kosten, nieuw])
    // De betaler blijft staan: vaak betaalt dezelfde persoon meerdere kosten achter elkaar.
    setKost({ ...kost, omschrijving: '', bedrag: '' })
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
  const oog = a.status === 'interessant'
  const titel = auto ? `${auto.merk} ${auto.model}` : oog ? 'Auto op het oog' : 'Nieuwe auto'

  // Van 'op het oog' naar gekocht: de vraagprijs van de verkoper wordt de aankoopprijs (aan te passen).
  const markeerGekocht = () => setA((prev) => ({ ...prev, status: 'gekocht', aankoopdatum: today(), betaaldDoor: prev.betaaldDoor ?? 'samen' }))

  return (
    <div className="modal-backdrop" onClick={sluit}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>{titel}</h2>
          <button type="button" className="ghost icon-knop" onClick={sluit} aria-label="Sluiten">✕</button>
        </div>

        {oog && (
          <div className="oog-balk">
            <span>Gekocht? Zet de auto over naar je voorraad.</span>
            <button type="button" onClick={markeerGekocht}>✓ Gekocht</button>
          </div>
        )}

        <div className="grid">
          <Field label="Merk"><input required value={a.merk} onChange={(e) => set('merk', e.target.value)} /></Field>
          <Field label="Model"><input required value={a.model} onChange={(e) => set('model', e.target.value)} /></Field>
          <Field label="Bouwjaar"><input type="number" inputMode="numeric" value={a.bouwjaar ?? ''} onChange={(e) => set('bouwjaar', num(e.target.value))} /></Field>
          <Field label="Kilometerstand"><input type="number" inputMode="numeric" value={a.kilometerstand ?? ''} onChange={(e) => set('kilometerstand', num(e.target.value))} /></Field>
          <Field label="Kenteken"><input autoCapitalize="characters" autoCorrect="off" value={a.kenteken ?? ''} onChange={(e) => set('kenteken', e.target.value.toUpperCase())} /></Field>
          <Field label="Status">
            <select value={a.status} onChange={(e) => set('status', e.target.value as Status)}>
              {STATUSSEN.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label={oog ? 'Vraagprijs verkoper (€)' : 'Aankoopprijs (€)'}>
            <input type="number" inputMode="numeric" required={!oog} min={0} value={a.aankoopprijs || ''} onChange={(e) => set('aankoopprijs', Number(e.target.value))} />
          </Field>
          {oog ? (
            <Field label="Verwachte verkoopprijs (€)"><input type="number" inputMode="numeric" min={0} value={a.vraagprijs ?? ''} onChange={(e) => set('vraagprijs', num(e.target.value))} /></Field>
          ) : (
            <Field label="Aankoopdatum"><input type="date" required value={a.aankoopdatum} onChange={(e) => set('aankoopdatum', e.target.value)} /></Field>
          )}
          {oog ? (
            <div className="veld-breed field">
              <span>Link naar advertentie</span>
              <div className="link-rij">
                <input type="url" inputMode="url" placeholder="https://…" value={a.link ?? ''} onChange={(e) => set('link', e.target.value)} />
                {a.link && /^https?:\/\//.test(a.link) && (
                  <a className="knop ghost icon-knop" href={a.link} target="_blank" rel="noreferrer" aria-label="Advertentie openen"><IconLink /></a>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="veld-breed field">
                <span>Aankoop betaald door</span>
                <Keuze label="Aankoop betaald door" waarde={a.betaaldDoor ?? 'samen'} opties={BETALERS} onChange={(b) => set('betaaldDoor', b)} />
              </div>
              <Field label="Vraagprijs (€)"><input type="number" inputMode="numeric" min={0} value={a.vraagprijs ?? ''} onChange={(e) => set('vraagprijs', num(e.target.value))} /></Field>
            </>
          )}
          {a.status === 'verkocht' && (
            <>
              <Field label="Verkoopprijs (€)"><input type="number" inputMode="numeric" required min={0} value={a.verkoopprijs ?? ''} onChange={(e) => set('verkoopprijs', num(e.target.value))} /></Field>
              <Field label="Verkoopdatum"><input type="date" value={a.verkoopdatum ?? ''} onChange={(e) => set('verkoopdatum', e.target.value)} /></Field>
              <div className="veld-breed field">
                <span>Geld van de verkoop ontvangen door</span>
                <Keuze label="Ontvangen door" waarde={a.ontvangenDoor ?? 'samen'} opties={BETALERS} onChange={(b) => set('ontvangenDoor', b)} />
              </div>
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

        <h3>{oog ? 'Geschatte kosten' : 'Kosten'}</h3>
        {a.kosten.length > 0 && (
          <ul className="kosten">
            {a.kosten.map((k) => (
              <li key={k.id}>
                <span>{k.omschrijving}{!oog && <small className="muted"> · {BETALER_LABELS[k.betaaldDoor ?? 'samen']}</small>}</span>
                <span className="num">{euro(k.bedrag)}</span>
                <button type="button" className="ghost small" onClick={() => set('kosten', a.kosten.filter((x) => x.id !== k.id))}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="kost-add">
          <input placeholder="bv. remblokken, APK, poetsen" value={kost.omschrijving} onChange={(e) => setKost({ ...kost, omschrijving: e.target.value })} />
          <input type="number" inputMode="numeric" placeholder="€" value={kost.bedrag} onChange={(e) => setKost({ ...kost, bedrag: e.target.value })} />
          {!oog && (
            <Keuze klein label="Kosten betaald door" waarde={kost.betaaldDoor} opties={BETALERS} onChange={(b) => setKost({ ...kost, betaaldDoor: b })} />
          )}
          <button type="button" className="ghost" onClick={voegKostToe}>Toevoegen</button>
        </div>

        <Field label="Notities"><textarea rows={3} value={a.notities} onChange={(e) => set('notities', e.target.value)} /></Field>

        <div className="summary">
          <span>Kosten: <strong>{euro(totaleKosten(a))}</strong></span>
          <span>{oog ? 'Totaal nodig' : 'Geïnvesteerd'}: <strong>{euro(geinvesteerd(a))}</strong></span>
          <span>{a.status === 'verkocht' ? 'Winst' : oog ? 'Mogelijke winst' : 'Verwachte winst'}: <strong className={w === undefined ? '' : w >= 0 ? 'pos' : 'neg'}>{w === undefined ? '—' : euro(w)}</strong></span>
        </div>

        {a.status === 'verkocht' && a.verkoopprijs !== undefined && (
          <div className="summary verdeel-samenvatting">
            {PARTNERS.map((p) => (
              <span key={p.id}>{p.naam} krijgt <strong>{euro(afrekening(a).recht[p.id])}</strong> <small className="muted">(inleg {euro(afrekening(a).betaald[p.id])} + helft winst)</small></span>
            ))}
            <label className="vink">
              <input type="checkbox" checked={a.verrekend} onChange={(e) => set('verrekend', e.target.checked)} /> Onderling verrekend
            </label>
          </div>
        )}

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
