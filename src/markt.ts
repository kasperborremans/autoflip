import type { AutoGegevens } from './advies'
import type { Brandstof } from './autokennis'
import { merkNaam, raadBrandstof, zoekModel } from './autokennis'

export interface Advertentie {
  prijs: number
  km?: number
}

/** Bedragen als "8.950", "€ 8 950,-" of "8950". */
const GETAL = /\d{1,3}(?:[.\s]\d{3})+(?!\d)|\d+/g
const getal = (s: string) => Number(s.replace(/[.\s]/g, ''))

/**
 * Leest geplakte advertenties: per regel een of meer prijzen; een getal met "km" erachter is de
 * kilometerstand van de prijs op dezelfde regel. "8950 120.000 km" en "8950 9400 7999" werken allebei.
 */
export function leesAdvertenties(tekst: string): Advertentie[] {
  return tekst.split('\n').flatMap((regel) => {
    const prijzen: number[] = []
    let km: number | undefined
    // Staat er een €-teken op de regel, dan tellen alleen bedragen met € als prijs (niet het bouwjaar).
    const metEuro = regel.includes('€')
    for (const m of regel.matchAll(GETAL)) {
      const n = getal(m[0])
      const voor = regel.slice(0, m.index)
      const na = regel.slice(m.index! + m[0].length)
      if (/^\s*km/i.test(na)) km = n
      else if (/^\s*(kw|pk|ps|cc)\b/i.test(na)) continue
      else if (n >= 300 && n <= 500_000 && (!metEuro || /€\s*$/.test(voor) || /^\s*€/.test(na))) prijzen.push(n)
    }
    return prijzen.map((prijs) => ({ prijs, km: prijzen.length === 1 ? km : undefined }))
  })
}

const mediaan = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const h = Math.floor(s.length / 2)
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2
}

/** Per 1.000 km verschil met de vergelijkbare auto's: 0,15% van de prijs. */
const KM_FACTOR = 0.0015 / 1000

export function schatPrijs(advertenties: Advertentie[], km: number | undefined, marge: number) {
  if (!advertenties.length) return undefined
  // Uitschieters (schadeauto's, typfouten) tellen niet mee.
  const m0 = mediaan(advertenties.map((a) => a.prijs))
  const bruikbaar = advertenties.filter((a) => a.prijs >= m0 * 0.6 && a.prijs <= m0 * 1.6)
  const prijzen = bruikbaar.map((a) => a.prijs)
  const vraagprijs = mediaan(prijzen)

  const kms = bruikbaar.flatMap((a) => (a.km === undefined ? [] : [a.km]))
  const gemKm = kms.length ? kms.reduce((s, k) => s + k, 0) / kms.length : undefined
  const kmCorrectie = km !== undefined && gemKm !== undefined
    ? Math.max(-0.2, Math.min(0.2, (gemKm - km) * KM_FACTOR))
    : 0

  const schatting = Math.round((vraagprijs * (1 + kmCorrectie) * (1 - marge)) / 50) * 50
  return {
    aantal: prijzen.length,
    weggelaten: advertenties.length - prijzen.length,
    laagste: Math.min(...prijzen),
    hoogste: Math.max(...prijzen),
    vraagprijs,
    gemKm,
    kmCorrectie,
    schatting,
  }
}

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const AS24_BRANDSTOF: Record<Brandstof, string> = { benzine: 'B', diesel: 'D', hybride: '2', elektrisch: 'E', lpg: 'L' }

/** Zoeklinks naar Belgische advertentiesites met dezelfde auto, zo exact mogelijk gefilterd. */
export function zoekLinks(a: AutoGegevens) {
  const merk = merkNaam(a.merk)
  const model = zoekModel(a.merk, a.model)?.model ?? a.model.trim().split(/\s+/)[0] ?? ''
  if (!merk || !model) return []

  const p = new URLSearchParams({ atype: 'C', cy: 'B', sort: 'price', desc: '0', ustate: 'N,U' })
  if (a.bouwjaar) {
    p.set('fregfrom', String(a.bouwjaar - 1))
    p.set('fregto', String(a.bouwjaar + 1))
  }
  if (a.kilometerstand !== undefined) {
    p.set('kmfrom', String(Math.max(0, Math.round((a.kilometerstand - 40_000) / 10_000) * 10_000)))
    p.set('kmto', String(Math.round((a.kilometerstand + 40_000) / 10_000) * 10_000))
  }
  const brandstof = a.brandstof ?? raadBrandstof(a.motor)
  if (brandstof) p.set('fuel', AS24_BRANDSTOF[brandstof])
  if (a.transmissie) p.set('gear', a.transmissie === 'automaat' ? 'A' : 'M')
  if (a.kw) {
    // Zelfde motor: vermogen binnen ±10%.
    p.set('powertype', 'kw')
    p.set('powerfrom', String(Math.floor(a.kw * 0.9)))
    p.set('powerto', String(Math.ceil(a.kw * 1.1)))
  }

  const zoekterm = [merk, model, a.motor].filter(Boolean).join(' ')
  return [
    { naam: 'AutoScout24.be', url: `https://www.autoscout24.be/nl/lst/${slug(merk)}/${slug(model)}?${p}` },
    { naam: '2dehands.be', url: `https://www.2dehands.be/q/${encodeURIComponent(zoekterm.toLowerCase()).replace(/%20/g, '+')}/` },
  ]
}
