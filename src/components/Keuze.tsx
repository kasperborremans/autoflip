interface Props<T extends string> {
  waarde: T
  opties: { waarde: T; label: string }[]
  onChange: (w: T) => void
  klein?: boolean
  label?: string
}

/** Schakelaar met een paar vaste keuzes, zoals Kasper / Lenno / Samen. */
export default function Keuze<T extends string>({ waarde, opties, onChange, klein, label }: Props<T>) {
  return (
    <div className={`keuze ${klein ? 'klein' : ''}`} role="radiogroup" aria-label={label}>
      {opties.map((o) => (
        <button
          key={o.waarde}
          type="button"
          role="radio"
          aria-checked={waarde === o.waarde}
          className={waarde === o.waarde ? 'active' : ''}
          onClick={() => onChange(o.waarde)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
