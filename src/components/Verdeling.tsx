import type { Auto } from '../types'
import { euro, winst } from '../calc'
import { afrekening, inVoorraad, naam, openSaldo, PARTNERS, teVerrekenen, wieBetaaltWie } from '../verdeling'

interface Props {
  autos: Auto[]
  opslaan: (a: Auto) => void
}

export default function Verdeling({ autos, opslaan }: Props) {
  const open = teVerrekenen(autos)
  const betaling = wieBetaaltWie(openSaldo(autos))
  const voorraad = inVoorraad(autos)
  const verkocht = autos.filter((a) => a.status === 'verkocht')
  const totaleWinst = verkocht.reduce((s, a) => s + (winst(a) ?? 0), 0)

  function verreken() {
    const tekst = betaling
      ? `Heeft ${naam(betaling.van)} ${euro(betaling.bedrag)} aan ${naam(betaling.aan)} betaald? De ${open.length} auto('s) worden dan als verrekend gemarkeerd.`
      : `De ${open.length} auto('s) als verrekend markeren?`
    if (confirm(tekst)) open.forEach((a) => opslaan({ ...a, verrekend: true }))
  }

  return (
    <section className="stack">
      <div className={`card saldo-kaart ${betaling ? '' : 'gelijk'}`}>
        <span className="muted">Openstaand</span>
        {betaling ? (
          <>
            <strong className="saldo-bedrag">{euro(betaling.bedrag)}</strong>
            <span><strong>{naam(betaling.van)}</strong> betaalt aan <strong>{naam(betaling.aan)}</strong></span>
          </>
        ) : (
          <>
            <strong className="saldo-bedrag">Alles gelijk ✓</strong>
            <span className="muted">Niemand hoeft iets te betalen.</span>
          </>
        )}
        {open.length > 0 && (
          <>
            <small className="muted">Over {open.length} verkochte auto('s) die nog niet verrekend zijn.</small>
            <button onClick={verreken}>Markeer als verrekend</button>
          </>
        )}
      </div>

      <div className="kpis">
        <div className="kpi card"><span className="muted">Totale winst samen</span><strong className={totaleWinst >= 0 ? 'pos' : 'neg'}>{euro(totaleWinst)}</strong></div>
        {PARTNERS.map((p) => (
          <div key={p.id} className="kpi card">
            <span className="muted">{p.naam}</span>
            <strong>{euro(totaleWinst / 2)}</strong>
            <small className="muted">winst · {euro(voorraad[p.id])} in voorraad</small>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Nog te verrekenen</h2>
        {open.length === 0 ? (
          <p className="muted">Geen openstaande verkopen.</p>
        ) : (
          <ul className="verdeel-lijst">
            {open.map((a) => <AutoAfrekening key={a.id} auto={a} />)}
          </ul>
        )}
      </div>

      <p className="muted small uitleg">
        Bij verkoop krijgt ieder zijn eigen inleg (aankoop en kosten) terug en wordt de winst gedeeld door twee.
        Vul bij een auto in wie de aankoop en de kosten betaalde en wie het geld van de verkoop ontving.
      </p>
    </section>
  )
}

function AutoAfrekening({ auto: a }: { auto: Auto }) {
  const r = afrekening(a)
  return (
    <li>
      <div className="verdeel-kop">
        <strong>{a.merk} {a.model}</strong>
        <span className={(winst(a) ?? 0) >= 0 ? 'pos' : 'neg'}>{euro(winst(a) ?? 0)} winst</span>
      </div>
      <table className="verdeel-tabel">
        <thead><tr><th></th>{PARTNERS.map((p) => <th key={p.id} className="num">{p.naam}</th>)}</tr></thead>
        <tbody>
          <tr><td>Betaald</td>{PARTNERS.map((p) => <td key={p.id} className="num">{euro(r.betaald[p.id])}</td>)}</tr>
          <tr><td>Ontvangen</td>{PARTNERS.map((p) => <td key={p.id} className="num">{euro(r.ontvangen[p.id])}</td>)}</tr>
          <tr><td>Recht op</td>{PARTNERS.map((p) => <td key={p.id} className="num">{euro(r.recht[p.id])}</td>)}</tr>
        </tbody>
      </table>
    </li>
  )
}
