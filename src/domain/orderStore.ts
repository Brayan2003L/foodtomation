// ─────────────────────────────────────────────────────────────
// OrderStore — Sujeto del patrón Observer.
//
// Mantiene las comandas, las solicitudes de cuenta y los cierres de
// caja, y notifica a todos los observadores suscritos cada vez que
// algo cambia. No sabe nada de React: la capa de presentación se
// suscribe a través de OrdersContext.
//
// Sincronización entre pantallas: el estado se persiste en
// localStorage y se escucha el evento `storage`, que el navegador
// emite en las demás pestañas/iframes del mismo origen. Así la tablet,
// el KDS y la caja se actualizan sin recargar la página. En producción
// este adaptador se reemplaza por un WebSocket/SSE hacia el backend
// sin tocar las pantallas.
// ─────────────────────────────────────────────────────────────
import { MENU } from './menu'
import type { Order, OrderLine, OrderStatus, PaymentMethod, Settlement } from './types'

type Listener = () => void

/** Última acción de cocina, para poder deshacerla con la tecla [0]. */
interface KitchenAction {
  orderId: number
  from: OrderStatus
  to: OrderStatus
}

export interface StoreState {
  orders: Order[]
  nextId: number
  lastAction?: KitchenAction
  /**
   * Solicitudes de cuenta por mesa (marcas de tiempo, en orden). Cada
   * solicitud cierra la sesión del comensal en la tablet: los pedidos
   * anteriores pasan a caja y la tablet queda limpia para el siguiente.
   */
  billRequests: Record<string, number[]>
  settlements: Settlement[]
}

const STORAGE_KEY = 'foodtomation:orders:v4'

function safeRead(): StoreState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoreState) : null
  } catch {
    return null
  }
}

