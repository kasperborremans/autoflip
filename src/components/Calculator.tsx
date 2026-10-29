import { useState } from 'react'
import type { Auto } from '../types'
import { calculator, euro, pct, type CalcInput } from '../calc'
import { type Brandstof, MERKEN, modellenVan } from '../autokennis'
import { advies, eigenHistorie, VERKOOP_LABELS, type AutoGegevens } from '../advies'
import Keuze from './Keuze'
import Marktprijs from './Marktprijs'

const VELDEN: { key: keyof CalcInput; label: string; hint?: string }[] = [
  { key: 'verwachteVerkoopprijs', label: 'Verwachte verkoopprijs', hint: 'wat vergelijkbare auto\'s opbrengen — of gebruik de marktprijs hierboven' },
  { key: 'aankoopprijs', label: 'Vraagprijs verkoper / jouw bod' },
  { key: 'reparatie', label: 'Geschatte reparatiekosten' },
  { key: 'overig', label: 'Overige kosten', hint: 'transport, APK, poetsen, advertentie' },
  { key: 'gewensteWinst', label: 'Minimale winst die je wilt' },
]

const BRANDSTOFFEN: { waarde: Brandstof | ''; label: string }[] = [
  { waarde: '', label: 'Weet niet' },
  { waarde: 'benzine', label: 'Benzine' },
  { waarde: 'diesel', label: 'Diesel' },
  { waarde: 'hybride', label: 'Hybride' },
  { waarde: 'elektrisch', label: 'Elektrisch' },
  { waarde: 'lpg', label: 'LPG' },
]

const num = (v: string) => (v === '' ? undefined : Number(v))

