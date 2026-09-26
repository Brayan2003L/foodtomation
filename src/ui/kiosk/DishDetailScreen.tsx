import { useState } from 'react'
import { CATEGORIES, findItem } from '../../domain/menu'
import { formatPrice, unitPrice } from '../../domain/pricing'
import { useCart } from '../../state/CartContext'
import { BackButton, Checkbox, DishImage, Stepper } from './shared'

export function DishDetailScreen({
  itemId,
  onBack,
  onAdded,
}: {
  itemId: string
  onBack: () => void
  onAdded: (name: string, qty: number) => void
}) {
  const item = findItem(itemId)
  const { add } = useCart()
  const [selected, setSelected] = useState<string[]>([])
  const [obs, setObs] = useState('')
  const [qty, setQty] = useState(1)

  if (!item) return null

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const unit = unitPrice(item, selected)
  const total = unit * qty
  const category = CATEGORIES.find(c => c.id === item.categoryId)

  const handleAdd = () => {
    add({ itemId: item.id, qty, modifierIds: selected, observation: obs.trim() })
    onAdded(item.name, qty)
  }

  return (
    <div className="k-screen k-detail">
      <div className="k-detail-split">
        {/* Izquierda — fotografía a gran escala */}
        <div className="k-detail-photo">
          <DishImage src={item.image} name={item.name} />
          <div className="k-detail-vignette" />
          <div className="k-detail-back">
            <BackButton label="Volver al menú" onClick={onBack} />
          </div>
        </div>

        {/* Derecha — información y modificadores */}
        <div className="k-detail-panel">
          <div className="k-detail-inner">
            <div className="k-eyebrow k-accent">{category?.label}</div>
            <h1 className="k-detail-title">{item.name}</h1>
            <p className="k-detail-desc">{item.description}</p>
            <div className="k-detail-price">{formatPrice(item.price)}</div>

            {item.modifiers.length > 0 && (
              <section className="k-block">
                <div className="k-eyebrow">Personaliza tu plato</div>
                <div className="k-mods">
                  {item.modifiers.map(mod => {
                    const isOn = selected.includes(mod.id)
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isOn}
                        className={`k-mod ${isOn ? 'is-on' : ''}`}
                        onClick={() => toggle(mod.id)}
                      >
                        <Checkbox checked={isOn} />
                        <span className="k-mod-label">{mod.label}</span>
                        {mod.surcharge ? <span className="k-mod-extra">+{formatPrice(mod.surcharge)}</span> : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="k-block">
              <label htmlFor="obs" className="k-eyebrow k-obs-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Observaciones especiales
              </label>
              <textarea
                id="obs"
                className="k-obs"
                value={obs}
                maxLength={140}
                onChange={e => setObs(e.target.value)}
                placeholder="Alergias, restricciones alimentarias o cualquier indicación para la cocina…"
                rows={3}
              />
              <div className="k-obs-hint">
                Llegará resaltada en la pantalla de cocina · {obs.length}/140
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Barra inferior: cantidad + botón masivo */}
      <div className="k-addbar">
        <Stepper value={qty} onChange={setQty} />
        <button type="button" className="k-add-btn" onClick={handleAdd}>
          <span>Agregar al carrito</span>
          <span className="k-add-total">{formatPrice(total)}</span>
        </button>
      </div>
    </div>
  )
}