function safeWrite(data: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* sin almacenamiento: el estado sigue vivo en memoria */
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
export const linesTotal = (lines: OrderLine[]) => round2(lines.reduce((a, l) => a + (l.unitPrice ?? 0) * l.qty, 0))

function seed(now: number): StoreState {
  const min = 60_000
  const price = (name: string) => MENU.find(m => m.name === name)?.price ?? 0
  const L = (qty: number, name: string, station: OrderLine['station'], modifiers: string[] = [], observation?: string): OrderLine =>
    ({ qty, name, station, modifiers, observation, unitPrice: price(name) })
  const o = (id: number, table: string, agoMin: number, status: OrderStatus, lines: OrderLine[], extra: Partial<Order> = {}): Order =>
    ({ id, table, createdAt: now - agoMin * min, lines, total: linesTotal(lines), status, ...extra })

  const paidEarlier = o(98, 'Mesa 01', 95, 'entregado', [
    L(2, 'Pizza margarita', 'caliente'), L(2, 'Jugo natural', 'barra'),
  ], { startedAt: now - 92 * min, readyAt: now - 80 * min, deliveredAt: now - 78 * min, paidAt: now - 35 * min })

  return {
    nextId: 106,
    billRequests: { 'Mesa 05': [now - 2 * min] },
    settlements: [{
      id: 1, table: 'Mesa 01', orderIds: [98], subtotal: paidEarlier.total, tip: round2(paidEarlier.total * 0.1),
      total: round2(paidEarlier.total * 1.1), method: 'tarjeta', paidAt: now - 35 * min,
    }],
    orders: [
      paidEarlier,
      o(99, 'Mesa 05', 42, 'entregado', [
        L(2, 'Costilla de res', 'caliente', ['Término medio']), L(1, 'Ensalada de la casa', 'frio'), L(2, 'Limonada de coco', 'barra'),
      ], { startedAt: now - 40 * min, readyAt: now - 25 * min, deliveredAt: now - 22 * min }),
      o(100, 'Mesa 03', 18, 'listo', [
        L(2, 'Brochetas a la parrilla', 'caliente'),
      ], { startedAt: now - 16 * min, readyAt: now - 2 * min }),
      o(101, 'Mesa 07', 13, 'en_preparacion', [
        L(1, 'Tartar de atún', 'frio', ['Sin ajonjolí']),
        L(2, 'Costilla de res', 'caliente', ['Término medio'], 'Alergia a los mariscos'),
      ], { startedAt: now - 10 * min }),
      o(102, 'Mesa 11', 8, 'en_preparacion', [
        L(2, 'Pasta al pomodoro', 'caliente', ['Sin gluten'], 'Celíaco, usar utensilios aparte'),
        L(1, 'Pizza margarita', 'caliente'),
      ], { startedAt: now - 5 * min }),
      o(103, 'Mesa 02', 4, 'en_cola', [
        L(3, 'Hamburguesa de la casa', 'caliente', ['Sin cebolla']), L(3, 'Limonada de coco', 'barra'),
      ]),
      o(104, 'Mesa 09', 1, 'en_cola', [
        L(1, 'Bowl de pollo', 'frio', ['Versión vegana (tofu)']), L(2, 'Café de origen', 'barra', ['Sin azúcar']),
      ]),
    ],
  }
}

/** Siguiente estado en el flujo de cocina (la cocina nunca marca "entregado"). */
function nextKitchenStatus(s: OrderStatus): OrderStatus | null {
  if (s === 'en_cola') return 'en_preparacion'
  if (s === 'en_preparacion') return 'listo'
  return null
}

function withStatus(order: Order, status: OrderStatus, now: number): Order {
  const next: Order = { ...order, status }
  if (status === 'en_cola') {
    next.startedAt = undefined
    next.readyAt = undefined
  }
  if (status === 'en_preparacion') {
    next.startedAt = order.startedAt ?? now
    next.readyAt = undefined
  }
  if (status === 'listo') next.readyAt = now
  if (status === 'entregado') next.deliveredAt = now
  return next
}

export class OrderStore {
  private state: StoreState
  private listeners = new Set<Listener>()

  constructor() {
    this.state = safeRead() ?? seed(Date.now())
    safeWrite(this.state)

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', e => {
        if (e.key !== STORAGE_KEY) return
        const next = safeRead()
        if (next) {
          this.state = next
          this.notify()
        }
      })
    }
  }

  // ── Observer API ───────────────────────────────────────────
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): StoreState => this.state

  private notify() {
    this.listeners.forEach(l => l())
  }

  private commit(next: StoreState) {
    this.state = next
    safeWrite(next)
    this.notify()
  }

  private replace(updated: Order, lastAction?: KitchenAction): Order {
    this.commit({
      ...this.state,
      lastAction: lastAction ?? this.state.lastAction,
      orders: this.state.orders.map(o => (o.id === updated.id ? updated : o)),
    })
    return updated
  }

  // ── Comandos del cliente ───────────────────────────────────
  submit(table: string, lines: OrderLine[], total: number): Order {
    if (lines.length === 0) throw new Error('No se puede enviar una orden vacía')
    // Relee por si otra pestaña creó una orden entre tanto.
    const current = safeRead() ?? this.state
    const order: Order = {
      id: current.nextId,
      table,
      createdAt: Date.now(),
      lines,
      total,
      status: 'en_cola',
    }
    this.commit({ ...current, nextId: current.nextId + 1, orders: [...current.orders, order] })
    return order
  }

  // ── Comandos del mesero ────────────────────────────────────
  /** El mesero confirma que llevó el pedido a la mesa. */
  confirmDelivery(orderId: number): Order | undefined {
    const target = this.state.orders.find(o => o.id === orderId && o.status === 'listo')
    return target ? this.replace(withStatus(target, 'entregado', Date.now())) : undefined
  }

  /** Deshace una entrega marcada por error (mientras la cuenta no se haya cerrado). */
  revertDelivery(orderId: number): Order | undefined {
    const target = this.state.orders.find(o => o.id === orderId && o.status === 'entregado' && !o.paidAt)
    if (!target) return undefined
    return this.replace({ ...target, status: 'listo', deliveredAt: undefined })
  }

  /**
   * El cliente pide la cuenta desde su tablet. Solo es posible cuando
   * todos sus pedidos fueron entregados; a partir de ese momento la
   * tablet deja de mostrarlos y la cuenta queda en manos de la caja.
   */
  requestBill(table: string): boolean {
    const session = tableOrders(this.state.orders, table, this.state.billRequests)
    if (session.length === 0 || session.some(o => o.status !== 'entregado')) return false
    const list = this.state.billRequests[table] ?? []
    this.commit({ ...this.state, billRequests: { ...this.state.billRequests, [table]: [...list, Date.now()] } })
    return true
  }

  // ── Comandos de cocina (bump bar) ──────────────────────────
  /** Avanza la comanda: en cola → en preparación → listo. */
  advance(orderId: number): Order | undefined {
    const target = this.state.orders.find(o => o.id === orderId)
    const to = target && nextKitchenStatus(target.status)
    if (!target || !to) return undefined
    return this.replace(withStatus(target, to, Date.now()), { orderId, from: target.status, to })
  }

  /** Deshace la última acción de la cocina. */
  undo(): Order | undefined {
    const action = this.state.lastAction
    if (!action) return undefined
    const target = this.state.orders.find(o => o.id === action.orderId)
    if (!target || target.status !== action.to) {
      this.commit({ ...this.state, lastAction: undefined })
      return undefined
    }
    const restored = withStatus(target, action.from, Date.now())
    this.commit({
      ...this.state,
      lastAction: undefined,
      orders: this.state.orders.map(o => (o.id === restored.id ? restored : o)),
    })
    return restored
  }

  // ── Comandos de caja ───────────────────────────────────────
  /**
   * Cierra una cuenta: marca como pagadas sus comandas, registra el
   * cierre y retira la solicitud de cuenta correspondiente.
   */
  settle(account: AccountRef, method: PaymentMethod, tipRate: number, received?: number): Settlement {
    const now = Date.now()
    const { table } = account
    const open = this.state.orders.filter(o => o.table === table && !o.paidAt && inAccount(o, account))
    if (open.length === 0) throw new Error(`La ${table} no tiene consumos pendientes`)
    const subtotal = round2(open.reduce((a, o) => a + o.total, 0))
    const tip = round2(subtotal * tipRate)
    const total = round2(subtotal + tip)
    if (method === 'efectivo' && (received ?? 0) < total) throw new Error('El monto recibido es menor que el total')

    const settlement: Settlement = {
      id: (this.state.settlements[this.state.settlements.length - 1]?.id ?? 0) + 1,
      table,
      orderIds: open.map(o => o.id),
      subtotal,
      tip,
      total,
      method,
      received: method === 'efectivo' ? received : undefined,
      change: method === 'efectivo' ? round2((received ?? 0) - total) : undefined,
      paidAt: now,
    }
    const ids = new Set(settlement.orderIds)
    const remaining = (this.state.billRequests[table] ?? []).filter(ts => ts !== account.upTo)
    const billRequests = { ...this.state.billRequests }
    if (remaining.length) billRequests[table] = remaining
    else delete billRequests[table]
    this.commit({
      ...this.state,
      billRequests,
      settlements: [...this.state.settlements, settlement],
      orders: this.state.orders.map(o => (ids.has(o.id) ? { ...o, paidAt: now } : o)),
    })
    return settlement
  }

  /** Reinicia la demo con las comandas de ejemplo. */
  reset() {
    this.commit(seed(Date.now()))
  }
}

