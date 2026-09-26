// ─────────────────────────────────────────────────────────────
// Muro de comandas KDS — monitor NO táctil, modo oscuro.
// Control exclusivo por teclado físico (Bump Bar):
//   [1]–[8]  1ª pulsación: EN PREPARACIÓN · 2ª pulsación: LISTO
//   [0] / [Retroceso]  deshacer la última acción
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Order, Station } from '../../domain/types'
import { useOrders } from '../../state/OrdersContext'

const SLOTS = 8
const NEW_WINDOW_MS = 20_000

type TimerStatus = 'green' | 'amber' | 'red'

const TIMER: Record<TimerStatus, { fg: string; dim: string; border: string; label: string }> = {
  green: { fg: '#4ade80', dim: '#22c55e', border: '#166534', label: 'A TIEMPO' },
  amber: { fg: '#fbbf24', dim: '#f59e0b', border: '#92400e', label: 'ALERTA' },
  red:   { fg: '#ff4d4d', dim: '#f87171', border: '#b91c1c', label: 'TARDE' },
}

const STATION: Record<Station, { label: string; color: string }> = {
  caliente: { label: 'CALIENTE', color: '#fb923c' },
  frio:     { label: 'FRÍO',     color: '#38bdf8' },
  barra:    { label: 'BARRA',    color: '#c084fc' },
}

const MONO = "'JetBrains Mono', monospace"
const SANS = "'Inter', sans-serif"

type FlashKind = 'start' | 'ok' | 'undo' | 'err'
const FLASH: Record<FlashKind, { bg: string; fg: string; border: string; icon: string }> = {
  start: { bg: '#0b1b3a', fg: '#93c5fd', border: '#1d4ed8', icon: '▶' },
  ok:    { bg: '#052e16', fg: '#86efac', border: '#166534', icon: '✓' },
  undo:  { bg: '#1e1b4b', fg: '#c7d2fe', border: '#3730a3', icon: '↺' },
  err:   { bg: '#3f0d0d', fg: '#fca5a5', border: '#7f1d1d', icon: '✕' },
}

