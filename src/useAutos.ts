import { useCallback, useEffect, useState } from 'react'
import { backend } from './backend'
import type { Auto } from './types'

export function useAutos() {
  const [autos, setAutos] = useState<Auto[]>([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState<string | null>(null)

  const herlaad = useCallback(async () => {
    try {
      setAutos(await backend.list())
      setFout(null)
    } catch (e) {
      setFout((e as Error).message)
    } finally {
      setLaden(false)
    }
  }, [])

  useEffect(() => {
    herlaad()
    return backend.subscribe(herlaad)
  }, [herlaad])

  // Direct in beeld bijwerken; bij een fout opnieuw laden zodat het scherm klopt met de opslag.
  const metHerstel = (actie: Promise<void>) =>
    actie.catch((e) => {
      alert(`Opslaan mislukt: ${(e as Error).message}`)
      herlaad()
    })

  const opslaan = (auto: Auto) => {
    setAutos((prev) => (prev.some((a) => a.id === auto.id) ? prev.map((a) => (a.id === auto.id ? auto : a)) : [...prev, auto]))
    return metHerstel(backend.save(auto))
  }

  const verwijder = (auto: Auto) => {
    setAutos((prev) => prev.filter((a) => a.id !== auto.id))
    return metHerstel(backend.remove(auto))
  }

  const importeer = (nieuw: Auto[]) => metHerstel(backend.saveAll(nieuw).then(herlaad))

  return { autos, laden, fout, opslaan, verwijder, importeer }
}