export const orderStore = new OrderStore()

// ── Consultas (funciones puras) ──────────────────────────────
const byCreated = (a: Order, b: Order) => a.createdAt - b.createdAt

/** Comandas que la cocina debe atender: en cola o en preparación. */
export function kitchenOrders(orders: Order[]): Order[] {
  return orders.filter(o => o.status === 'en_cola' || o.status === 'en_preparacion').sort(byCreated)
}

/** Comandas terminadas esperando ser llevadas a la mesa. */
export function readyOrders(orders: Order[]): Order[] {
  return orders.filter(o => o.status === 'listo').sort((a, b) => (a.readyAt ?? 0) - (b.readyAt ?? 0))
}

/** Identifica una cuenta: los pedidos de la mesa creados en (after, upTo]. */
export interface AccountRef {
  table: string
  after?: number
  upTo?: number
}

function inAccount(o: Order, a: AccountRef): boolean {
  return (a.after === undefined || o.createdAt > a.after) && (a.upTo === undefined || o.createdAt <= a.upTo)
}

/**
 * Pedidos de la sesión actual de la tablet: los no pagados creados
 * después de la última solicitud de cuenta de la mesa.
 */
export function tableOrders(orders: Order[], table: string, billRequests: Record<string, number[]> = {}): Order[] {
  const reqs = billRequests[table] ?? []
  const since = reqs.length ? Math.max(...reqs) : undefined
  return orders
    .filter(o => o.table === table && !o.paidAt && (since === undefined || o.createdAt > since))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Cuántas comandas activas hay antes de esta en la cocina. */
export function queuePosition(orders: Order[], order: Order): number {
  return kitchenOrders(orders).filter(o => o.createdAt < order.createdAt).length
}

export interface OpenTable extends AccountRef {
  /** Identificador único de la cuenta (una mesa puede tener dos si llegó un cliente nuevo). */
  key: string
  /** Cuenta de un cliente nuevo en una mesa cuya cuenta anterior sigue sin pagar. */
  isNewSession: boolean
  table: string
  orders: Order[]
  subtotal: number
  openedAt: number
  billRequestedAt?: number
  /** Comandas que aún no se han entregado. */
  pending: number
}

/**
 * Cuentas abiertas: cada solicitud de cuenta parte los pedidos de la mesa
 * en sesiones. Primero las que pidieron la cuenta, luego las más antiguas.
 */
export function openTables(orders: Order[], billRequests: Record<string, number[]>): OpenTable[] {
  const byTable = new Map<string, Order[]>()
  for (const o of orders) {
    if (o.paidAt) continue
    byTable.set(o.table, [...(byTable.get(o.table) ?? []), o])
  }
  const accounts: OpenTable[] = []
  for (const [table, list] of byTable) {
    const sorted = [...list].sort(byCreated)
    const reqs = [...(billRequests[table] ?? [])].sort((a, b) => a - b)
    const bounds: (number | undefined)[] = [...reqs, undefined]
    let after: number | undefined
    bounds.forEach((upTo, i) => {
      const ref = { table, after, upTo }
      const segment = sorted.filter(o => inAccount(o, ref))
      if (segment.length) {
        accounts.push({
          ...ref,
          key: `${table}|${upTo ?? 'actual'}`,
          isNewSession: i > 0,
          orders: segment,
          subtotal: round2(segment.reduce((a, o) => a + o.total, 0)),
          openedAt: segment[0].createdAt,
          billRequestedAt: upTo,
          pending: segment.filter(o => o.status !== 'entregado').length,
        })
      }
      after = upTo
    })
  }
  return accounts.sort((a, b) => {
    if (!!a.billRequestedAt !== !!b.billRequestedAt) return a.billRequestedAt ? -1 : 1
    if (a.billRequestedAt && b.billRequestedAt) return a.billRequestedAt - b.billRequestedAt
    return a.openedAt - b.openedAt
  })
}
