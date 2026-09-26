import { useState } from 'react'
import { findItem } from '../../domain/menu'
import { formatPrice, lineTotal, modifierLabels, toOrderLines } from '../../domain/pricing'
import type { Order } from '../../domain/types'
import { useCart } from '../../state/CartContext'
import { useOrders } from '../../state/OrdersContext'
import { BackButton, DishImage, Stepper } from './shared'

export function CheckoutScreen({
  onBack,
  onSent,
}: {
  onBack: () => void
  onSent: (order: Order) => void
}) {
  const { table, lines, count, total, setQty, remove, clear } = useCart()
  const { submitOrder } = useOrders()
  const [sending, setSending] = useState(false)

  const send = () => {
    if (!lines.length || sending) return
    setSending(true)
    // La vista solo invoca la acción; la lógica vive en el dominio.
    const order = submitOrder(table, toOrderLines(lines), total)
    clear()
    onSent(order)
  }

  return (
    <div className="k-screen">
      <header className="k-header k-header-sub">
        <BackButton label="Seguir pidiendo" onClick={onBack} />
        <h1 className="k-page-title">Tu pedido</h1>
        <div className="k-table-pill">
          <span className="k-eyebrow">Tu mesa</span>
          <strong>{table}</strong>
        </div>
      </header>

      {lines.length === 0 ? (
        <div className="k-empty">
          <div className="k-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 4h2l2.4 11.2a1 1 0 001 .8h9.2a1 1 0 001-.8L20 8H6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Explora el menú y agrega tus platos favoritos.</p>
          <button type="button" className="k-primary" onClick={onBack}>Ver el menú</button>
        </div>
      ) : (
        <div className="k-checkout">
          <ul className="k-lines">
            {lines.map(line => {
              const item = findItem(line.itemId)
              if (!item) return null
              const mods = modifierLabels(line.itemId, line.modifierIds)
              return (
                <li key={line.lineId} className="k-line">
                  <DishImage src={item.image} name={item.name} className="k-line-img" />
                  <div className="k-line-info">
                    <h3>{item.name}</h3>
                    {mods.length > 0 && (
                      <div className="k-line-mods">
                        {mods.map(m => <span key={m} className="k-chip">{m}</span>)}
                      </div>
                    )}
                    {line.observation && (
                      <div className="k-line-obs">
                        <strong>Obs.:</strong> {line.observation}
                      </div>
                    )}
                    <button type="button" className="k-link-danger" onClick={() => remove(line.lineId)}>
                      Quitar
                    </button>
                  </div>
                  <Stepper size="md" value={line.qty} min={1} onChange={v => setQty(line.lineId, v)} />
                  <div className="k-line-total">{formatPrice(lineTotal(line))}</div>
                </li>
              )
            })}
          </ul>

          <aside className="k-summary">
            <div className="k-eyebrow">Resumen</div>
            <div className="k-summary-row">
              <span>Productos</span>
              <span>{count}</span>
            </div>
            <div className="k-summary-row">
              <span>Subtotal</span>
              <span className="k-mono">{formatPrice(total)}</span>
            </div>
            <div className="k-summary-rule" />
            <div className="k-summary-total">
              <span>Total</span>
              <span className="k-mono">{formatPrice(total)}</span>
            </div>
            <p className="k-summary-note">
              Revisa tu pedido antes de enviarlo. Irá directo a la cocina y podrás pagar al finalizar.
            </p>
            <button type="button" className="k-send-btn" onClick={send} disabled={sending}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              Enviar a cocina
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
