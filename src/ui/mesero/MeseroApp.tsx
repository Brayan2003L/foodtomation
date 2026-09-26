// ─────────────────────────────────────────────────────────────
// Mesero — vista para celular.
// Recibe un aviso cuando un plato sale de cocina y es quien confirma
// que lo entregó en la mesa (registra la acción quien la ejecuta).
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../domain/pricing'
import type { Order } from '../../domain/types'
import { useOrders } from '../../state/OrdersContext'

type Tab = 'entregar' | 'cuentas' | 'cocina'

const mmss = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

/** Vibra el celular si el navegador lo permite (no falla si no). */
function buzz() {
  try {
    navigator.vibrate?.([180, 90, 180])
  } catch {
    /* sin soporte de vibración */
  }
}

export function MeseroApp() {
  const { ready, kitchen, tables, confirmDelivery, revertDelivery } = useOrders()
  const now = useNow()
  const [tab, setTab] = useState<Tab>('entregar')
  const [alert, setAlert] = useState<Order | null>(null)
  const [undo, setUndo] = useState<Order | null>(null)
  const seen = useRef<Set<number> | null>(null)

  // Observa los pedidos listos y avisa cuando aparece uno nuevo.
  useEffect(() => {
    const ids = new Set(ready.map(o => o.id))
    if (seen.current) {
      const fresh = ready.find(o => !seen.current!.has(o.id))
      if (fresh) {
        setAlert(fresh)
        buzz()
      }
    }
    seen.current = ids
  }, [ready])

  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => setAlert(null), 6000)
    return () => clearTimeout(t)
  }, [alert])

  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), 6000)
    return () => clearTimeout(t)
  }, [undo])

  const requests = tables.filter(t => t.billRequestedAt)

  const deliver = (o: Order) => {
    const done = confirmDelivery(o.id)
    if (done) {
      setUndo(done)
      if (alert?.id === o.id) setAlert(null)
    }
  }

  return (
    <div className="mesero">
      <header className="m-header">
        <div className="m-brand">
          <span className="m-brand-mark">F</span>
          <div>
            <div className="m-brand-word">Foodtomation</div>
            <div className="m-brand-role">Mesero</div>
          </div>
        </div>
        <div className={`m-bell ${ready.length ? 'is-on' : ''}`} aria-label={`${ready.length} platos listos`}>
          🔔<span>{ready.length}</span>
        </div>
      </header>

      {alert && (
        <button type="button" className="m-alert" onClick={() => { setTab('entregar'); setAlert(null) }}>
          <strong>¡Plato listo para {alert.table}!</strong>
          <span>Pedido #{alert.id} · toca para verlo</span>
        </button>
      )}

      <nav className="m-tabs">
        <TabBtn active={tab === 'entregar'} onClick={() => setTab('entregar')} label="Listos" count={ready.length} tone="ready" />
        <TabBtn active={tab === 'cuentas'} onClick={() => setTab('cuentas')} label="Cuentas" count={requests.length} tone="bill" />
        <TabBtn active={tab === 'cocina'} onClick={() => setTab('cocina')} label="En cocina" count={kitchen.length} />
      </nav>

      <main className="m-body">
        {tab === 'entregar' && (
          ready.length === 0 ? (
            <Empty title="No hay platos por entregar" text="Cuando la cocina marque un pedido como listo, te avisaremos aquí." />
          ) : (
            ready.map(o => <ReadyCard key={o.id} order={o} now={now} onDeliver={() => deliver(o)} />)
          )
        )}

        {tab === 'cuentas' && (
          requests.length === 0 ? (
            <Empty title="Ninguna mesa ha pedido la cuenta" text="Las solicitudes de cuenta de las tablets aparecerán aquí." />
          ) : (
            requests.map(t => (
              <article key={t.key} className="m-card m-card-bill">
                <div className="m-card-row">
                  <span className="m-table">{t.table}</span>
                  <span className="m-total">{formatPrice(t.subtotal)}</span>
                </div>
                <div className="m-meta">Pidió la cuenta hace {Math.max(0, Math.floor((now - (t.billRequestedAt ?? now)) / 60000))} min</div>
                <div className="m-hint">Acompaña al cliente a caja o lleva el datáfono a la mesa.</div>
              </article>
            ))
          )
        )}

        {tab === 'cocina' && (
          kitchen.length === 0 ? (
            <Empty title="La cocina está al día" text="No hay pedidos en cola ni en preparación." />
          ) : (
            kitchen.map(o => (
              <article key={o.id} className="m-row">
                <div>
                  <div className="m-row-title">{o.table} <span className="m-muted">#{o.id}</span></div>
                  <div className="m-meta">Enviado a las {hhmm(o.createdAt)} · {o.lines.reduce((a, l) => a + l.qty, 0)} productos</div>
                </div>
                <span className={`m-chip ${o.status === 'en_preparacion' ? 'is-cooking' : ''}`}>
                  {o.status === 'en_preparacion' ? 'Preparando' : 'En cola'}
                </span>
              </article>
            ))
          )
        )}
      </main>

      {undo && (
        <div className="m-toast" role="status">
          <span>✓ {undo.table} · #{undo.id} entregado</span>
          <button
            type="button"
            onClick={() => {
              revertDelivery(undo.id)
              setUndo(null)
            }}
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, label, count, tone }: { active: boolean; onClick: () => void; label: string; count: number; tone?: 'ready' | 'bill' }) {
  return (
    <button type="button" className={`m-tab ${active ? 'is-active' : ''}`} onClick={onClick}>
      {label}
      {count > 0 && <span className={`m-count ${tone ? `is-${tone}` : ''}`}>{count}</span>}
    </button>
  )
}

function ReadyCard({ order, now, onDeliver }: { order: Order; now: number; onDeliver: () => void }) {
  const waited = Math.max(0, Math.floor((now - (order.readyAt ?? now)) / 1000))
  const tone = waited > 360 ? 'is-late' : waited > 180 ? 'is-warn' : ''
  const obs = order.lines.filter(l => l.observation)
  return (
    <article className={`m-card m-card-ready ${tone}`}>
      <div className="m-card-row">
        <span className="m-table">{order.table}</span>
        <span className={`m-wait ${tone}`}>Listo hace {mmss(waited)}</span>
      </div>
      <div className="m-meta">Pedido #{order.id}</div>
      <ul className="m-lines">
        {order.lines.map((l, i) => (
          <li key={i}>
            <strong>{l.qty}×</strong> {l.name}
            {l.modifiers.length > 0 && <span className="m-mods"> · {l.modifiers.join(', ')}</span>}
          </li>
        ))}
      </ul>
      {obs.map((l, i) => (
        <div key={i} className="m-obs">⚠ {l.observation} — {l.name}</div>
      ))}
      <button type="button" className="m-deliver" onClick={onDeliver}>
        Entregado en la mesa
      </button>
    </article>
  )
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="m-empty">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}
