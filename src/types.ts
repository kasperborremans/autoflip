export type Status = 'interessant' | 'gekocht' | 'in-reparatie' | 'te-koop' | 'verkocht'

/** In volgorde van het traject dat een auto doorloopt. */
export const STATUS_LABELS: Record<Status, string> = {
  interessant: 'Op het oog',
  gekocht: 'Gekocht',
  'in-reparatie': 'In reparatie',
  'te-koop': 'Te koop',
  verkocht: 'Verkocht',
}

export const STATUSSEN = Object.keys(STATUS_LABELS) as Status[]

/** Wie iets betaald of ontvangen heeft; 'samen' telt voor ieder de helft. */
export type Betaler = 'kasper' | 'lenno' | 'samen'

export interface Kost {
  id: string
  omschrijving: string
  bedrag: number
  datum: string
  betaaldDoor?: Betaler
  /** Opslagpad van het bonnetje (foto of PDF). */
  bonnetje?: string
}

export interface Auto {
  id: string
  merk: string
  model: string
  bouwjaar?: number
  kilometerstand?: number
  kenteken?: string
  status: Status
  /** Bij 'Op het oog' de vraagprijs van de verkoper. */
  aankoopprijs: number
  aankoopdatum: string
  kosten: Kost[]
  /** Onze vraagprijs; bij 'Op het oog' de verwachte verkoopprijs. */
  vraagprijs?: number
  verkoopprijs?: number
  verkoopdatum?: string
  notities: string
  /** Opslagpaden van foto's; de eerste is de hoofdfoto. */
  fotos: string[]
  betaaldDoor?: Betaler
  ontvangenDoor?: Betaler
  /** De winst van deze verkochte auto is onderling verrekend. */
  verrekend: boolean
  /** Link naar de advertentie. */
  link?: string
}
