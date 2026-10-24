import type { Auto } from './types'

export const newId = () => crypto.randomUUID()
export const today = () => new Date().toISOString().slice(0, 10)

export function exportJson(autos: Auto[]) {
  const blob = new Blob([JSON.stringify(autos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `autoflip-${today()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importJson(file: File): Promise<Auto[]> {
  const data = JSON.parse(await file.text())
  if (!Array.isArray(data)) throw new Error("Ongeldig bestand: verwacht een lijst met auto's.")
  return data as Auto[]
}

/** Verkleint een foto tot maximaal `max` pixels breed/hoog als JPEG, zodat uploads snel en klein blijven. */
export async function verkleinFoto(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const schaal = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * schaal)
  canvas.height = Math.round(bitmap.height * schaal)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Foto verwerken mislukt'))), 'image/jpeg', 0.82),
  )
}
