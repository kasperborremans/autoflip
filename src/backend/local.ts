import type { Auto } from '../types'
import { newId } from '../util'
import { BONNETJE_TYPE, bestandenVan, bonnetjePad, normaliseer, type Backend } from './types'

const KEY = 'autoflip.autos.v1'

function lees(): Auto[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Auto[]).map(normaliseer) : []
  } catch {
    return []
  }
}

function schrijf(autos: Auto[]) {
  localStorage.setItem(KEY, JSON.stringify(autos))
}

// Foto's zijn te groot voor localStorage en gaan daarom in IndexedDB.
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('autoflip', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('fotos')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function fotoStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const d = await db()
  return new Promise((resolve, reject) => {
    const tx = d.transaction('fotos', mode)
    const req = fn(tx.objectStore('fotos'))
    tx.oncomplete = () => resolve(req ? req.result : undefined)
    tx.onerror = () => reject(tx.error)
  })
}

const urls = new Map<string, string>()

export const localBackend: Backend = {
  mode: 'lokaal',
  async list() {
    return lees()
  },
  async save(auto) {
    const autos = lees()
    schrijf(autos.some((a) => a.id === auto.id) ? autos.map((a) => (a.id === auto.id ? auto : a)) : [...autos, auto])
  },
  async saveAll(nieuw) {
    const ids = new Set(nieuw.map((a) => a.id))
    schrijf([...lees().filter((a) => !ids.has(a.id)), ...nieuw.map(normaliseer)])
  },
  async remove(auto) {
    schrijf(lees().filter((a) => a.id !== auto.id))
    await this.deleteFotos(bestandenVan(normaliseer(auto)))
  },
  async uploadFoto(autoId, foto) {
    const path = `${autoId}/${newId()}.jpg`
    await fotoStore('readwrite', (s) => s.put(foto, path))
    return path
  },
  async uploadBonnetje(autoId, bestand, soort) {
    const path = bonnetjePad(autoId, soort)
    // Het juiste type meegeven, zodat een PDF ook als PDF opent.
    const blob = bestand.type === BONNETJE_TYPE[soort] ? bestand : new Blob([bestand], { type: BONNETJE_TYPE[soort] })
    await fotoStore('readwrite', (s) => s.put(blob, path))
    return path
  },
  async deleteFotos(paths) {
    if (!paths.length) return
    await fotoStore('readwrite', (s) => paths.forEach((p) => s.delete(p)))
    paths.forEach((p) => {
      const url = urls.get(p)
      if (url) URL.revokeObjectURL(url)
      urls.delete(p)
    })
  },
  async fotoUrl(path) {
    let url = urls.get(path)
    if (!url) {
      const blob = await fotoStore<Blob>('readonly', (s) => s.get(path))
      if (!blob) throw new Error('Foto niet gevonden')
      url = URL.createObjectURL(blob)
      urls.set(path, url)
    }
    return url
  },
  subscribe(onChange) {
    const handler = (e: StorageEvent) => e.key === KEY && onChange()
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}
