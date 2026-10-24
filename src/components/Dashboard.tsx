import type { Auto, Status } from '../types'
import { STATUS_LABELS } from '../types'
import { dagenInBezit, euro, geinvesteerd, winst } from '../calc'

export default function Dashboard({ autos }: { autos: Auto[] }) {
  const verkocht = autos.filter((a) => a.status === 'verkocht')
  const actief = autos.filter((a) => a.status !== 'verkocht')

  const gerealiseerd = verkocht.reduce((s, a) => s + (winst(a) ?? 0), 0)
  const kapitaal = actief.reduce((s, a) => s + geinvesteerd(a), 0)
  const verwacht = actief.reduce((s, a) => s + (winst(a) ?? 0), 0)
  const gemWinst = verkocht.length ? gerealiseerd / verkocht.length : 0
  const gemDagen = verkocht.length ? verkocht.reduce((s, a) => s + dagenInBezit(a), 0) / verkocht.length : 0

  const perStatus = (Object.keys(STATUS_LABELS) as Status[]).map((s) => ({
    status: s,
    aantal: autos.filter((a) => a.status === s).length,
  }))

  const top = [...verkocht].sort((a, b) => (winst(b) ?? 0) - (winst(a) ?? 0)).slice(0, 5)

  return (
    <section className="stack">
      <div className="kpis">
        <Kpi label="Gerealiseerde winst" value={euro(gerealiseerd)} tone={gerealiseerd >= 0 ? 'pos' : 'neg'} />
        <Kpi label="Kapitaal in voorraad" value={euro(kapitaal)} />
        <Kpi label="Verwachte winst voorraad" value={euro(verwacht)} hint="op basis van vraagprijs" />
        <Kpi label="Gem. winst per auto" value={euro(gemWinst)} />
        <Kpi label="Gem. dagen tot verkoop" value={Math.round(gemDagen).toString()} />
      </div>

      <div className="card">
        <h2>Status</h2>
        <div className="status-row">
          {perStatus.map((p) => (
            <div key={p.status} className={`status-chip s-${p.status}`}>
              <strong>{p.aantal}</strong> {STATUS_LABELS[p.status]}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Beste flips</h2>
        {top.length === 0 ? (
          <p className="muted">Nog geen verkochte auto's. Voeg er een toe onder "Auto's".</p>
        ) : (
          <table>
            <thead>
              <tr><th>Auto</th><th className="num">Geïnvesteerd</th><th className="num">Verkocht</th><th className="num">Winst</th></tr>
            </thead>
            <tbody>
              {top.map((a) => (
                <tr key={a.id}>
                  <td>{a.merk} {a.model}</td>
                  <td className="num">{euro(geinvesteerd(a))}</td>
                  <td className="num">{euro(a.verkoopprijs ?? 0)}</td>
                  <td className={`num ${(winst(a) ?? 0) >= 0 ? 'pos' : 'neg'}`}>{euro(winst(a) ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="kpi card">
      <span className="muted">{label}</span>
      <strong className={tone}>{value}</strong>
      {hint && <small className="muted">{hint}</small>}
    </div>
  )
}
