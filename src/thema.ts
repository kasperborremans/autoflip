import { useState } from 'react'

export type Thema = 'licht' | 'donker' | 'systeem'

const KEY = 'autoflip.thema'

function lees(): Thema {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'licht' || t === 'donker' ? t : 'systeem'
  } catch {
    return 'systeem'
  }
}

/** Zet het thema op <html>; de kleuren zelf staan in styles.css. */
export function pasThemaToe(thema: Thema = lees()) {
  const root = document.documentElement
  if (thema === 'systeem') delete root.dataset.theme
  else root.dataset.theme = thema
  const donker = thema === 'donker' || (thema === 'systeem' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', donker ? '#0f1115' : '#f5f6f8')
}

export function useThema() {
  const [thema, setThema] = useState<Thema>(lees)
  const kies = (t: Thema) => {
    try {
      localStorage.setItem(KEY, t)
    } catch {
      // Niet opgeslagen (bv. privévenster); geldt dan alleen voor deze sessie.
    }
    pasThemaToe(t)
    setThema(t)
  }
  return [thema, kies] as const
}
