import type { Auto } from './types'
import { dagenInBezit, winst } from './calc'
import { type Brandstof, type ModelInfo, type Probleem, type Verkoop, zelfdeMerk, zoekModel } from './autokennis'

export interface AutoGegevens {
  merk: string
  model: string
  bouwjaar?: number
  kilometerstand?: number
  brandstof?: Brandstof
  transmissie?: 'hand' | 'automaat'
}

export const VERKOOP_LABELS: Record<Verkoop, string> = {
  snel: 'Verkoopt snel',
  normaal: 'Verkoopt gemiddeld',
  traag: 'Verkoopt traag',
}

const TRAGER: Record<Verkoop, Verkoop> = { snel: 'normaal', normaal: 'traag', traag: 'traag' }

function speelt(p: Probleem, a: AutoGegevens): boolean {
  if (a.bouwjaar && p.van && a.bouwjaar < p.van) return false
  if (a.bouwjaar && p.tot && a.bouwjaar > p.tot) return false
  if (a.brandstof && p.brandstof && a.brandstof !== p.brandstof) return false
  if (p.automaat && a.transmissie === 'hand') return false
  return true
}

export interface Advies {
  info?: ModelInfo
  verkoop?: Verkoop
  problemen: Probleem[]
  waarschuwingen: string[]
  pluspunten: string[]
  /** Duurste ernstige mankement dat bij deze auto kan spelen. */
  risico: number
}

export function advies(a: AutoGegevens): Advies {
  const info = zoekModel(a.merk, a.model)
  const problemen = (info?.problemen ?? []).filter((p) => speelt(p, a)).sort((x, y) => (x.ernst === y.ernst ? 0 : x.ernst === 'hoog' ? -1 : 1))
  const waarschuwingen: string[] = []
  const pluspunten: string[] = []
  let verkoop = info?.verkoop
  const leeftijd = a.bouwjaar ? new Date().getFullYear() - a.bouwjaar : undefined

  if (info?.verkoop === 'snel') pluspunten.push(info.waarom)
  else if (info) waarschuwingen.push(info.waarom)

  const km = a.kilometerstand
  if (km !== undefined && km >= 250_000) {
    waarschuwingen.push('Meer dan 250.000 km: veel kopers haken af. Reken op een lagere prijs en een langere verkooptijd.')
    if (verkoop) verkoop = TRAGER[verkoop]
  } else if (km !== undefined && km >= 180_000) {
    waarschuwingen.push('Hoge kilometerstand: check het onderhoudsboekje en of grote beurten (riem, koppeling) al gedaan zijn.')
  } else if (km !== undefined && leeftijd !== undefined && leeftijd > 0 && km / leeftijd < 8_000) {
    pluspunten.push('Weinig kilometers voor de leeftijd — dat verkoopt goed (check wel de NAP-logica).')
  }

  if (leeftijd !== undefined && leeftijd >= 15) {
    waarschuwingen.push('Ouder dan 15 jaar: roest en slijtage nemen toe en kopers kunnen hem lastig financieren.')
    if (verkoop) verkoop = TRAGER[verkoop]
  }

  if (a.brandstof === 'diesel') {
    if (a.bouwjaar && a.bouwjaar < 2011) {
      waarschuwingen.push('Oude diesel: mag in steeds meer milieuzones niet meer in en de wegenbelasting is hoog — kleine groep kopers.')
      if (verkoop) verkoop = TRAGER[verkoop]
    } else {
      waarschuwingen.push('Diesel: hogere wegenbelasting, dus vooral interessant voor veelrijders. Dat maakt de groep kopers kleiner.')
    }
  }
  if (a.brandstof === 'lpg') {
    waarschuwingen.push('LPG: kleine groep kopers. Check de LPG-keuring en de tankdatum (de tank moet na 10 jaar vervangen worden).')
    if (verkoop) verkoop = TRAGER[verkoop]
  }
  if (a.brandstof === 'elektrisch' && a.bouwjaar && a.bouwjaar < 2018) {
    waarschuwingen.push('Oudere EV: kleine actieradius en accuslijtage. Vraag een accutest (State of Health) voordat je koopt.')
  }
  if (a.transmissie === 'automaat' && !problemen.some((p) => p.automaat)) {
    pluspunten.push('Automaat: steeds meer kopers willen er een.')
  }

  if (a.merk.trim() && a.model.trim() && !info) {
    waarschuwingen.push('Over dit model hebben we geen specifieke info. Check onderhoudshistorie, NAP en roest extra goed.')
  }

  const risico = Math.max(0, ...problemen.filter((p) => p.ernst === 'hoog').map((p) => p.kosten ?? 0))
  return { info, verkoop, problemen, waarschuwingen, pluspunten, risico }
}

/** Hoe eerdere verkochte auto's van hetzelfde model het deden. */
export function eigenHistorie(autos: Auto[], merk: string, model: string) {
  const info = zoekModel(merk, model)
  const verkocht = autos.filter((a) => {
    if (a.status !== 'verkocht' || !zelfdeMerk(a.merk, merk)) return false
    return info ? zoekModel(a.merk, a.model) === info : a.model.trim().toLowerCase() === model.trim().toLowerCase()
  })
  if (!verkocht.length || !model.trim()) return undefined
  return {
    aantal: verkocht.length,
    gemDagen: Math.round(verkocht.reduce((s, a) => s + dagenInBezit(a), 0) / verkocht.length),
    gemWinst: verkocht.reduce((s, a) => s + (winst(a) ?? 0), 0) / verkocht.length,
  }
}
