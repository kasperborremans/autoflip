import type { Auto } from '../types'
import { newId } from '../util'

export interface Backend {
  mode: 'lokaal' | 'gedeeld'
  list(): Promise<Auto[]>
  save(auto: Auto): Promise<void>
  saveAll(autos: Auto[]): Promise<void>
  /** Verwijdert de auto inclusief foto's en bonnetjes. */
  remove(auto: Auto): Promise<void>
  /** Slaat een foto op en geeft het opslagpad terug. */
  uploadFoto(autoId: string, foto: Blob): Promise<string>
  /** Slaat een bonnetje (foto of PDF) op en geeft het opslagpad terug. */
  uploadBonnetje(autoId: string, bestand: Blob, soort: 'jpg' | 'pdf'): Promise<string>
  /** Wist foto's of bonnetjes. */
  deleteFotos(paths: string[]): Promise<void>
  /** Geeft een (tijdelijke) URL voor een foto of bonnetje. */
  fotoUrl(path: string): Promise<string>
  /** Roept onChange aan als de gegevens elders gewijzigd zijn; geeft een afmeldfunctie terug. */
  subscribe(onChange: () => void): () => void
}

/** Vult velden aan die in oudere opgeslagen gegevens kunnen ontbreken. */
export const normaliseer = (a: Auto): Auto => ({
  ...a,
  kosten: a.kosten ?? [],
  fotos: a.fotos ?? [],
  notities: a.notities ?? '',
  verrekend: a.verrekend ?? false,
})

/** Opslagpaden van alle foto's en bonnetjes van een auto. */
export const bestandenVan = (a: Auto): string[] => [...new Set([...a.fotos, ...bonnetjesVan(a)])]

export const bonnetjesVan = (a: Auto): string[] => a.kosten.flatMap((k) => (k.bonnetje ? [k.bonnetje] : []))

export const bonnetjePad = (autoId: string, soort: 'jpg' | 'pdf') => `${autoId}/bonnetjes/${newId()}.${soort}`

export const BONNETJE_TYPE = { jpg: 'image/jpeg', pdf: 'application/pdf' } as const
