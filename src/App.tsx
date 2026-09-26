// ─────────────────────────────────────────────────────────────
// Foodtomation — punto de entrada y enrutamiento por dispositivo.
//
//   /#/            → Tablet del cliente (menú, detalle, checkout)
//   /#/kds         → Monitor de cocina (muro de comandas)
//   /#/caja        → Caja (cierre de cuenta por mesa)
//   /#/mesero      → Celular del mesero (platos listos para entregar)
//   /#/demo        → Todas las pantallas a la vez, para presentar
//
// La mesa se asigna por URL: /?mesa=12#/
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { CartProvider } from './state/CartContext'
import { OrdersProvider } from './state/OrdersContext'
import { KioskApp } from './ui/kiosk/KioskApp'
import { KdsBoard } from './ui/kds/KdsBoard'
import { CajaApp } from './ui/caja/CajaApp'
import { MeseroApp } from './ui/mesero/MeseroApp'
import { DemoView } from './ui/DemoView'

type Route = 'kiosk' | 'kds' | 'caja' | 'mesero' | 'demo'

function readRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return h === 'kds' || h === 'caja' || h === 'mesero' || h === 'demo' ? h : 'kiosk'
}

function readTable(): string {
  const raw = new URLSearchParams(window.location.search).get('mesa') ?? '4'
  const n = raw.replace(/\D/g, '') || '4'
  return `Mesa ${n.padStart(2, '0')}`
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === 'demo') return <DemoView />

  return (
    <OrdersProvider>
      {route === 'kds' ? (
        <KdsBoard />
      ) : route === 'caja' ? (
        <CajaApp />
      ) : route === 'mesero' ? (
        <MeseroApp />
      ) : (
        <CartProvider table={readTable()}>
          <KioskApp />
        </CartProvider>
      )}
    </OrdersProvider>
  )
}
