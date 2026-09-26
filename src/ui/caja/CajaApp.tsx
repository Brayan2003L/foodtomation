// ─────────────────────────────────────────────────────────────
// Caja — cierre de cuenta por mesa (operativo, no es facturación).
// Equipo de mostrador con mouse o pantalla táctil, modo claro.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import type { OpenTable } from '../../domain/orderStore'
import { formatPrice } from '../../domain/pricing'
import type { Order, PaymentMethod, Settlement } from '../../domain/types'
import { useOrders } from '../../state/OrdersContext'

const TIP_RATE = 0.1

const STATUS_LABEL: Record<Order['status'], string> = {
  en_cola: 'En cola',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'transferencia', label: 'Transferencia' },
]

const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
const round2 = (n: number) => Math.round(n * 100) / 100

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function CajaApp() {
  const { tables, settlements } = useOrders()
  const now = useNow()
  const [selected, setSelected] = useState<string | null>(null)
  const [toast, setToast] = useState<Settlement | null>(null)

  // Mantener una mesa seleccionada: la elegida si sigue abierta, si no la primera de la lista.
  useEffect(() => {
    if (!selected || !tables.some(t => t.key === selected)) setSelected(tables[0]?.key ?? null)
  }, [tables, selected])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const startOfDay = new Date(now).setHours(0, 0, 0, 0)
  const today = settlements.filter(s => s.paidAt >= startOfDay)
  const salesToday = round2(today.reduce((a, s) => a + s.total, 0))
  const requests = tables.filter(t => t.billRequestedAt).length
  const current = tables.find(t => t.key === selected) ?? null

  return (
    <div className="caja">
      <header className="c-header">
        <div className="c-brand">
          <span className="c-brand-mark">F</span>
          <span className="c-brand-word">Foodtomation</span>
          <span className="c-brand-role">Caja</span>
        </div>
        <div className="c-stats">
          <Stat label="Cuentas abiertas" value={String(tables.length)} />
          <Stat label="Piden la cuenta" value={String(requests)} tone={requests ? 'alert' : undefined} />
          <Stat label={`Ventas de hoy · ${today.length} ${today.length === 1 ? 'cierre' : 'cierres'}`} value={formatPrice(salesToday)} mono />
        </div>
        <div className="c-clock">{hhmm(now)}</div>
      </header>

      <div className="c-body">
        <aside className="c-list">
          <div className="c-section-title">Cuentas abiertas</div>
          {tables.length === 0 && <div className="c-list-empty">No hay cuentas abiertas.</div>}
          {tables.map(t => (
            <TableCard key={t.key} t={t} now={now} active={t.key === selected} onClick={() => setSelected(t.key)} />
          ))}

          {today.length > 0 && (
            <>
              <div className="c-section-title c-mt">Cierres de hoy</div>
              {[...today].reverse().slice(0, 6).map(s => (
                <div key={s.id} className="c-closed">
                  <span className="c-closed-table">{s.table}</span>
                  <span className="c-closed-meta">{hhmm(s.paidAt)} · {METHODS.find(m => m.id === s.method)?.label}</span>
                  <span className="c-closed-total">{formatPrice(s.total)}</span>
                </div>
              ))}
            </>
          )}
        </aside>

        <main className="c-detail">
          {current ? (
            <TableDetail key={current.key} t={current} now={now} onSettled={setToast} />
          ) : (
            <div className="c-detail-empty">
              <h2>Sin cuentas pendientes</h2>
              <p>Cuando una mesa envíe pedidos, su cuenta aparecerá aquí.</p>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="c-toast" role="status">
          <span className="c-toast-icon">✓</span>
          <span>
            <strong>{toast.table} cerrada</strong> · {METHODS.find(m => m.id === toast.method)?.label} · {formatPrice(toast.total)}
            {toast.change !== undefined && toast.change > 0 && <> · Cambio {formatPrice(toast.change)}</>}
          </span>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone, mono }: { label: string; value: string; tone?: 'alert'; mono?: boolean }) {
  return (
    <div className={`c-stat ${tone === 'alert' ? 'is-alert' : ''}`}>
      <span className={`c-stat-value ${mono ? 'c-mono' : ''}`}>{value}</span>
      <span className="c-stat-label">{label}</span>
    </div>
  )
}

function TableCard({ t, now, active, onClick }: { t: OpenTable; now: number; active: boolean; onClick: () => void }) {
  const openMin = Math.max(0, Math.floor((now - t.openedAt) / 60000))
  const reqMin = t.billRequestedAt ? Math.max(0, Math.floor((now - t.billRequestedAt) / 60000)) : 0
  return (
    <button type="button" className={`c-card ${active ? 'is-active' : ''} ${t.billRequestedAt ? 'is-request' : ''}`} onClick={onClick}>
      <div className="c-card-row">
        <span className="c-card-table">
          {t.table}
          {t.isNewSession && <span className="c-new-session">Cliente nuevo</span>}
        </span>
        {t.billRequestedAt && <span className="c-badge-request">Pidió la cuenta · {reqMin} min</span>}
      </div>
      <div className="c-card-meta">
        {t.orders.length} {t.orders.length === 1 ? 'pedido' : 'pedidos'} · abierta hace {openMin} min
      </div>
      <div className="c-card-row">
        <span className={`c-chip ${t.pending ? 'is-pending' : 'is-ok'}`}>
          {t.pending ? `${t.pending} sin entregar` : 'Todo entregado'}
        </span>
        <span className="c-card-total">{formatPrice(t.subtotal)}</span>
      </div>
    </button>
  )
}

function quickAmounts(total: number): number[] {
  const opts = [Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100]
  return [...new Set(opts)].filter(v => v > total).slice(0, 3)
}

function TableDetail({ t, now, onSettled }: { t: OpenTable; now: number; onSettled: (s: Settlement) => void }) {
  const { settle } = useOrders()
  const [withTip, setWithTip] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('tarjeta')
  const [received, setReceived] = useState('')
  const [error, setError] = useState<string | null>(null)

  const tip = withTip ? round2(t.subtotal * TIP_RATE) : 0
  const total = round2(t.subtotal + tip)
  const receivedNum = Number(received.replace(',', '.')) || 0
  const change = round2(receivedNum - total)
  const cashOk = method !== 'efectivo' || receivedNum >= total
  const openMin = Math.max(0, Math.floor((now - t.openedAt) / 60000))
  const quick = useMemo(() => quickAmounts(total), [total])

  const pay = () => {
    try {
      const s = settle(t, method, withTip ? TIP_RATE : 0, method === 'efectivo' ? receivedNum : undefined)
      onSettled(s)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="c-detail-inner">
      <div className="c-consumo">
        <header className="c-detail-head">
          <div>
            <h1>{t.table}{t.isNewSession && <span className="c-new-session is-lg">Cliente nuevo</span>}</h1>
            <p>Cuenta abierta desde las {hhmm(t.openedAt)} · hace {openMin} min</p>
          </div>
          {t.billRequestedAt && <span className="c-badge-request is-lg">El cliente pidió la cuenta</span>}
        </header>

        {t.pending > 0 && (
          <div className="c-warning">
            ⚠ {t.pending === 1 ? 'Hay 1 pedido que aún no se ha entregado' : `Hay ${t.pending} pedidos que aún no se han entregado`} en la mesa.
            Confirma con el cliente antes de cobrar.
          </div>
        )}

        {t.orders.map(o => (
          <section key={o.id} className="c-order">
            <div className="c-order-head">
              <span>Pedido #{o.id} · {hhmm(o.createdAt)}</span>
              <span className={`c-chip ${o.status === 'entregado' ? 'is-ok' : 'is-pending'}`}>{STATUS_LABEL[o.status]}</span>
            </div>
            <table className="c-lines">
              <tbody>
                {o.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="c-qty">{l.qty}×</td>
                    <td>
                      <div className="c-line-name">{l.name}</div>
                      {l.modifiers.length > 0 && <div className="c-line-mods">{l.modifiers.join(' · ')}</div>}
                    </td>
                    <td className="c-num c-muted">{formatPrice(l.unitPrice ?? 0)}</td>
                    <td className="c-num">{formatPrice((l.unitPrice ?? 0) * l.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <aside className="c-pay">
        <div className="c-section-title">Resumen</div>
        <div className="c-row"><span>Subtotal</span><span className="c-mono">{formatPrice(t.subtotal)}</span></div>
        <button type="button" className={`c-toggle ${withTip ? 'is-on' : ''}`} onClick={() => setWithTip(v => !v)} role="switch" aria-checked={withTip}>
          <span className="c-toggle-track"><span className="c-toggle-thumb" /></span>
          <span className="c-toggle-label">Propina voluntaria (10 %)</span>
          <span className="c-mono">{formatPrice(tip)}</span>
        </button>
        <div className="c-total"><span>Total</span><span className="c-mono">{formatPrice(total)}</span></div>

        <div className="c-section-title c-mt">Medio de pago</div>
        <div className="c-methods">
          {METHODS.map(m => (
            <button key={m.id} type="button" className={`c-method ${method === m.id ? 'is-on' : ''}`} onClick={() => { setMethod(m.id); setError(null) }}>
              {m.label}
            </button>
          ))}
        </div>

        {method === 'efectivo' && (
          <div className="c-cash">
            <label htmlFor="recibido" className="c-cash-label">Monto recibido</label>
            <input
              id="recibido"
              className="c-input"
              inputMode="decimal"
              placeholder="0.00"
              value={received}
              onChange={e => { setReceived(e.target.value.replace(/[^\d.,]/g, '')); setError(null) }}
            />
            <div className="c-quick">
              <button type="button" onClick={() => setReceived(total.toFixed(2))}>Exacto</button>
              {quick.map(v => (
                <button key={v} type="button" onClick={() => setReceived(v.toFixed(2))}>{formatPrice(v)}</button>
              ))}
            </div>
            <div className={`c-change ${receivedNum && !cashOk ? 'is-short' : ''}`}>
              <span>{receivedNum && !cashOk ? 'Faltan' : 'Cambio'}</span>
              <span className="c-mono">{formatPrice(Math.abs(receivedNum ? change : 0))}</span>
            </div>
          </div>
        )}

        {error && <div className="c-error">{error}</div>}

        <button type="button" className="c-pay-btn" disabled={!cashOk} onClick={pay}>
          Cobrar {formatPrice(total)} y cerrar cuenta
        </button>
        <p className="c-footnote">Cierre operativo de la cuenta. La factura electrónica se emite en el sistema contable del restaurante.</p>
      </aside>
    </div>
  )
}
