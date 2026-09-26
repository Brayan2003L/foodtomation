// ─────────────────────────────────────────────────────────────
// Modelo de dominio de Foodtomation.
// Este módulo NO depende de React: es la capa de lógica de negocio.
// ─────────────────────────────────────────────────────────────

/** Estación de cocina que prepara el plato. */
export type Station = 'caliente' | 'frio' | 'barra'

export interface Modifier {
  id: string
  label: string
  /** Recargo opcional sobre el precio base. */
  surcharge?: number
}

export interface Category {
  id: string
  label: string
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  image?: string
  station: Station
  modifiers: Modifier[]
}

/** Línea del carrito del cliente (aún no enviada a cocina). */
export interface CartLine {
  lineId: string
  itemId: string
  qty: number
  modifierIds: string[]
  observation: string
}

/** Línea de una comanda ya enviada: autocontenida, sin referencias al menú. */
export interface OrderLine {
  name: string
  qty: number
  modifiers: string[]
  observation?: string
  station: Station
  /** Precio unitario con recargos incluidos, congelado al enviar la comanda. */
  unitPrice?: number
}

/**
 * Ciclo de vida de una comanda (sin intervención de meseros):
 *   en_cola         → el cliente la envió; espera turno en cocina
 *   en_preparacion  → el cocinero la tomó (1ª pulsación en la bump bar)
 *   listo           → terminada, lista para entregar (2ª pulsación)
 *   entregado       → el mesero confirma en su celular que la llevó a la mesa
 */
export type OrderStatus = 'en_cola' | 'en_preparacion' | 'listo' | 'entregado'

export const ORDER_FLOW: OrderStatus[] = ['en_cola', 'en_preparacion', 'listo', 'entregado']

export interface Order {
  id: number
  table: string
  createdAt: number
  lines: OrderLine[]
  total: number
  status: OrderStatus
  startedAt?: number
  readyAt?: number
  deliveredAt?: number
  /** Momento en que la caja cerró la cuenta de la mesa. */
  paidAt?: number
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia'

/** Cierre de cuenta de una mesa (operativo, no es una factura). */
export interface Settlement {
  id: number
  table: string
  orderIds: number[]
  subtotal: number
  tip: number
  total: number
  method: PaymentMethod
  received?: number
  change?: number
  paidAt: number
}
