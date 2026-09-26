import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../../domain/menu'
import { tableOrders } from '../../domain/orderStore'
import { formatPrice } from '../../domain/pricing'
import type { Order, OrderStatus } from '../../domain/types'
import { useCart } from '../../state/CartContext'
import { useOrders } from '../../state/OrdersContext'
import { CheckoutScreen } from './CheckoutScreen'
import { DishDetailScreen } from './DishDetailScreen'
import { MenuScreen } from './MenuScreen'
import { OrdersScreen } from './OrdersScreen'

type Screen =
  | { name: 'menu' }
  | { name: 'detail'; itemId: string }
  | { name: 'checkout' }
  | { name: 'sent'; order: Order }
  | { name: 'orders' }
  | { name: 'bill' }

export function KioskApp() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id)
  const [toast, setToast] = useState<string | null>(null)
  const readyAlert = useReadyAlert()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const go = (next: Screen) => {
    setToast(null)
    setScreen(next)
  }
  const goMenu = () => setScreen({ name: 'menu' })

  return (
    <div className="kiosk">
      {screen.name === 'menu' && (
        <MenuScreen
          categoryId={categoryId}
          onCategory={setCategoryId}
          onSelect={itemId => setScreen({ name: 'detail', itemId })}
          onCart={() => go({ name: 'checkout' })}
          onOrders={() => go({ name: 'orders' })}
        />
      )}
      {screen.name === 'detail' && (
        <DishDetailScreen
          itemId={screen.itemId}
          onBack={goMenu}
          onAdded={(name, qty) => {
            setToast(`${qty}× ${name} agregado a tu pedido`)
            goMenu()
          }}
        />
      )}
      {screen.name === 'checkout' && (
        <CheckoutScreen onBack={goMenu} onSent={order => go({ name: 'sent', order })} />
      )}
      {screen.name === 'sent' && (
        <SentScreen order={screen.order} onDone={goMenu} onTrack={() => go({ name: 'orders' })} />
      )}
      {screen.name === 'orders' && <OrdersScreen onBack={goMenu} onBillRequested={() => go({ name: 'bill' })} />}
      {screen.name === 'bill' && <BillRequestedScreen onDone={() => { setCategoryId(CATEGORIES[0].id); goMenu() }} />}

      {toast && screen.name === 'menu' && (
        <div className="k-toast" role="status">
          <span className="k-toast-dot">✓</span>
          {toast}
        </div>
      )}

      {readyAlert.order && screen.name !== 'orders' && (
        <div className="k-ready-banner" role="alert">
          <span className="k-ready-icon">🔔</span>
          <div className="k-ready-text">
            <strong>¡Tu pedido #{readyAlert.order.id} está listo!</strong>
            <span>Va camino a tu mesa.</span>
          </div>
          <button
            type="button"
            className="k-ready-btn"
            onClick={() => {
              readyAlert.dismiss()
              go({ name: 'orders' })
            }}
          >
            Ver pedido
          </button>
          <button type="button" className="k-ready-close" aria-label="Cerrar aviso" onClick={readyAlert.dismiss}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}

/** Observa los pedidos de la mesa y avisa cuando alguno pasa a "listo". */
function useReadyAlert() {
  const { table } = useCart()
  const { orders, billRequests } = useOrders()
  const prev = useRef<Map<number, OrderStatus> | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    const mine = tableOrders(orders, table, billRequests)
    const before = prev.current
    if (before) {
      const justReady = mine.find(o => o.status === 'listo' && before.get(o.id) !== 'listo')
      if (justReady) setOrder(justReady)
    }
    // Si el aviso activo ya no está listo (entregado o deshecho), se retira.
    setOrder(cur => (cur && mine.find(o => o.id === cur.id)?.status === 'listo' ? cur : null))
    prev.current = new Map(mine.map(o => [o.id, o.status]))
  }, [orders, table, billRequests])

  return { order, dismiss: () => setOrder(null) }
}

/**
 * Tras pedir la cuenta: se despide del comensal y deja la tablet limpia
 * (carrito vacío y sin pedidos a la vista) para el siguiente cliente.
 */
function BillRequestedScreen({ onDone }: { onDone: () => void }) {
  const { clear } = useCart()
  const [left, setLeft] = useState(12)

  useEffect(() => {
    clear()
    const id = setInterval(() => setLeft(s => s - 1), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (left <= 0) onDone()
  }, [left, onDone])

  return (
    <div className="k-screen k-sent">
      <div className="k-sent-card">
        <div className="k-sent-check">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>¡Gracias por tu visita!</h1>
        <p>
          Tu cuenta ya está en caja. Puedes pagar allí o esperar a que te atiendan.
          <br />
          Por tu privacidad, esta tablet quedó lista para el siguiente cliente.
        </p>
        <button type="button" className="k-primary k-primary-lg" style={{ marginTop: 32 }} onClick={onDone}>
          Volver al inicio
        </button>
        <div className="k-sent-auto">Regresando al inicio en {Math.max(left, 0)} s</div>
      </div>
    </div>
  )
}

function SentScreen({ order, onDone, onTrack }: { order: Order; onDone: () => void; onTrack: () => void }) {
  const [left, setLeft] = useState(15)

  useEffect(() => {
    const id = setInterval(() => setLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (left <= 0) onDone()
  }, [left, onDone])

  const items = order.lines.reduce((a, l) => a + l.qty, 0)

  return (
    <div className="k-screen k-sent">
      <div className="k-sent-card">
        <div className="k-sent-check">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>¡Pedido enviado a cocina!</h1>
        <p>
          Tu orden <strong>#{order.id}</strong> ya aparece en la pantalla de la cocina.
          <br />
          Puedes seguir su estado en <strong>Mis pedidos</strong>.
        </p>
        <div className="k-sent-meta">
          <div><span>Mesa</span><strong>{order.table}</strong></div>
          <div><span>Productos</span><strong>{items}</strong></div>
          <div><span>Total</span><strong className="k-mono">{formatPrice(order.total)}</strong></div>
        </div>
        <div className="k-sent-actions">
          <button type="button" className="k-secondary" onClick={onTrack}>
            Ver estado del pedido
          </button>
          <button type="button" className="k-primary" onClick={onDone}>
            Volver al menú
          </button>
        </div>
        <div className="k-sent-auto">Regresando al menú en {Math.max(left, 0)} s</div>
      </div>
    </div>
  )
}
