import type { Category, MenuItem } from './types'

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&h=700&fit=crop&auto=format`

export const CATEGORIES: Category[] = [
  { id: 'entradas', label: 'Entradas' },
  { id: 'fuertes', label: 'Platos fuertes' },
  { id: 'pastas', label: 'Pastas y pizzas' },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' },
]

const COMMON_ALLERGY = { id: 'sin-gluten', label: 'Sin gluten' }

export const MENU: MenuItem[] = [
  // ── Entradas ───────────────────────────────────────────────
  {
    id: 'ensalada-casa', categoryId: 'entradas', station: 'frio',
    name: 'Ensalada de la casa',
    description: 'Hojas verdes, aguacate, quinoa, tomate cherry y vinagreta de maracuyá.',
    price: 14, image: img('1512621776951-a57141f2eefd'),
    modifiers: [
      { id: 'sin-cebolla', label: 'Sin cebolla' },
      { id: 'aderezo-aparte', label: 'Aderezo aparte' },
      { id: 'add-pollo', label: 'Agregar pollo', surcharge: 5 },
    ],
  },
  {
    id: 'brochetas', categoryId: 'entradas', station: 'caliente',
    name: 'Brochetas a la parrilla',
    description: 'Res y pimentón asados al carbón con chimichurri de la casa.',
    price: 16, image: img('1555939594-58d7cb561ad1'),
    modifiers: [
      { id: 'sin-picante', label: 'Sin picante' },
      { id: 'salsa-aparte', label: 'Salsa aparte' },
      { id: 'extra-chimi', label: 'Extra chimichurri', surcharge: 2 },
    ],
  },
  {
    id: 'tartar-atun', categoryId: 'entradas', station: 'frio',
    name: 'Tartar de atún',
    description: 'Atún fresco, aguacate, ajonjolí tostado y crocantes de plátano.',
    price: 18,
    modifiers: [
      { id: 'sin-ajonjoli', label: 'Sin ajonjolí' },
      { id: 'sin-picante', label: 'Sin picante' },
    ],
  },

  // ── Platos fuertes ─────────────────────────────────────────
  {
    id: 'confit-pato', categoryId: 'fuertes', station: 'caliente',
    name: 'Confit de pato',
    description: 'Muslo de pato confitado, reducción de cereza y oporto, papas criollas asadas, espinaca y chalotas crocantes.',
    price: 34, image: img('1544025162-d76694265947'),
    modifiers: [
      { id: 'sin-salsa', label: 'Sin salsa' },
      { id: 'extra-veg', label: 'Vegetales extra' },
      { id: 'sin-papa', label: 'Sin papa' },
      { id: 'bien-cocido', label: 'Bien cocido' },
      COMMON_ALLERGY,
      { id: 'add-foie', label: 'Agregar foie gras', surcharge: 12 },
    ],
  },
  {
    id: 'costilla', categoryId: 'fuertes', station: 'caliente',
    name: 'Costilla de res',
    description: 'Cocción lenta por 12 horas, puré de papa rústico y vegetales glaseados.',
    price: 32, image: img('1504674900247-0877df9cc836'),
    modifiers: [
      { id: 'termino-medio', label: 'Término medio' },
      { id: 'bien-cocido', label: 'Bien cocido' },
      { id: 'sin-pure', label: 'Cambiar puré por ensalada' },
    ],
  },
  {
    id: 'hamburguesa', categoryId: 'fuertes', station: 'caliente',
    name: 'Hamburguesa de la casa',
    description: 'Carne angus de 200 g, queso cheddar madurado, tocineta y papas rústicas.',
    price: 22, image: img('1568901346375-23c9450c58cd'),
    modifiers: [
      { id: 'sin-cebolla', label: 'Sin cebolla' },
      { id: 'sin-tocineta', label: 'Sin tocineta' },
      { id: 'bien-cocido', label: 'Carne bien cocida' },
      COMMON_ALLERGY,
      { id: 'doble-carne', label: 'Doble carne', surcharge: 7 },
    ],
  },
  {
    id: 'bowl-pollo', categoryId: 'fuertes', station: 'frio',
    name: 'Bowl de pollo',
    description: 'Pollo a la plancha, arroz integral, garbanzos, vegetales frescos y hummus.',
    price: 19, image: img('1546069901-ba9599a7e63c'),
    modifiers: [
      { id: 'sin-hummus', label: 'Sin hummus' },
      { id: 'vegano', label: 'Versión vegana (tofu)' },
      { id: 'extra-proteina', label: 'Proteína extra', surcharge: 5 },
    ],
  },

  // ── Pastas y pizzas ────────────────────────────────────────
  {
    id: 'pizza-margarita', categoryId: 'pastas', station: 'caliente',
    name: 'Pizza margarita',
    description: 'Masa madre, tomate San Marzano, mozzarella fresca y albahaca.',
    price: 21, image: img('1565299624946-b28f40a0ae38'),
    modifiers: [
      { id: 'extra-queso', label: 'Extra queso', surcharge: 3 },
      { id: 'sin-albahaca', label: 'Sin albahaca' },
      COMMON_ALLERGY,
    ],
  },
  {
    id: 'pasta-pomodoro', categoryId: 'pastas', station: 'caliente',
    name: 'Pasta al pomodoro',
    description: 'Spaghetti, salsa de tomate de cocción lenta, parmesano y aceite de oliva.',
    price: 20, image: img('1473093295043-cdd812d0e601'),
    modifiers: [
      { id: 'sin-queso', label: 'Sin queso' },
      COMMON_ALLERGY,
      { id: 'add-camarones', label: 'Agregar camarones', surcharge: 8 },
    ],
  },

  // ── Postres ────────────────────────────────────────────────
  {
    id: 'pancakes', categoryId: 'postres', station: 'frio',
    name: 'Pancakes de la casa',
    description: 'Torre de pancakes, frutos rojos, miel de maple y mantequilla batida.',
    price: 12, image: img('1567620905732-2d1ec7ab7445'),
    modifiers: [
      { id: 'sin-mantequilla', label: 'Sin mantequilla' },
      { id: 'add-helado', label: 'Agregar helado', surcharge: 3 },
    ],
  },
  {
    id: 'tres-leches', categoryId: 'postres', station: 'frio',
    name: 'Torta tres leches',
    description: 'Bizcocho húmedo, merengue flameado y canela.',
    price: 10,
    modifiers: [{ id: 'sin-canela', label: 'Sin canela' }],
  },

  // ── Bebidas ────────────────────────────────────────────────
  {
    id: 'limonada-coco', categoryId: 'bebidas', station: 'barra',
    name: 'Limonada de coco',
    description: 'Limón fresco, crema de coco y hielo frappé.',
    price: 7,
    modifiers: [
      { id: 'sin-azucar', label: 'Sin azúcar' },
      { id: 'sin-hielo', label: 'Sin hielo' },
    ],
  },
  {
    id: 'cafe', categoryId: 'bebidas', station: 'barra',
    name: 'Café de origen',
    description: 'Café colombiano de especialidad, preparado en método filtrado.',
    price: 5,
    modifiers: [
      { id: 'leche-almendra', label: 'Con leche de almendras', surcharge: 1 },
      { id: 'sin-azucar', label: 'Sin azúcar' },
    ],
  },
  {
    id: 'jugo-natural', categoryId: 'bebidas', station: 'barra',
    name: 'Jugo natural',
    description: 'Fruta de temporada: mango, lulo o mora. En agua o en leche.',
    price: 6,
    modifiers: [
      { id: 'en-leche', label: 'En leche' },
      { id: 'sin-azucar', label: 'Sin azúcar' },
    ],
  },
]

export function findItem(id: string): MenuItem | undefined {
  return MENU.find(i => i.id === id)
}
