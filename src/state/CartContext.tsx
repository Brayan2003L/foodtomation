// Estado del carrito del cliente en la tablet de su mesa.
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { cartCount, cartTotal, sameConfig } from '../domain/pricing'
import type { CartLine } from '../domain/types'

type NewLine = Omit<CartLine, 'lineId'>

type Action =
  | { type: 'add'; line: NewLine }
  | { type: 'setQty'; lineId: string; qty: number }
  | { type: 'remove'; lineId: string }
  | { type: 'clear' }

let seq = 0
const newId = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find(l => sameConfig(l, action.line))
      if (existing) {
        return state.map(l => (l === existing ? { ...l, qty: l.qty + action.line.qty } : l))
      }
      return [...state, { ...action.line, lineId: newId() }]
    }
    case 'setQty':
      return action.qty <= 0
        ? state.filter(l => l.lineId !== action.lineId)
        : state.map(l => (l.lineId === action.lineId ? { ...l, qty: action.qty } : l))
    case 'remove':
      return state.filter(l => l.lineId !== action.lineId)
    case 'clear':
      return []
  }
}

interface CartApi {
  table: string
  lines: CartLine[]
  count: number
  total: number
  add: (line: NewLine) => void
  setQty: (lineId: string, qty: number) => void
  remove: (lineId: string) => void
  clear: () => void
}

const CartContext = createContext<CartApi | null>(null)

export function CartProvider({ table, children }: { table: string; children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, [])

  const api = useMemo<CartApi>(
    () => ({
      table,
      lines,
      count: cartCount(lines),
      total: cartTotal(lines),
      add: line => dispatch({ type: 'add', line }),
      setQty: (lineId, qty) => dispatch({ type: 'setQty', lineId, qty }),
      remove: lineId => dispatch({ type: 'remove', lineId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [lines, table],
  )

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
