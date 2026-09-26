import { useState } from 'react'

const DISH = {
  category: 'Main Course',
  name: 'Duck Confit',
  subtitle:
    'Slow-rendered duck leg, cherry-port reduction, roasted fingerling potatoes, wilted spinach, crispy shallots',
  price: 34.0,
  image:
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&h=1000&fit=crop&auto=format',
  modifiers: [
    { id: 'no-sauce',   label: 'No sauce' },
    { id: 'extra-veg',  label: 'Extra vegetables' },
    { id: 'no-potato',  label: 'No potatoes' },
    { id: 'well-done',  label: 'Well done' },
    { id: 'gf',         label: 'Gluten-free' },
    { id: 'add-foie',   label: 'Add foie gras', surcharge: 12.0 },
  ],
}

const PRIMARY = '#C44B1A'
const RULE    = '#EAE5DE'
const MUTED   = '#9B9285'
const TEXT    = '#1A1108'
const SUBTEXT = '#72685C'

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: `2px solid ${checked ? PRIMARY : '#C4BEB6'}`,
        background: checked ? PRIMARY : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 0.14s, background 0.14s',
      }}
    >
      {checked && (
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path
            d="M1.5 5.5L6 10L13.5 1"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

export default function DishDetail() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [obs, setObs] = useState('')

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const surcharge = DISH.modifiers
    .filter(m => selected.has(m.id) && m.surcharge)
    .reduce((acc, m) => acc + (m.surcharge ?? 0), 0)
  const total = DISH.price + surcharge

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAF9F6',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* ── Split panel ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* LEFT — full-bleed food photo */}
        <div
          style={{
            flex: '0 0 50%',
            position: 'relative',
            overflow: 'hidden',
            background: '#D5C9BB',
          }}
        >
          <img
            src={DISH.image}
            alt={DISH.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Subtle bottom vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(10,5,0,0.28) 0%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />
          {/* Price badge on image */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              left: 36,
              background: '#FFFFFF',
              borderRadius: 4,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 3,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '1.55rem',
                fontWeight: 700,
                color: PRIMARY,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              ${total.toFixed(2)}
            </span>
            {surcharge > 0 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.72rem',
                  color: MUTED,
                  letterSpacing: '0.04em',
                }}
              >
                +${surcharge.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT — details panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: '#FFFFFF',
            borderLeft: `1px solid ${RULE}`,
          }}
        >
          <div style={{ padding: '44px 52px 40px' }}>

            {/* Category */}
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: PRIMARY,
                marginBottom: 14,
              }}
            >
              {DISH.category}
            </div>

            {/* Dish name */}
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '2.8rem',
                fontWeight: 400,
                color: TEXT,
                lineHeight: 1.12,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {DISH.name}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '0.9rem',
                color: SUBTEXT,
                lineHeight: 1.7,
                marginTop: 14,
                marginBottom: 0,
                maxWidth: 380,
              }}
            >
              {DISH.subtitle}
            </p>

            {/* Base price */}
            <div
              style={{
                marginTop: 22,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '2rem',
                fontWeight: 700,
                color: TEXT,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              ${DISH.price.toFixed(2)}
            </div>

            {/* ── Rule ── */}
            <div style={{ height: 1, background: RULE, margin: '32px 0' }} />

            {/* Modifiers */}
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: MUTED,
                marginBottom: 6,
              }}
            >
              Customise
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {DISH.modifiers.map((mod, i) => {
                const isOn = selected.has(mod.id)
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggle(mod.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 18,
                      padding: '0 4px',
                      height: 64,
                      borderTop: `1px solid ${RULE}`,
                      borderBottom: i === DISH.modifiers.length - 1 ? `1px solid ${RULE}` : 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      background: isOn ? '#FFF8F5' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.14s',
                    }}
                  >
                    <Checkbox checked={isOn} />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '1.02rem',
                        fontWeight: isOn ? 600 : 400,
                        color: isOn ? TEXT : '#3C3830',
                        lineHeight: 1.3,
                        transition: 'color 0.14s, font-weight 0.14s',
                      }}
                    >
                      {mod.label}
                    </span>
                    {mod.surcharge && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: isOn ? PRIMARY : MUTED,
                          letterSpacing: '0.02em',
                          transition: 'color 0.14s',
                        }}
                      >
                        +${mod.surcharge.toFixed(2)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── Rule ── */}
            <div style={{ height: 1, background: RULE, margin: '32px 0' }} />

            {/* Special observations */}
            <div>
              <label
                htmlFor="obs"
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: 12,
                }}
              >
                Special Observations
              </label>
              <textarea
                id="obs"
                className="kiosk-obs"
                value={obs}
                onChange={e => setObs(e.target.value)}
                placeholder="Allergies, dietary requirements, or any special requests for the kitchen…"
                rows={4}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: `1.5px solid ${RULE}`,
                  borderRadius: 10,
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: TEXT,
                  background: '#FAF9F6',
                  resize: 'none',
                  lineHeight: 1.65,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              />
            </div>

            {/* Bottom breathing room */}
            <div style={{ height: 24 }} />
          </div>
        </div>
      </div>

      {/* ── Add to Cart ───────────────────────────────────────── */}
      <button
        className="kiosk-add-btn"
        style={{
          flexShrink: 0,
          width: '100%',
          padding: '0 52px',
          height: 88,
          background: PRIMARY,
          color: '#FFFFFF',
          border: 'none',
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: "'Inter', sans-serif",
          transition: 'background 0.15s',
        }}
      >
        <span>Add to Cart</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1.9rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          ${total.toFixed(2)}
        </span>
      </button>
    </div>
  )
}
