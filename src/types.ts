export type Status = 'gekocht' | 'in-reparatie' | 'te-koop' | 'verkocht'

export const STATUS_LABELS: Record<Status, string> = {
  gekocht: 'Gekocht',
  'in-reparatie': 'In reparatie',
  'te-koop': 'Te koop',
  verkocht: 'Verkocht',
}

export interface Kost {
  id: string
  omschrijving: string
  bedrag: number
  datum: string
}

export interface Auto {
  id: string
  merk: string
  model: string
  bouwjaar?: number
  kilometerstand?: number
  kenteken?: string
  status: Status
  aankoopprijs: number
  aankoopdatum: string
  kosten: Kost[]
  vraagprijs?: number
  verkoopprijs?: number
  verkoopdatum?: string
  notities: string
  /** Opslagpaden van foto's; de eerste is de hoofdfoto. */
  fotos: string[]
}
