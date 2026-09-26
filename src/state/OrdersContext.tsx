// Puente entre el OrderStore (dominio) y React.
// Los componentes se suscriben como observadores vía useSyncExternalStore.
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { kitchenOrders, openTables, orderStore, readyOrders, type AccountRef, type OpenTable } from '../domain/orderStore'
import type { Order, OrderLine, PaymentMethod, Settlement } from '../domain/types'

interface OrdersApi {
  orders: Order[]
  /** En cola + en preparación, en orden de llegada. */
  kitchen: Order[]
  /** Listos para entregar. */
  ready: Order[]
  /** Mesas con cuenta abierta (vista de caja). */
  tables: OpenTable[]
  billRequests: Record<string, number[]>
  settlements: Settlement[]
  submitOrder: (table: string, lines: OrderLine[], total: number) => Order
  advance: (orderId: number) => Order | undefined
  undo: () => Order | undefined
  confirmDelivery: (orderId: number) => Order | undefined
  revertDelivery: (orderId: number) => Order | undefined
  requestBill: (table: string) => boolean
  settle: (account: AccountRef, method: PaymentMethod, tipRate: number, received?: number) => Settlement
  reset: () => void
}

const OrdersContext = createContext<OrdersApi | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(orderStore.subscribe, orderStore.getSnapshot)

  const api = useMemo<OrdersApi>(
    () => ({
      orders: state.orders,
      kitchen: kitchenOrders(state.orders),
      ready: readyOrders(state.orders),
      tables: openTables(state.orders, state.billRequests),
      billRequests: state.billRequests,
      settlements: state.settlements,
      submitOrder: (table, lines, total) => orderStore.submit(table, lines, total),
      advance: id => orderStore.advance(id),
      undo: () => orderStore.undo(),
      confirmDelivery: id => orderStore.confirmDelivery(id),
      revertDelivery: id => orderStore.revertDelivery(id),
      requestBill: table => orderStore.requestBill(table),
      settle: (account, method, tipRate, received) => orderStore.settle(account, method, tipRate, received),
      reset: () => orderStore.reset(),
    }),
    [state],
  )

  return <OrdersContext.Provider value={api}>{children}</OrdersContext.Provider>
}

export function useOrders(): OrdersApi {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders debe usarse dentro de <OrdersProvider>')
  return ctx
}