export default function Calculator({ autos }: { autos: Auto[] }) {
  const [input, setInput] = useState<CalcInput>({
    verwachteVerkoopprijs: 8000,
    aankoopprijs: 5500,
    reparatie: 600,
    overig: 250,
    gewensteWinst: 1000,
  })
  const [auto, setAuto] = useState<AutoGegevens>({ merk: '', model: '' })
  const setA = <K extends keyof AutoGegevens>(k: K, v: AutoGegevens[K]) => setAuto((prev) => ({ ...prev, [k]: v }))

  const r = calculator(input)
  const ad = advies(auto)
  const historie = eigenHistorie(autos, auto.merk, auto.model)
  const winstNaPech = r.winst - ad.risico
  const oordeel =
    r.winst <= 0 ? { tekst: 'Niet doen 👎', cls: 'neg' }
    : r.winst < input.gewensteWinst ? { tekst: 'Krap — probeer lager te bieden', cls: 'warn' }
    : ad.verkoop === 'traag' ? { tekst: 'Winst oké, maar lastig te verkopen ⚠️', cls: 'warn' }
    : ad.risico > 0 && winstNaPech <= 0 ? { tekst: 'Riskant — één bekend mankement en je winst is weg ⚠️', cls: 'warn' }
    : ad.verkoop === 'snel' ? { tekst: 'Slimme deal — verkoopt snel 👍', cls: 'pos' }
    : { tekst: 'Goede deal 👍', cls: 'pos' }

  return (
    <section className="calc">
      <div className="stack">
        <div className="card stack">
          <h2>Welke auto?</h2>
          <div className="grid">
            <label className="field">
              <span>Merk</span>
              <input list="calc-merken" value={auto.merk} onChange={(e) => setA('merk', e.target.value)} placeholder="bv. Volkswagen" />
            </label>
            <label className="field">
              <span>Model</span>
              <input list="calc-modellen" value={auto.model} onChange={(e) => setA('model', e.target.value)} placeholder="bv. Polo" />
            </label>
            <label className="field">
              <span>Motor / uitvoering</span>
              <input value={auto.motor ?? ''} onChange={(e) => setA('motor', e.target.value || undefined)} placeholder="bv. 1.2 TSI Highline" />
            </label>
            <label className="field">
              <span>Vermogen (kW)</span>
              <input type="number" inputMode="numeric" value={auto.kw ?? ''} onChange={(e) => setA('kw', num(e.target.value))} placeholder="staat op het inschrijvingsbewijs" />
            </label>
            <label className="field">
              <span>Bouwjaar</span>
              <input type="number" inputMode="numeric" value={auto.bouwjaar ?? ''} onChange={(e) => setA('bouwjaar', num(e.target.value))} />
            </label>
            <label className="field">
              <span>Kilometerstand</span>
              <input type="number" inputMode="numeric" value={auto.kilometerstand ?? ''} onChange={(e) => setA('kilometerstand', num(e.target.value))} />
            </label>
            <label className="field">
              <span>Brandstof</span>
              <select value={auto.brandstof ?? ''} onChange={(e) => setA('brandstof', (e.target.value || undefined) as Brandstof | undefined)}>
                {BRANDSTOFFEN.map((b) => <option key={b.waarde} value={b.waarde}>{b.label}</option>)}
              </select>
            </label>
            <div className="field">
              <span>Versnellingsbak</span>
              <Keuze
                label="Versnellingsbak"
                waarde={auto.transmissie ?? ''}
                opties={[{ waarde: '', label: '?' }, { waarde: 'hand', label: 'Hand' }, { waarde: 'automaat', label: 'Automaat' }]}
                onChange={(w) => setA('transmissie', w || undefined)}
              />
            </div>
          </div>
          <datalist id="calc-merken">{MERKEN.map((m) => <option key={m} value={m} />)}</datalist>
          <datalist id="calc-modellen">{modellenVan(auto.merk).map((m) => <option key={m} value={m} />)}</datalist>
        </div>

        <Marktprijs auto={auto} onGebruik={(prijs) => setInput((prev) => ({ ...prev, verwachteVerkoopprijs: prijs }))} />

        <div className="card stack">
          <h2>Inkoop-calculator</h2>
          {VELDEN.map((v) => (
            <label key={v.key} className="field">
              <span>{v.label} (€)</span>
              <input type="number" inputMode="numeric" min={0} value={input[v.key]} onChange={(e) => setInput({ ...input, [v.key]: Number(e.target.value) })} />
              {v.hint && <small className="muted">{v.hint}</small>}
            </label>
          ))}
        </div>
      </div>

      <div className="stack uitkomst">
        <div className="card stack">
          <div className={`verdict ${oordeel.cls}`}>{oordeel.tekst}</div>
          {ad.verkoop && (
            <div className="row">
              <span>Verkoopbaarheid</span>
              <span className={`badge verkoop-${ad.verkoop}`}>{VERKOOP_LABELS[ad.verkoop]}</span>
            </div>
          )}
          <Row label="Totale investering" value={euro(r.investering)} />
          <Row label="Verwachte winst" value={euro(r.winst)} cls={r.winst >= 0 ? 'pos' : 'neg'} />
          <Row label="Rendement" value={pct(r.rendement)} />
          {ad.risico > 0 && (
            <Row label="Winst als het misgaat" value={euro(winstNaPech)} cls={winstNaPech >= 0 ? 'pos' : 'neg'} />
          )}
          <hr />
          <Row label="Maximaal bod" value={euro(Math.max(0, r.maxBod))} big />
          <small className="muted">Het hoogste bedrag dat je kunt betalen en nog {euro(input.gewensteWinst)} winst maakt.</small>
        </div>

        {(auto.merk.trim() || auto.model.trim()) && (
          <div className="card stack advies">
            <h2>Waar moet je op letten?</h2>
            {historie && (
              <p className="uitleg">
                Jullie verkochten al {historie.aantal}× dit model: gemiddeld in {historie.gemDagen} dagen, met{' '}
                <strong className={historie.gemWinst >= 0 ? 'pos' : 'neg'}>{euro(historie.gemWinst)}</strong> winst.
              </p>
            )}
            {ad.pluspunten.length > 0 && (
              <ul className="advies-lijst">
                {ad.pluspunten.map((p) => <li key={p}><span className="pos">✓</span>{p}</li>)}
              </ul>
            )}
            {ad.waarschuwingen.length > 0 && (
              <ul className="advies-lijst">
                {ad.waarschuwingen.map((w) => <li key={w}><span className="warn">!</span>{w}</li>)}
              </ul>
            )}
            {ad.problemen.length > 0 && (
              <>
                <h3>Bekende problemen</h3>
                <ul className="problemen">
                  {ad.problemen.map((p) => (
                    <li key={p.wat} className={`ernst-${p.ernst}`}>
                      <div className="probleem-kop">
                        <strong>{p.wat}</strong>
                        {!!p.kosten && <span className="badge">± {euro(p.kosten)}</span>}
                      </div>
                      <span className="muted small">{p.check}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {ad.info && ad.problemen.length === 0 && <p className="uitleg pos">Geen bekende grote kwalen voor deze uitvoering.</p>}
            {ad.risico > 0 && (
              <small className="muted">
                Tip: zet {euro(ad.risico)} bij de reparatiekosten als je niet kunt uitsluiten dat het duurste probleem speelt.
              </small>
            )}
            <small className="muted">Vuistregels, geen garantie — check altijd de onderhoudshistorie, APK en de NAP-kilometerstand via het kenteken.</small>
          </div>
        )}
      </div>
    </section>
  )
}

function Row({ label, value, cls, big }: { label: string; value: string; cls?: string; big?: boolean }) {
  return (
    <div className={`row ${big ? 'big' : ''}`}>
      <span>{label}</span>
      <strong className={cls}>{value}</strong>
    </div>
  )
}
