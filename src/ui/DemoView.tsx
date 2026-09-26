// Vista de presentación: tablet del cliente, caja, monitor de cocina y celular del mesero a la vez.
// Cada pantalla corre en su propio iframe (como dispositivos reales)
// y se sincronizan a través del OrderStore, sin recargar.
import { useEffect, useState } from 'react'
import { orderStore } from '../domain/orderStore'

const TABLET = { w: 1280, h: 800 }
const CAJA = { w: 1280, h: 800 }
const MONITOR = { w: 1920, h: 1080 }
const PHONE = { w: 390, h: 844 }
const GAP = 28
const PAD = 28
const BORDER = 10
const CAPTION = 30 // alto aproximado del rótulo de cada pantalla

function useScale() {
  const calc = () => {
    const byWidth = (window.innerWidth - PAD * 2 - GAP * 2 - BORDER * 6) / (TABLET.w + MONITOR.w + PHONE.w)
    const byHeight = (window.innerHeight - 110 - GAP - CAPTION * 2 - BORDER * 4) / (TABLET.h + CAJA.h)
    return Math.max(0.15, Math.min(byWidth, byHeight))
  }
  const [s, setS] = useState(calc)
  useEffect(() => {
    const on = () => setS(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return s
}

export function DemoView() {
  const s = useScale()
  const base = window.location.pathname + window.location.search

  return (
    <div style={{ minHeight: '100%', background: '#111114', color: '#d4d4dc', padding: PAD, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Foodtomation · Demo en vivo</h1>
        <span style={{ fontSize: '0.9rem', color: '#8a8a99' }}>
          Pide desde la tablet, avanza el pedido en cocina con las teclas 1–8 (clic en el monitor primero), entrégalo desde el celular del mesero y cierra la cuenta en caja.
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => orderStore.reset()}
          style={{ background: 'none', border: '1px solid #33333d', color: '#a0a0ad', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          Reiniciar datos de ejemplo
        </button>
      </div>
      <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
          <Frame title="Tablet del cliente — modo claro, táctil" src={`${base}#/`} size={TABLET} scale={s} />
          <Frame title="Caja — cierre de cuenta por mesa" src={`${base}#/caja`} size={CAJA} scale={s} />
        </div>
        <Frame title="Monitor de cocina (KDS) — modo oscuro, bump bar" src={`${base}#/kds`} size={MONITOR} scale={s} />
        <Frame title="Celular del mesero" src={`${base}#/mesero`} size={PHONE} scale={s} />
      </div>
    </div>
  )
}

function Frame({ title, src, size, scale }: { title: string; src: string; size: { w: number; h: number }; scale: number }) {
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', color: '#8a8a99', marginBottom: 8, textTransform: 'uppercase', height: CAPTION - 8 }}>
        {title} · {size.w}×{size.h}
      </figcaption>
      <div
        style={{
          width: size.w * scale, height: size.h * scale, overflow: 'hidden', borderRadius: 14,
          border: `${BORDER}px solid #000`, boxShadow: '0 20px 60px rgba(0,0,0,.5)', boxSizing: 'content-box',
        }}
      >
        <iframe
          title={title}
          src={src}
          style={{ width: size.w, height: size.h, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0', display: 'block' }}
        />
      </div>
    </figure>
  )
}
