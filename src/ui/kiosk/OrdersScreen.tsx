// "Mis pedidos": seguimiento en tiempo real de los pedidos de la mesa.
import { useEffect, useState } from 'react'
import { queuePosition, tableOrders } from '../../domain/orderStore'
import { formatPrice } from '../../domain/pricing'
import { ORDER_FLOW, type Order, type OrderStatus } from '../../domain/types'
import { useCart } from '../../state/CartContext'
import { useOrders } from '../../state/OrdersContext'
import { BackButton } from './shared'

export const STATUS_COPY: Record<OrderStatus, { step: string; title: string; tone: string }> = {
  en_cola:        { step: 'En cola',        title: 'Recibido en cocina',   tone: 'queue' },
  en_preparacion: { step: 'En preparación', title: 'Preparando tu pedido', tone: 'cooking' },
  listo:          { step: 'Listo',          title: '¡Listo para entregar!', tone: 'ready' },
  entregado:      { step: 'Entregado',      title: 'Entregado',             tone: 'done' },
}

const clock = (t?: number) =>
  t ? new Date(t).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function OrdersScreen({ onBack, onBillRequested }: { onBack: () => void; onBillRequested: () => void }) {
  const { table } = useCart()
  const { orders, billRequests, requestBill } = useOrders()
  const mine = tableOrders(orders, table, billRequests)
  const tableTotal = mine.reduce((a, o) => a + o.total, 0)
  const undelivered = mine.filter(o => o.status !== 'entregado').length
  const askBill = () => {
    if (requestBill(table)) onBillRequested()
  }
  const active = mine.filter(o => o.status !== 'entregado')
  const done = mine.filter(o => o.status === 'entregado')

  return (
    <div className="k-screen">
      <header className="k-header k-header-sub">
        <BackButton label="Volver al menú" onClick={onBack} />
        <h1 className="k-page-title">Mis pedidos</h1>
        <div className="k-table-pill">
          <span className="k-eyebrow">Tu mesa</span>
          <strong>{table}</strong>
        </div>
      </header>

      <main className="k-orders scrollbar-hide">

        {mine.length === 0 && (
          <div className="k-empty">
            <h2>Aún no has enviado pedidos</h2>
            <p>Cuando envíes tu pedido a cocina podrás seguir su estado aquí.</p>
            <button type="button" className="k-primary" onClick={onBack}>Ver el menú</button>
          </div>
        )}

        {active.map(o => (
          <OrderTracker key={o.id} order={o} ahead={queuePosition(orders, o)} />
        ))}

        {done.length > 0 && (
          <>
            <div className="k-eyebrow k-orders-sep">Entregados</div>
            {done.map(o => (
              <OrderTracker key={o.id} order={o} ahead={0} compact />
            ))}
          </>
        )}
      </main>

      {mine.length > 0 && (
        <footer className="k-billbar">
          <div className="k-billbar-info">
            <span className="k-eyebrow">Cuenta de la mesa</span>
            <span className="k-billbar-total">{formatPrice(tableTotal)}</span>
          </div>
          {undelivered > 0 && (
            <span className="k-bill-note">
              Podrás pedir la cuenta cuando recibas {undelivered === 1 ? 'tu pedido' : `tus ${undelivered} pedidos`}.
            </span>
          )}
          <button type="button" className="k-bill-btn" disabled={undelivered > 0} onClick={askBill}>
            Pedir la cuenta
          </button>
        </footer>
      )}
    </div>
  )
}

function OrderTracker({ order, ahead, compact }: { order: Order; ahead: number; compact?: boolean }) {
  const now = useNow()
  const idx = ORDER_FLOW.indexOf(order.status)
  const copy = STATUS_COPY[order.status]
  const items = order.lines.reduce((a, l) => a + l.qty, 0)
  const mins = Math.max(0, Math.floor((now - order.createdAt) / 60000))

  const message =
    order.status === 'en_cola'
      ? ahead === 0
        ? 'Eres el siguiente en la cocina.'
        : `Hay ${ahead} ${ahead === 1 ? 'pedido' : 'pedidos'} antes del tuyo.`
      : order.status === 'en_preparacion'
        ? 'El equipo de cocina está preparando tus platos.'
        : order.status === 'listo'
          ? 'Tu pedido salió de cocina y un mesero lo lleva a tu mesa.'
          : '¡Buen provecho!'

  const stamps: Record<OrderStatus, number | undefined> = {
    en_cola: order.createdAt,
    en_preparacion: order.startedAt,
    listo: order.readyAt,
    entregado: order.deliveredAt,
  }

  return (
    <article className={`k-track k-track-${copy.tone} ${compact ? 'is-compact' : ''}`}>
      <header className="k-track-head">
        <div>
          <div className="k-eyebrow">Pedido #{order.id} · {clock(order.createdAt)} · {items} {items === 1 ? 'producto' : 'productos'}</div>
          <h2 className="k-track-title">{copy.title}</h2>
          {!compact && <p className="k-track-msg">{message}</p>}
        </div>
        <div className="k-track-side">
          <span className={`k-status-badge is-${copy.tone}`}>{copy.step}</span>
          {!compact && order.status !== 'entregado' && <span className="k-track-elapsed">hace {mins} min</span>}
        </div>
      </header>

      {!compact && (
        <ol className="k-steps" aria-label="Estado del pedido">
          {ORDER_FLOW.map((s, i) => {
            const state = i < idx ? 'is-past' : i === idx ? 'is-current' : 'is-future'
            return (
              <li key={s} className={`k-step ${state}`}>
                <span className="k-step-dot">{i < idx ? '✓' : i + 1}</span>
                <span className="k-step-label">{STATUS_COPY[s].step}</span>
                <span className="k-step-time">{i <= idx ? clock(stamps[s]) : ''}</span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="k-track-lines">
        {order.lines.map((l, i) => (
          <span key={i} className="k-chip">
            {l.qty}× {l.name}
          </span>
        ))}
        {order.total > 0 && <span className="k-track-total k-mono">{formatPrice(order.total)}</span>}
      </div>


    </article>
  )
}
