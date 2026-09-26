import { useState } from 'react'

/** Foto del plato con respaldo elegante si no hay imagen o falla la carga. */
export function DishImage({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`k-img ${className ?? ''}`}>
      {src && !failed ? (
        <img src={src} alt={name} onError={() => setFailed(true)} draggable={false} />
      ) : (
        <div className="k-img-fallback" aria-label={name}>
          <span>{initials}</span>
        </div>
      )}
    </div>
  )
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={`k-check ${checked ? 'is-on' : ''}`} aria-hidden>
      {checked && (
        <svg width="16" height="12" viewBox="0 0 15 11" fill="none">
          <path d="M1.5 5.5L6 10L13.5 1" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export function Stepper({
  value,
  onChange,
  min = 1,
  size = 'lg',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  size?: 'lg' | 'md'
}) {
  return (
    <div className={`k-stepper k-stepper-${size}`}>
      <button
        type="button"
        aria-label="Disminuir cantidad"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        −
      </button>
      <span className="k-stepper-value">{value}</span>
      <button type="button" aria-label="Aumentar cantidad" onClick={() => onChange(Math.min(20, value + 1))}>
        +
      </button>
    </div>
  )
}

export function Logo() {
  return (
    <div className="k-logo">
      <span className="k-logo-mark">F</span>
      <span className="k-logo-word">Foodtomation</span>
    </div>
  )
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="k-back" onClick={onClick}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}
