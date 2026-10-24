import { useEffect, useState } from 'react'

const QUERY = '(max-width: 700px)'

/** True op telefoonformaat; volgt het scherm als het draait of van grootte verandert. */
export function useMobiel() {
  const [mobiel, setMobiel] = useState(() => matchMedia(QUERY).matches)
  useEffect(() => {
    const mq = matchMedia(QUERY)
    const onChange = () => setMobiel(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobiel
}