const status = (secs: number): TimerStatus => (secs < 360 ? 'green' : secs < 720 ? 'amber' : 'red')
const mmss = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export function KdsBoard() {
  const { kitchen, ready, advance, undo } = useOrders()
  const [tick, setTick] = useState(Date.now())
  const [flash, setFlash] = useState<{ text: string; kind: FlashKind } | null>(null)
  const [pressed, setPressed] = useState<number | null>(null)
  const kitchenRef = useRef(kitchen)
  kitchenRef.current = kitchen

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 3500)
    return () => clearTimeout(t)
  }, [flash])

  // Bump bar: escucha del teclado físico.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= SLOTS) {
        const order = kitchenRef.current[n - 1]
        setPressed(n)
        setTimeout(() => setPressed(null), 180)
        const updated = order && advance(order.id)
        if (updated) {
          setFlash(
            updated.status === 'en_preparacion'
              ? { text: `[${n}] #${updated.id} · ${updated.table} en preparación`, kind: 'start' }
              : { text: `[${n}] #${updated.id} · ${updated.table} lista para entregar`, kind: 'ok' },
          )
        } else {
          setFlash({ text: `[${n}] Posición vacía`, kind: 'err' })
        }
        e.preventDefault()
      } else if (e.key === '0' || e.key === 'Backspace') {
        const restored = undo()
        setFlash(
          restored
            ? { text: `#${restored.id} · ${restored.table} volvió a ${restored.status === 'en_cola' ? 'EN COLA' : 'EN PREPARACIÓN'}`, kind: 'undo' }
            : { text: 'No hay acciones para deshacer', kind: 'err' },
        )
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, undo])

  const visible = kitchen.slice(0, SLOTS)
  const hidden = kitchen.length - visible.length
  const queuedCount = kitchen.filter(o => o.status === 'en_cola').length
  const cookingCount = kitchen.length - queuedCount
  const statuses = kitchen.map(o => status(Math.max(0, Math.floor((tick - o.createdAt) / 1000))))
  const lateCount = statuses.filter(s => s === 'red').length
  const warnCount = statuses.filter(s => s === 'amber').length
  const clock = new Date(tick).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div
      style={{
        background: '#05050a', color: '#f1f3f8', height: '100%', display: 'flex',
        flexDirection: 'column', overflow: 'hidden', fontFamily: MONO, cursor: 'none',
      }}
    >
      {/* ── Barra superior ─────────────────────────────── */}
      <header
        style={{
          flexShrink: 0, height: 64, display: 'flex', alignItems: 'center', gap: 28,
          padding: '0 24px', background: '#020206', borderBottom: '1px solid #16162a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.12em' }}>FOODTOMATION</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', color: '#6b6b99' }}>COCINA</span>
        </div>
        <Divider />
        <Stat value={queuedCount} label="EN COLA" color="#cbd5e1" dimmed={!queuedCount} />
        <Stat value={cookingCount} label="PREPARANDO" color="#60a5fa" dimmed={!cookingCount} />
        <Stat value={ready.length} label="LISTOS" color="#4ade80" dimmed={!ready.length} />
        <Divider />
        <Stat value={warnCount} label="ALERTA" color="#fbbf24" dimmed={!warnCount} />
        <Stat value={lateCount} label="TARDE" color="#ff4d4d" dimmed={!lateCount} pulse={lateCount > 0} />
        {hidden > 0 && <Stat value={hidden} label="SIN MOSTRAR" color="#e2e8f0" />}
        <div style={{ flex: 1 }} />
        {(['green', 'amber', 'red'] as TimerStatus[]).map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot color={TIMER[s].fg} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TIMER[s].dim, letterSpacing: '0.08em' }}>
              {s === 'green' ? '< 6 MIN' : s === 'amber' ? '6–12 MIN' : '> 12 MIN'}
            </span>
          </div>
        ))}
        <Divider />
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c7d2fe', letterSpacing: '0.06em' }}>{clock}</div>
      </header>

      {/* ── Tablero tipo Kanban 4×2 ─────────────────────── */}
      <main
        style={{
          flex: 1, display: 'grid', gridTemplateColumns: `repeat(4, minmax(0, 1fr))`,
          gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 12, padding: 12, minHeight: 0,
        }}
      >
        {Array.from({ length: SLOTS }, (_, i) => {
          const order = visible[i]
          return order ? (
            <Ticket key={order.id} slot={i + 1} order={order} tick={tick} pressed={pressed === i + 1} />
          ) : (
            <EmptySlot key={`empty-${i}`} slot={i + 1} pressed={pressed === i + 1} />
          )
        })}
      </main>

      {/* ── Franja: listos para entregar ─────────────────── */}
      <ReadyStrip orders={ready} tick={tick} />

      {/* ── Pie: ayuda de la bump bar + feedback ─────────── */}
      <footer
        style={{
          flexShrink: 0, height: 48, display: 'flex', alignItems: 'center', gap: 20,
          padding: '0 24px', background: '#020206', borderTop: '1px solid #16162a',
        }}
      >
        <Key>1</Key><span style={{ color: '#6b6b99' }}>–</span><Key>8</Key>
        <span style={{ fontSize: '0.8rem', color: '#9ca3c7', letterSpacing: '0.08em' }}>
          1ª <b style={{ color: '#93c5fd' }}>PREPARAR</b> · 2ª <b style={{ color: '#86efac' }}>LISTO</b>
        </span>
        <Key>0</Key>
        <span style={{ fontSize: '0.8rem', color: '#9ca3c7', letterSpacing: '0.08em' }}>DESHACER</span>
        <div style={{ flex: 1 }} />
        {flash ? (
          <div
            key={flash.text}
            className="kds-enter"
            style={{
              padding: '6px 16px', borderRadius: 3, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.04em',
              background: FLASH[flash.kind].bg,
              color: FLASH[flash.kind].fg,
              border: `1px solid ${FLASH[flash.kind].border}`,
            }}
          >
            {FLASH[flash.kind].icon} 
            {flash.text}
          </div>
        ) : (
          <span style={{ fontSize: '0.78rem', color: '#6b6b99', letterSpacing: '0.1em' }}>
            ⚠ OBSERVACIÓN DEL CLIENTE — LEER ANTES DE PREPARAR
          </span>
        )}
      </footer>
    </div>
  )
}

