import { useEffect, useState } from 'react'
import type { Auto } from './types'

const KEY = 'autoflip.autos.v1'

function load(): Auto[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Auto[]) : []
  } catch {
    return []
  }
}

function save(autos: Auto[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(autos))
  } catch {
    // Opslag niet beschikbaar (bv. privévenster); data blijft dan alleen in deze sessie.
  }
}

export function useAutos() {
  const [autos, setAutos] = useState<Auto[]>(load)
  useEffect(() => save(autos), [autos])
  return [autos, setAutos] as const
}

export function exportJson(autos: Auto[]) {
  const blob = new Blob([JSON.stringify(autos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `autoflip-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importJson(file: File): Promise<Auto[]> {
  const data = JSON.parse(await file.text())
  if (!Array.isArray(data)) throw new Error('Ongeldig bestand: verwacht een lijst met auto\'s.')
  return data as Auto[]
}

export const newId = () => crypto.randomUUID()
export const today = () => new Date().toISOString().slice(0, 10)
