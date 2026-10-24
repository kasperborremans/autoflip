import { useEffect, useState } from 'react'
import { backend } from '../backend'

/** Laadt een opgeslagen foto via de backend (lokaal of een tijdelijke Supabase-link). */
export default function Foto({ path, className, onClick }: { path: string; className?: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    let actief = true
    backend.fotoUrl(path).then((u) => actief && setUrl(u)).catch(() => {})
    return () => { actief = false }
  }, [path])

  return url ? <img src={url} alt="" className={className} onClick={onClick} loading="lazy" /> : <div className={`${className ?? ''} foto-leeg`} />
}
