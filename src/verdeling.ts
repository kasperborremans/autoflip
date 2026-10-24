import type { Auto, Betaler } from './types'
import { winst } from './calc'

export type PartnerId = Exclude<Betaler, 'samen'>

export const PARTNERS: { id: PartnerId; naam: string }[] = [
  { id: 'kasper', naam: 'Kasper' },
  { id: 'lenno', naam: 'Lenno' },
]

export const BETALER_LABELS: Record<Betaler, string> = { kasper: 'Kasper', lenno: 'Lenno', samen: 'Samen' }

export type PerPartner = Record<PartnerId, number>

const nul = (): PerPartner => ({ kasper: 0, lenno: 0 })

/** Verdeelt een bedrag over de partners; zonder betaler of bij 'samen' ieder de helft. */
export function verdeel(bedrag: number, wie: Betaler = 'samen'): PerPartner {
  if (wie === 'samen') return { kasper: bedrag / 2, lenno: bedrag / 2 }
  return { ...nul(), [wie]: bedrag }
}

const optellen = (...lijst: PerPartner[]): PerPartner =>
  lijst.reduce((som, p) => ({ kasper: som.kasper + p.kasper, lenno: som.lenno + p.lenno }), nul())

/** Wat ieder in deze auto gestoken heeft: aankoop plus kosten. */
export const betaald = (a: Auto): PerPartner =>
  optellen(verdeel(a.aankoopprijs, a.betaaldDoor), ...a.kosten.map((k) => verdeel(k.bedrag, k.betaaldDoor)))

export const ontvangen = (a: Auto): PerPartner =>
  a.status === 'verkocht' ? verdeel(a.verkoopprijs ?? 0, a.ontvangenDoor) : nul()

export interface Afrekening {
  betaald: PerPartner
  ontvangen: PerPartner
  /** Waar ieder recht op heeft: eigen inleg terug plus de helft van de winst. */
  recht: PerPartner
  /** Positief: deze partner heeft te veel ontvangen en moet dat aan de ander betalen. */
  saldo: PerPartner
}

export function afrekening(a: Auto): Afrekening {
  const b = betaald(a)
  const o = ontvangen(a)
  const w = a.status === 'verkocht' ? winst(a) ?? 0 : 0
  const recht = { kasper: b.kasper + w / 2, lenno: b.lenno + w / 2 }
  return { betaald: b, ontvangen: o, recht, saldo: { kasper: o.kasper - recht.kasper, lenno: o.lenno - recht.lenno } }
}

/** Verkochte auto's waarvan de winst nog niet onderling verrekend is. */
export const teVerrekenen = (autos: Auto[]) => autos.filter((a) => a.status === 'verkocht' && !a.verrekend)

export function openSaldo(autos: Auto[]): PerPartner {
  return optellen(...teVerrekenen(autos).map((a) => afrekening(a).saldo))
}

/** Hoeveel ieder nog vast heeft zitten in auto's die nog niet verkocht zijn. */
export function inVoorraad(autos: Auto[]): PerPartner {
  return optellen(...autos.filter((a) => a.status !== 'verkocht' && a.status !== 'interessant').map(betaald))
}

/** Wie wie hoeveel moet betalen, of null als het (vrijwel) gelijk staat. */
export function wieBetaaltWie(saldo: PerPartner): { van: PartnerId; aan: PartnerId; bedrag: number } | null {
  const bedrag = Math.abs(saldo.kasper)
  if (bedrag < 0.5) return null
  return saldo.kasper > 0 ? { van: 'kasper', aan: 'lenno', bedrag } : { van: 'lenno', aan: 'kasper', bedrag }
}

export const naam = (id: PartnerId) => PARTNERS.find((p) => p.id === id)!.naam