function Ticket({ slot, order, tick, pressed }: { slot: number; order: Order; tick: number; pressed: boolean }) {
  const secs = Math.max(0, Math.floor((tick - order.createdAt) / 1000))
  const st = status(secs)
  const t = TIMER[st]
  const isNew = tick - order.createdAt < NEW_WINDOW_MS
  const observations = order.lines.filter(l => l.observation)
  const items = order.lines.reduce((a, l) => a + l.qty, 0)
  const cooking = order.status === 'en_preparacion'
  const cookSecs = cooking && order.startedAt ? Math.max(0, Math.floor((tick - order.startedAt) / 1000)) : 0

  return (
    <article
      className={`kds-enter ${isNew ? 'kds-new' : ''}`}
      style={{
        background: pressed ? '#141430' : '#0b0b14',
        border: `1px solid ${t.border}`,
        borderTop: `6px solid ${t.fg}`,
        borderRadius: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
        transition: 'background .15s',
      }}
    >
      {/* Cabecera: número de tecla + mesa + temporizador */}
      <header style={{ display: 'flex', alignItems: 'stretch', background: '#07070e', borderBottom: '1px solid #1c1c30', flexShrink: 0 }}>
        <div
          style={{
            width: 64, flexShrink: 0, background: cooking ? '#2563eb' : '#f1f3f8', color: cooking ? '#fff' : '#05050a', display: 'grid',
            placeItems: 'center', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1,
          }}
        >
          {slot}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {order.table.toUpperCase()}
            </span>
            {isNew && (
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', background: '#1d4ed8', color: '#fff', borderRadius: 2, letterSpacing: '0.12em' }}>
                NUEVA
              </span>
            )}
          </div>
          <div style={{ marginTop: 4, fontSize: '0.74rem', color: '#8b8bb3', letterSpacing: '0.08em' }}>
            #{order.id} · {items} ÍTEMS
          </div>
        </div>
        <div
          className={st === 'red' ? 'pulse-red' : undefined}
          style={{ padding: '10px 14px 10px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot color={t.fg} glow={st === 'red'} />
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: t.fg, letterSpacing: '0.04em', lineHeight: 1 }}>
              {mmss(secs)}
            </span>
          </div>
          <span style={{ marginTop: 4, fontSize: '0.62rem', fontWeight: 700, color: t.dim, letterSpacing: '0.18em' }}>{t.label}</span>
        </div>
      </header>

      {/* Observaciones especiales: arriba y muy visibles */}
      {observations.length > 0 && (
        <div
          className="pulse-obs"
          style={{ flexShrink: 0, background: '#facc15', color: '#1a1300', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {observations.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>⚠</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
                {l.observation}
                <span style={{ fontWeight: 500, textTransform: 'none', opacity: 0.75 }}> — {l.name}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Platos */}
      <ul style={{ listStyle: 'none', margin: 0, padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'hidden' }}>
        {order.lines.map((l, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, minWidth: 40, lineHeight: 1.1 }}>{l.qty}×</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: '1.1rem', fontWeight: 700, color: '#e6e9f2', lineHeight: 1.25 }}>
                {l.name}
                <span
                  style={{
                    marginLeft: 8, fontFamily: MONO, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                    color: STATION[l.station].color, verticalAlign: 'middle',
                  }}
                >
                  ◆ {STATION[l.station].label}
                </span>
              </div>
              {l.modifiers.map((m, j) => (
                <div key={j} style={{ fontFamily: SANS, fontSize: '0.9rem', color: '#a3a8c3', lineHeight: 1.35, marginTop: 2 }}>
                  — {m}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Estado + siguiente acción en la bump bar */}
      <footer
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          background: cooking ? '#0b1b3a' : '#10101c',
          borderTop: `1px solid ${cooking ? '#1d4ed8' : '#1f1f36'}`,
        }}
      >
        <span
          style={{
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
            color: cooking ? '#93c5fd' : '#cbd5e1',
          }}
        >
          {cooking ? `● EN PREPARACIÓN · ${mmss(cookSecs)}` : '○ EN COLA'}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.7rem', color: '#8b8bb3', letterSpacing: '0.1em' }}>
          [{slot}] {cooking ? 'MARCAR LISTO' : 'EMPEZAR'}
        </span>
      </footer>
    </article>
  )
}

function ReadyStrip({ orders, tick }: { orders: Order[]; tick: number }) {
  return (
    <section
      style={{
        flexShrink: 0, height: 60, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
        background: orders.length ? '#03170b' : '#06060c', borderTop: `1px solid ${orders.length ? '#166534' : '#16162a'}`,
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.18em', color: orders.length ? '#4ade80' : '#3a3a5c', whiteSpace: 'nowrap' }}>
        ✓ LISTOS PARA ENTREGAR
      </span>
      {orders.length === 0 && (
        <span style={{ fontSize: '0.8rem', color: '#3a3a5c', letterSpacing: '0.1em' }}>— NINGUNO</span>
      )}
      {orders.map(o => {
        const waited = Math.max(0, Math.floor((tick - (o.readyAt ?? tick)) / 1000))
        const slow = waited > 180
        return (
          <div
            key={o.id}
            className="kds-enter"
            style={{
              display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 14px', borderRadius: 4, whiteSpace: 'nowrap',
              background: slow ? '#3f2a00' : '#052e16', border: `1px solid ${slow ? '#b45309' : '#16a34a'}`,
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f3f8' }}>{o.table.toUpperCase()}</span>
            <span style={{ fontSize: '0.75rem', color: '#8bbf9c' }}>#{o.id}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: slow ? '#fbbf24' : '#4ade80' }}>{mmss(waited)}</span>
          </div>
        )
      })}
    </section>
  )
}

function EmptySlot({ slot, pressed }: { slot: number; pressed: boolean }) {
  return (
    <div
      style={{
        border: '1px dashed #1f1f36', borderRadius: 4, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#2a2a48',
        background: pressed ? '#140a0a' : 'transparent', transition: 'background .15s',
      }}
    >
      <span style={{ fontSize: '2.4rem', fontWeight: 700 }}>{slot}</span>
      <span style={{ fontSize: '0.72rem', letterSpacing: '0.24em', fontWeight: 700 }}>LIBRE</span>
    </div>
  )
}

function Stat({ value, label, color, dimmed, pulse }: { value: number; label: string; color: string; dimmed?: boolean; pulse?: boolean }) {
  return (
    <div className={pulse ? 'pulse-red' : undefined} style={{ display: 'flex', alignItems: 'baseline', gap: 6, opacity: dimmed ? 0.35 : 1 }}>
      <span style={{ fontSize: '1.7rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.66rem', fontWeight: 700, color, letterSpacing: '0.16em', opacity: 0.8 }}>{label}</span>
    </div>
  )
}

function Dot({ color, glow }: { color: string; glow?: boolean }) {
  return (
    <span
      style={{
        width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block',
        flexShrink: 0, boxShadow: glow ? `0 0 8px ${color}` : 'none',
      }}
    />
  )
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: '#1f1f36', flexShrink: 0 }} />
}

function Key({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        minWidth: 30, height: 30, padding: '0 8px', display: 'inline-grid', placeItems: 'center',
        border: '1px solid #3a3a60', borderBottomWidth: 3, borderRadius: 4, background: '#10101c',
        fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0',
      }}
    >
      {children}
    </span>
  )
}
