import { useEffect, useRef, useState } from 'react'
import type { Auto, Betaler, Kost, Status } from '../types'
import { STATUS_LABELS, STATUSSEN } from '../types'
import { euro, geinvesteerd, totaleKosten, winst } from '../calc'
import { backend } from '../backend'
import { bestandenVan } from '../backend/types'
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

const isPdf = (path: string) => path.endsWith('.pdf')

type NieuweKost = { id: string; omschrijving: string; bedrag: string; betaaldDoor: Betaler; bonnetje?: string }

export default function AutoForm({ auto, soort = 'gekocht', onSave, onDelete, onClose }: Props) {
  const [a, setA] = useState<Auto>(auto ?? leeg(soort))
  const [kost, setKost] = useState<NieuweKost>({ id: newId(), omschrijving: '', bedrag: '', betaaldDoor: 'samen' })
  const [uploaden, setUploaden] = useState(0)
  const [groot, setGroot] = useState<string | null>(null)
  // Bonnetje in de lightbox, en de kosten waarvoor nu een bonnetje uploadt.
  const [bon, setBon] = useState<{ kostId: string; path: string } | null>(null)
  const [bonBezig, setBonBezig] = useState<string[]>([])
  // Foto's worden direct geüpload, maar pas definitief bij Opslaan: bij Annuleren ruimen we nieuwe
  // uploads weer op en verwijderde foto's worden pas na Opslaan echt gewist.
  const nieuweFotos = useRef<string[]>([])
  const verwijderdeFotos = useRef<string[]>([])
  const fotoInput = useRef<HTMLInputElement>(null)
  const bonInput = useRef<HTMLInputElement>(null)
  const bonVoor = useRef<string | null>(null)

  const set = <K extends keyof Auto>(k: K, v: Auto[K]) => setA((prev) => ({ ...prev, [k]: v }))

  function voegKostToe() {
    const bedrag = Number(kost.bedrag)
    if (!kost.omschrijving || !bedrag) return
    const nieuw: Kost = { id: kost.id, omschrijving: kost.omschrijving, bedrag, datum: today(), betaaldDoor: kost.betaaldDoor }
    if (kost.bonnetje) nieuw.bonnetje = kost.bonnetje
    set('kosten', [...a.kosten, nieuw])
    // De betaler blijft staan: vaak betaalt dezelfde persoon meerdere kosten achter elkaar.
    setKost({ id: newId(), omschrijving: '', bedrag: '', betaaldDoor: kost.betaaldDoor })
  }

  function verwijderKost(k: Kost) {
    set('kosten', a.kosten.filter((x) => x.id !== k.id))
    if (k.bonnetje) verwijderdeFotos.current.push(k.bonnetje)
  }

  function kiesBonnetje(kostId: string) {
    bonVoor.current = kostId
    bonInput.current?.click()
  }

  async function voegBonnetjeToe(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const kostId = bonVoor.current
    e.target.value = ''
    if (!file || !kostId) return
    setUploaden((n) => n + 1)
    setBonBezig((b) => [...b, kostId])
    try {
      // Foto's iets groter houden dan autofoto's, zodat de tekst leesbaar blijft. PDF's gaan ongewijzigd.
      const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      const path = pdf
        ? await backend.uploadBonnetje(a.id, file, 'pdf')
        : await backend.uploadBonnetje(a.id, await verkleinFoto(file, 2200), 'jpg')
      nieuweFotos.current.push(path)
      // De kost kan inmiddels al toegevoegd zijn; dan komt het bonnetje bij die kost in de lijst.
      setKost((prev) => (prev.id === kostId ? { ...prev, bonnetje: path } : prev))
      setA((prev) => ({ ...prev, kosten: prev.kosten.map((k) => (k.id === kostId ? { ...k, bonnetje: path } : k)) }))
    } catch (err) {
      alert(`Bonnetje uploaden mislukt: ${(err as Error).message}`)
    } finally {
      setUploaden((n) => n - 1)
      setBonBezig((b) => b.filter((id) => id !== kostId))
    }
  }

  function bekijkBonnetje(kostId: string, path: string) {
    if (isPdf(path)) {
      // Het tabblad meteen openen (anders blokkeert de browser het) en de link invullen zodra hij er is.
      const tab = window.open('', '_blank')
      backend
        .fotoUrl(path)
        .then((url) => { if (tab) { tab.opener = null; tab.location.href = url } })
        .catch((err) => { tab?.close(); alert(`Bonnetje openen mislukt: ${(err as Error).message}`) })
    }
    setBon({ kostId, path })
  }

  function verwijderBonnetje(kostId: string, path: string) {
    setA((prev) => ({ ...prev, kosten: prev.kosten.map((k) => (k.id === kostId ? { ...k, bonnetje: undefined } : k)) }))
    verwijderdeFotos.current.push(path)
    setBon(null)
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

  const laatste = useRef({ sluit, groot, bon })
  laatste.current = { sluit, groot, bon }
  useEffect(() => {
    if (!history.state?.autoflipFormulier) history.pushState({ autoflipFormulier: true }, '')
    const onPop = () => {
      if (laatste.current.bon || laatste.current.groot) {
        // Terug sluit eerst de grote foto of het bonnetje; het formulier blijft open.
        setBon(null)
        setGroot(null)
        history.pushState({ autoflipFormulier: true }, '')
      } else laatste.current.sluit()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (laatste.current.bon) setBon(null)
      else if (laatste.current.groot) setGroot(null)
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
    if (uploaden) return alert("Wacht tot de foto's en bonnetjes geüpload zijn.")
    const klaar = a.status === 'verkocht' && !a.verkoopdatum ? { ...a, verkoopdatum: today() } : a
    // Nieuwe uploads die nergens meer aan hangen (bv. een bonnetje bij een kost die nooit is toegevoegd) ook opruimen.
    const inGebruik = new Set(bestandenVan(klaar))
    const los = nieuweFotos.current.filter((p) => !inGebruik.has(p))
    afronden(() => { ruimOp([...verwijderdeFotos.current, ...los]); onSave(klaar) })
  }

  function verwijderAuto() {
    if (!confirm('Deze auto verwijderen?')) return
    // Alles wat bij deze auto hoort opruimen, ook foto's en bonnetjes die nog niet waren opgeslagen.
    // De bonnetjes van de huidige kosten wist de backend zelf.
    const fotos = [...new Set([...(auto ? bestandenVan(auto) : []), ...a.fotos, ...verwijderdeFotos.current, ...nieuweFotos.current])]
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

        <h3>
          {oog ? 'Geschatte kosten' : 'Kosten'}
          {!oog && a.kosten.length > 0 && (
            <small className="muted bon-telling"> · {a.kosten.filter((k) => k.bonnetje).length}/{a.kosten.length} met bonnetje</small>
          )}
        </h3>
        {a.kosten.length > 0 && (
          <ul className="kosten">
            {a.kosten.map((k) => (
              <li key={k.id}>
                <span>{k.omschrijving}{!oog && <small className="muted"> · {BETALER_LABELS[k.betaaldDoor ?? 'samen']}</small>}</span>
                <span className="num">{euro(k.bedrag)}</span>
                {bonBezig.includes(k.id) ? (
                  <button type="button" className="ghost small" disabled aria-label="Bonnetje uploadt">⏳</button>
                ) : k.bonnetje ? (
                  <button type="button" className="ghost small" onClick={() => bekijkBonnetje(k.id, k.bonnetje!)} aria-label="Bonnetje bekijken" title="Bonnetje bekijken">🧾</button>
                ) : (
                  !oog && <button type="button" className="ghost small muted" onClick={() => kiesBonnetje(k.id)} aria-label="Bonnetje toevoegen" title="Bonnetje toevoegen">📎</button>
                )}
                <button type="button" className="ghost small" onClick={() => verwijderKost(k)} aria-label="Kost verwijderen">✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="kost-add">
          <input placeholder="bv. remblokken, APK, poetsen" value={kost.omschrijving} onChange={(e) => setKost({ ...kost, omschrijving: e.target.value })} />
          <input type="number" inputMode="numeric" placeholder="€" value={kost.bedrag} onChange={(e) => setKost({ ...kost, bedrag: e.target.value })} />
          {oog ? (
            <button type="button" className="ghost" onClick={voegKostToe}>Toevoegen</button>
          ) : (
            <>
              <Keuze klein label="Kosten betaald door" waarde={kost.betaaldDoor} opties={BETALERS} onChange={(b) => setKost({ ...kost, betaaldDoor: b })} />
              <div className="kost-add-acties">
                {bonBezig.includes(kost.id) ? (
                  <span className="badge">⏳ Bonnetje uploaden…</span>
                ) : kost.bonnetje ? (
                  <span className="badge bon-label">
                    🧾 {isPdf(kost.bonnetje) ? 'PDF' : 'Foto'} klaar
                    <button type="button" className="ghost small" onClick={() => setKost({ ...kost, bonnetje: undefined })} aria-label="Bonnetje weghalen">✕</button>
                  </span>
                ) : (
                  <button type="button" className="ghost" onClick={() => kiesBonnetje(kost.id)}>📎 Bonnetje</button>
                )}
                <span className="spacer" />
                <button type="button" className="ghost" onClick={voegKostToe}>Toevoegen</button>
              </div>
            </>
          )}
          <input ref={bonInput} type="file" accept="image/*,application/pdf" hidden onChange={voegBonnetjeToe} />
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
          <button type="submit" className="opslaan" disabled={uploaden > 0}>{uploaden > 0 ? 'Uploaden…' : 'Opslaan'}</button>
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

      {bon && (
        <div className="lightbox" onClick={(e) => { e.stopPropagation(); setBon(null) }}>
          {isPdf(bon.path) ? (
            <div className="card bon-pdf" onClick={(e) => e.stopPropagation()}>
              <span>📄 PDF-bonnetje</span>
              <PdfLink path={bon.path} />
            </div>
          ) : (
            <Foto path={bon.path} className="lightbox-img" />
          )}
          <div className="lightbox-acties" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="danger" onClick={() => verwijderBonnetje(bon.kostId, bon.path)}>Bonnetje verwijderen</button>
            <button type="button" className="ghost" onClick={() => setBon(null)}>Sluiten</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Link om een PDF-bonnetje (opnieuw) te openen, voor als de browser het nieuwe tabblad tegenhield. */
function PdfLink({ path }: { path: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let actief = true
    backend.fotoUrl(path).then((u) => actief && setUrl(u)).catch(() => {})
    return () => { actief = false }
  }, [path])
  return url ? <a className="knop" href={url} target="_blank" rel="noreferrer">Openen</a> : <span className="muted">Laden…</span>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}
