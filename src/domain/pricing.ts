// Reglas de negocio del carrito: funciones puras, fáciles de probar.
import { findItem } from './menu'
import type { CartLine, MenuItem, OrderLine } from './types'

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

export function unitPrice(item: MenuItem, modifierIds: string[]): number {
  const surcharge = item.modifiers
    .filter(m => modifierIds.includes(m.id))
    .reduce((acc, m) => acc + (m.surcharge ?? 0), 0)
  return item.price + surcharge
}

export function lineTotal(line: CartLine): number {
  const item = findItem(line.itemId)
  return item ? unitPrice(item, line.modifierIds) * line.qty : 0
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + lineTotal(l), 0)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.qty, 0)
}

/** Dos líneas son equivalentes si piden el mismo plato con la misma configuración. */
export function sameConfig(a: Omit<CartLine, 'lineId' | 'qty'>, b: Omit<CartLine, 'lineId' | 'qty'>): boolean {
  return (
    a.itemId === b.itemId &&
    a.observation.trim() === b.observation.trim() &&
    [...a.modifierIds].sort().join('|') === [...b.modifierIds].sort().join('|')
  )
}

export function modifierLabels(itemId: string, modifierIds: string[]): string[] {
  const item = findItem(itemId)
  if (!item) return []
  return item.modifiers.filter(m => modifierIds.includes(m.id)).map(m => m.label)
}

/** Convierte el carrito en líneas de comanda autocontenidas para la cocina. */
export function toOrderLines(lines: CartLine[]): OrderLine[] {
  return lines.flatMap(l => {
    const item = findItem(l.itemId)
    if (!item) return []
    const obs = l.observation.trim()
    return [{
      name: item.name,
      qty: l.qty,
      modifiers: modifierLabels(l.itemId, l.modifierIds),
      observation: obs || undefined,
      station: item.station,
      unitPrice: unitPrice(item, l.modifierIds),
    }]
  })
}
