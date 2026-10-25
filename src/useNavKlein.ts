import { useEffect, useState } from 'react'

const DREMPEL = 6

/**
 * Of de navigatiebalk ingeklapt moet zijn: kleiner bij naar beneden scrollen,
 * weer volledig bij naar boven scrollen, bovenaan of helemaal onderaan de pagina.
 */
export function useNavKlein() {
  const [klein, setKlein] = useState(false)

  useEffect(() => {
    let vorige = window.scrollY
    let gepland = false
    const update = () => {
      gepland = false
      const y = window.scrollY
      const onderaan = y + window.innerHeight >= document.documentElement.scrollHeight - 4
      const verschil = y - vorige
      if (y < 40 || onderaan) setKlein(false)
      else if (verschil > DREMPEL) setKlein(true)
      else if (verschil < -DREMPEL) setKlein(false)
      if (Math.abs(verschil) > DREMPEL || y < 40) vorige = y
    }
    const onScroll = () => {
      if (gepland) return
      gepland = true
      requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return [klein, setKlein] as const
}
