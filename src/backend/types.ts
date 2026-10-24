import type { Auto } from '../types'

export interface Backend {
  mode: 'lokaal' | 'gedeeld'
  list(): Promise<Auto[]>
  save(auto: Auto): Promise<void>
  saveAll(autos: Auto[]): Promise<void>
  /** Verwijdert de auto inclusief foto's. */
  remove(auto: Auto): Promise<void>
  /** Slaat een foto op en geeft het opslagpad terug. */
  uploadFoto(autoId: string, foto: Blob): Promise<string>
  deleteFotos(paths: string[]): Promise<void>
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
