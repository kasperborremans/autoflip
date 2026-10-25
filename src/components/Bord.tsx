import { useEffect, useRef, useState } from 'react'
import type { Auto, Status } from '../types'
import { STATUS_LABELS, STATUSSEN } from '../types'
import { euro, samenvatting } from '../calc'
import Foto from './Foto'

interface Props {
  autos: Auto[]
  onKies: (a: Auto) => void
  onVerplaats: (a: Auto, status: Status) => void
}

interface Sleep {
  auto: Auto
  x: number
  y: number
  /** Waar binnen de kaart je hem vastpakte, zodat hij niet verspringt. */
  dx: number
  dy: number
  breedte: number
  doel: Status | null
}

/** Hoe lang je op een telefoon een kaart vasthoudt voordat hij meekomt; korter vegen blijft scrollen. */
const VASTHOUDEN_MS = 250
const DREMPEL_PX = 6

/**
 * Kanbanbord met een kolom per stage. Kaarten sleep je met de muis, of op een telefoon door ze even
 * vast te houden. Gewone pointer-events in plaats van HTML5 drag & drop, want dat werkt niet op touch.
 */
export default function Bord({ autos, onKies, onVerplaats }: Props) {
  const [sleep, setSleep] = useState<Sleep | null>(null)
  const bordRef = useRef<HTMLDivElement>(null)
  // Een losgelaten sleep mag niet ook nog als klik tellen (en het formulier openen).
  const negeerKlik = useRef(false)
  const opruimen = useRef<() => void>()

  useEffect(() => () => opruimen.current?.(), [])

  function start(e: React.PointerEvent, auto: Auto) {
    if (e.button !== 0) return
    const kaart = e.currentTarget as HTMLElement
    const r = kaart.getBoundingClientRect()
    const touch = e.pointerType !== 'mouse'
    const begin = { x: e.clientX, y: e.clientY }
    let actief: Sleep | null = null
    let laatste = begin
    let frame = 0

    const doelOnder = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-status]')
      return (el?.dataset.status as Status | undefined) ?? null
    }

    const beginSlepen = () => {
      actief = { auto, x: laatste.x, y: laatste.y, dx: begin.x - r.left, dy: begin.y - r.top, breedte: r.width, doel: auto.status }
      setSleep(actief)
      navigator.vibrate?.(15)
      frame = requestAnimationFrame(autoScroll)
    }

    // Bij de rand van het scherm of het bord vanzelf meescrollen.
    const autoScroll = () => {
      if (!actief) return
      const bord = bordRef.current
      const rand = 48
      if (bord) {
        const br = bord.getBoundingClientRect()
        if (laatste.x < br.left + rand) bord.scrollLeft -= 8
        else if (laatste.x > br.right - rand) bord.scrollLeft += 8
      }
      if (laatste.y < rand + 60) window.scrollBy(0, -10)
      else if (laatste.y > innerHeight - rand - 90) window.scrollBy(0, 10)
      const doel = doelOnder(laatste.x, laatste.y)
      if (doel !== actief.doel) setSleep((s) => (s ? { ...s, doel } : s))
      actief = { ...actief, doel }
      frame = requestAnimationFrame(autoScroll)
    }

    const timer = touch ? window.setTimeout(beginSlepen, VASTHOUDEN_MS) : 0

    const beweeg = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return
      laatste = { x: ev.clientX, y: ev.clientY }
      const afstand = Math.hypot(ev.clientX - begin.x, ev.clientY - begin.y)
      if (!actief) {
        if (touch) { if (afstand > DREMPEL_PX * 2) stop() } // vegen: gewoon scrollen
        else if (afstand > DREMPEL_PX) beginSlepen()
        return
      }
      const doel = doelOnder(ev.clientX, ev.clientY)
      actief = { ...actief, x: ev.clientX, y: ev.clientY, doel }
      setSleep(actief)
    }

    const los = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return
      const klaar = actief
      stop()
      if (!klaar) return
      negeerKlik.current = true
      setTimeout(() => (negeerKlik.current = false), 0)
      if (ev.type === 'pointerup' && klaar.doel && klaar.doel !== auto.status) onVerplaats(auto, klaar.doel)
    }

    // Tijdens het slepen op touch niet de pagina laten scrollen.
    const blokkeerScroll = (ev: TouchEvent) => { if (actief) ev.preventDefault() }
    const blokkeerMenu = (ev: Event) => { if (touch) ev.preventDefault() }

    function stop() {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      actief = null
      setSleep(null)
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', los)
      window.removeEventListener('pointercancel', los)
      window.removeEventListener('touchmove', blokkeerScroll)
      window.removeEventListener('contextmenu', blokkeerMenu)
      opruimen.current = undefined
    }

    opruimen.current?.()
    opruimen.current = stop
    window.addEventListener('pointermove', beweeg)
    window.addEventListener('pointerup', los)
    window.addEventListener('pointercancel', los)
    window.addEventListener('touchmove', blokkeerScroll, { passive: false })
    window.addEventListener('contextmenu', blokkeerMenu)
  }

  return (
    <div className={`bord ${sleep ? 'aan-het-slepen' : ''}`} ref={bordRef}>
      {STATUSSEN.map((s) => {
        const kolom = autos.filter((a) => a.status === s)
        return (
          <div key={s} data-status={s} className={`kolom ${sleep?.doel === s && sleep.auto.status !== s ? 'doel' : ''}`}>
            <h3 className="kolom-kop">
              <span className={`stip s-${s}`} /> {STATUS_LABELS[s]} <span className="muted">{kolom.length}</span>
            </h3>
            <div className="kolom-kaarten">
              {kolom.map((a) => (
                <BordKaart
                  key={a.id}
                  auto={a}
                  className={sleep?.auto.id === a.id ? 'opgepakt' : ''}
                  onPointerDown={(e) => start(e, a)}
                  onClick={() => { if (!negeerKlik.current) onKies(a) }}
                />
              ))}
              {kolom.length === 0 && <div className="kolom-leeg muted small">Sleep een auto hierheen</div>}
            </div>
          </div>
        )
      })}
      {sleep && (
        <BordKaart
          auto={sleep.auto}
          className="zwevend"
          style={{ width: sleep.breedte, transform: `translate(${sleep.x - sleep.dx}px, ${sleep.y - sleep.dy}px) rotate(2deg)` }}
        />
      )}
    </div>
  )
}

interface KaartProps {
  auto: Auto
  className?: string
  style?: React.CSSProperties
  onPointerDown?: (e: React.PointerEvent) => void
  onClick?: () => void
}

function BordKaart({ auto: a, className = '', style, onPointerDown, onClick }: KaartProps) {
  const { w, toelichting, sub } = samenvatting(a)
  return (
    <div className={`bord-kaart card ${className}`} style={style} role="button" tabIndex={0} onPointerDown={onPointerDown} onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.() }}>
      {a.fotos[0] ? <Foto path={a.fotos[0]} className="bord-foto" /> : <div className="bord-foto foto-leeg">🚗</div>}
      <div className="bord-tekst">
        <strong className="kaart-titel">{a.merk} {a.model}</strong>
        <span className="muted small">{[a.bouwjaar, sub].filter(Boolean).join(' · ')}</span>
        <span className="small">
          <strong className={w === undefined ? 'muted' : w >= 0 ? 'pos' : 'neg'}>{w === undefined ? '—' : euro(w)}</strong>{' '}
          <span className="muted">{toelichting}</span>
        </span>
      </div>
    </div>
  )
}
