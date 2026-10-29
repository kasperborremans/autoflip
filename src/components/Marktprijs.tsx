import { useState } from 'react'
import type { AutoGegevens } from '../advies'
import { euro, pct } from '../calc'
import { leesAdvertenties, schatPrijs, zoekLinks } from '../markt'

interface Props {
  auto: AutoGegevens
  onGebruik: (prijs: number) => void
}

/** Vergelijkt met te koop staande auto's in België en schat zo de verkoopprijs. */
export default function Marktprijs({ auto, onGebruik }: Props) {
  const [tekst, setTekst] = useState('')
  const [marge, setMarge] = useState(5)
  const links = zoekLinks(auto)
  const s = schatPrijs(leesAdvertenties(tekst), auto.kilometerstand, marge / 100)

  return (
    <div className="card stack">
      <h2>Marktprijs in België</h2>
      {links.length ? (
        <>
          <p className="uitleg muted small">
            Open de zoekopdracht (zelfde bouwjaar ±1, km-stand ±40.000{auto.kw ? ', vermogen ±10%' : ''}{auto.transmissie ? ', versnellingsbak' : ''})
            en plak de vraagprijzen van vergelijkbare auto's hieronder.
          </p>
          <div className="link-rij">
            {links.map((l) => (
              <a key={l.naam} className="knop markt-link" href={l.url} target="_blank" rel="noreferrer">{l.naam} ↗</a>
            ))}
          </div>
        </>
      ) : (
        <p className="uitleg muted small">Vul hierboven merk en model in voor zoeklinks naar AutoScout24.be en 2dehands.be.</p>
      )}

      <label className="field">
        <span>Vraagprijzen van vergelijkbare auto's</span>
        <textarea
          rows={5}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder={'Eén per regel, eventueel met km-stand:\n€ 8.950  120.000 km\n€ 9.400  95.000 km\n7999'}
        />
        <small className="muted">Je mag ook hele stukken advertentietekst plakken; bedragen met € worden herkend als prijs.</small>
      </label>
      <label className="field">
        <span>Onderhandelingsmarge (%)</span>
        <input type="number" inputMode="numeric" min={0} max={30} value={marge} onChange={(e) => setMarge(Number(e.target.value))} />
        <small className="muted">Kopers bieden meestal wat onder de vraagprijs.</small>
      </label>

      {s && (
        <div className="summary verdeel-samenvatting">
          <div className="row"><span>Vergeleken auto's</span><strong>{s.aantal}{s.weggelaten > 0 && <span className="muted small"> ({s.weggelaten} uitschieter{s.weggelaten > 1 ? 's' : ''} weggelaten)</span>}</strong></div>
          <div className="row"><span>Laagste – hoogste</span><strong>{euro(s.laagste)} – {euro(s.hoogste)}</strong></div>
          <div className="row"><span>Middelste vraagprijs</span><strong>{euro(s.vraagprijs)}</strong></div>
          {s.kmCorrectie !== 0 && (
            <div className="row">
              <span>Km-correctie <span className="muted small">(gem. {Math.round(s.gemKm!).toLocaleString('nl-BE')} km)</span></span>
              <strong className={s.kmCorrectie > 0 ? 'pos' : 'neg'}>{s.kmCorrectie > 0 ? '+' : ''}{pct(s.kmCorrectie)}</strong>
            </div>
          )}
          <div className="row big"><span>Geschatte verkoopprijs</span><strong>{euro(s.schatting)}</strong></div>
          {s.aantal < 3 && <small className="warn">Nog weinig vergelijkingen — plak er liefst 5 of meer.</small>}
          <button type="button" onClick={() => onGebruik(s.schatting)}>Gebruik als verwachte verkoopprijs</button>
        </div>
      )}
    </div>
  )
}
