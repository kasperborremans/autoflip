import { useState } from 'react'
import { calculator, euro, pct, type CalcInput } from '../calc'

const VELDEN: { key: keyof CalcInput; label: string; hint?: string }[] = [
  { key: 'verwachteVerkoopprijs', label: 'Verwachte verkoopprijs', hint: 'wat vergelijkbare auto\'s opbrengen' },
  { key: 'aankoopprijs', label: 'Vraagprijs verkoper / jouw bod' },
  { key: 'reparatie', label: 'Geschatte reparatiekosten' },
  { key: 'overig', label: 'Overige kosten', hint: 'transport, APK, poetsen, advertentie' },
  { key: 'gewensteWinst', label: 'Minimale winst die je wilt' },
]

export default function Calculator() {
  const [input, setInput] = useState<CalcInput>({
    verwachteVerkoopprijs: 8000,
    aankoopprijs: 5500,
    reparatie: 600,
    overig: 250,
    gewensteWinst: 1000,
  })
  const r = calculator(input)
  const oordeel =
    r.winst >= input.gewensteWinst ? { tekst: 'Goede deal 👍', cls: 'pos' }
    : r.winst > 0 ? { tekst: 'Krap — probeer lager te bieden', cls: 'warn' }
    : { tekst: 'Niet doen 👎', cls: 'neg' }

  return (
    <section className="calc">
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

      <div className="card stack result">
        <div className={`verdict ${oordeel.cls}`}>{oordeel.tekst}</div>
        <Row label="Totale investering" value={euro(r.investering)} />
        <Row label="Verwachte winst" value={euro(r.winst)} cls={r.winst >= 0 ? 'pos' : 'neg'} />
        <Row label="Rendement" value={pct(r.rendement)} />
        <hr />
        <Row label="Maximaal bod" value={euro(Math.max(0, r.maxBod))} big />
        <small className="muted">Het hoogste bedrag dat je kunt betalen en nog {euro(input.gewensteWinst)} winst maakt.</small>
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
