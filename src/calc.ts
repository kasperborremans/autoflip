import type { Auto } from './types'

export const euro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export const pct = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'percent', maximumFractionDigits: 1 }).format(n)

export const totaleKosten = (a: Auto) => a.kosten.reduce((s, k) => s + k.bedrag, 0)

export const geinvesteerd = (a: Auto) => a.aankoopprijs + totaleKosten(a)

/** Gerealiseerde winst bij verkochte auto's, anders verwachte winst op basis van de vraagprijs. */
export function winst(a: Auto): number | undefined {
  const opbrengst = a.status === 'verkocht' ? a.verkoopprijs : a.vraagprijs
  return opbrengst === undefined ? undefined : opbrengst - geinvesteerd(a)
}

export function dagenInBezit(a: Auto): number {
  const eind = a.status === 'verkocht' && a.verkoopdatum ? new Date(a.verkoopdatum) : new Date()
  const ms = eind.getTime() - new Date(a.aankoopdatum).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

export interface CalcInput {
  verwachteVerkoopprijs: number
  aankoopprijs: number
  reparatie: number
  overig: number
  gewensteWinst: number
}

export function calculator(i: CalcInput) {
  const kosten = i.reparatie + i.overig
  const investering = i.aankoopprijs + kosten
  const winst = i.verwachteVerkoopprijs - investering
  const rendement = investering > 0 ? winst / investering : 0
  const maxBod = i.verwachteVerkoopprijs - kosten - i.gewensteWinst
  return { kosten, investering, winst, rendement, maxBod }
}
