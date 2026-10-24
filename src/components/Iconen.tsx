const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

export const IconOverzicht = () => svg(<><path d="M3 12h4l3 8 4-16 3 8h4" /></>)
export const IconAuto = () =>
  svg(<><path d="M5 17H3v-5l2-5h11l4 5h1v5h-2" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /><path d="M9.5 17h5M5 12h15" /></>)
export const IconCalculator = () =>
  svg(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>)
export const IconMeer = () => svg(<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>)
export const IconPlus = () => svg(<path d="M12 5v14M5 12h14" />)
export const IconZoek = () => svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
