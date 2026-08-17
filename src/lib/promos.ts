import type { Product } from "./products";

/* ══════════════════════════════════════════════════════════════
   PROMOCIONES — badges, ofertas y urgencia de stock

   Archivo PURO: no toca React ni la base. Recibe el producto, sus datos
   promocionales y el stock, y devuelve QUÉ mostrar ya resuelto.

   ─── Pensado para migrar al panel ───
   Los componentes NO leen `product.badges` ni `product.precioAnterior`:
   consumen el resultado de `resolverPromo`. Los datos entran por el
   parámetro `datos`, que hoy sale del catálogo (ver use-promocion.ts) y
   mañana puede salir de la base sin tocar una sola card.

   El día que se editen desde el panel, el cambio es:
     1. tabla `promos` (product_id, badges, precio_anterior);
     2. un PromoProvider que la lea, igual que StockProvider;
     3. `use-promocion.ts` pasa a leer ese contexto en vez del catálogo.
   `promos.ts`, `BadgeProducto`, `CardPrecio` y `ProductModal` no cambian.
   ══════════════════════════════════════════════════════════════ */

/** Badges que se marcan A MANO. Son los únicos que hay. */
export type BadgeManualId = "oferta" | "nuevo" | "mas-comprados";

/** Datos promocionales de un producto. Hoy vienen del catálogo; el día de
 *  mañana, de la base. La forma es la misma. */
export interface DatosPromo {
  badges?: BadgeManualId[];
  /** Precio tachado. Se ignora si no es mayor al precio actual. */
  precioAnterior?: number;
}

/* ─── Regla del sistema: qué categorías NO llevan promoción ───
   Los vapers son productos con nicotina y su publicidad está regulada, así
   que su sección va SIN badges promocionales, SIN precio tachado y SIN
   urgencia. Es una regla del sistema y no una convención que haya que
   recordar: aunque un vaper quede marcado en products.ts, `resolverPromo`
   lo ignora. El renglón neutro de stock ("Quedan N") sí se muestra. */
const CATEGORIAS_SIN_PROMOCION: ReadonlySet<Product["category"]> = new Set(["vapers"]);

export function admitePromocion(product: Product): boolean {
  return !CATEGORIAS_SIN_PROMOCION.has(product.category);
}

/** Desde cuántas unidades para abajo se considera "últimas". */
export const UMBRAL_URGENCIA = 3;

/* ─── Catálogo visual de los badges ─── */
export type BadgeId = BadgeManualId;

export interface BadgeVisual {
  id: BadgeId;
  label: string;
  /** Tono: define los colores en el componente. */
  tono: "oferta" | "nuevo" | "social";
}

const BADGES_MANUALES: Record<BadgeManualId, Omit<BadgeVisual, "id">> = {
  oferta: { label: "OFERTA", tono: "oferta" },
  nuevo: { label: "NUEVO INGRESO", tono: "nuevo" },
  /* Etiqueta corta a propósito: el nombre largo ("más comprados de la
     semana") no entra prolijo en una card de 262px. */
  "mas-comprados": { label: "MÁS COMPRADO", tono: "social" },
};

/* ─── Prioridad cuando hay más de uno ───
   Se muestra UN SOLO badge. Tres badges apilados sobre una foto de 262px
   tapan el producto y, sobre todo, se anulan entre sí: si todo está
   destacado, nada lo está.

   El slot del badge es SÓLO para promoción. La urgencia por poco stock no
   compite por él: vive en el renglón de disponibilidad ("¡Últimas N
   unidades!"), así que un producto con poco stock y oferta muestra las dos
   cosas a la vez — el badge arriba y el renglón abajo.

   Entre los tres, el orden va de lo más accionable a lo más informativo:
     1. OFERTA       — es una razón concreta de precio para comprar ahora.
     2. NUEVO        — informativo.
     3. MÁS COMPRADO — prueba social; es la que menos cambia con el tiempo. */
const PRIORIDAD: BadgeId[] = ["oferta", "nuevo", "mas-comprados"];

/* ─── Oferta ─── */
export interface Oferta {
  anterior: number;
  actual: number;
  /** Diferencia en pesos. */
  ahorro: number;
  /** Porcentaje entero de descuento. */
  porcentaje: number;
}

export interface PromoResuelta {
  /** El badge de promoción a mostrar sobre la imagen, o null. */
  badge: BadgeVisual | null;
  /** Datos del precio tachado, o null si no hay oferta válida. */
  oferta: Oferta | null;
  /** Unidades restantes cuando entra en zona de urgencia, o null.
   *  NO es un badge: lo consume el renglón de disponibilidad. */
  urgencia: number | null;
}

const SIN_PROMO: PromoResuelta = { badge: null, oferta: null, urgencia: null };

/**
 * Resuelve qué mostrar para un producto.
 *
 * @param stockTotal Suma del stock de todas las variantes.
 *                   `null` = no se sabe todavía, o el producto no lleva stock.
 */
export function resolverPromo(
  product: Product,
  datos: DatosPromo,
  stockTotal: number | null
): PromoResuelta {
  if (!admitePromocion(product)) return SIN_PROMO;

  /* Oferta: sólo vale si el precio anterior es realmente mayor. Un dato
     mal cargado (igual o menor) se ignora en vez de mostrar un ahorro
     negativo o un 0%. */
  const actual = product.price;
  const anterior = datos.precioAnterior;
  let oferta: Oferta | null = null;
  if (actual != null && anterior != null && anterior > actual) {
    const ahorro = anterior - actual;
    oferta = {
      anterior,
      actual,
      ahorro,
      porcentaje: Math.round((ahorro / anterior) * 100),
    };
  }

  /* Urgencia: agotado (0) no es urgencia, es otra cosa; y sin dato de
     stock no se inventa nada. No compite por el badge: la consume el
     renglón de disponibilidad. */
  const urgencia =
    stockTotal !== null && stockTotal > 0 && stockTotal <= UMBRAL_URGENCIA ? stockTotal : null;

  /* Badge: se arma el conjunto de candidatos y gana el de mayor prioridad */
  const candidatos = new Set<BadgeId>(datos.badges ?? []);
  /* La oferta pone su badge sola: si hay precio anterior, hay oferta,
     aunque nadie la haya marcado a mano. */
  if (oferta) candidatos.add("oferta");

  const ganador = PRIORIDAD.find((id) => candidatos.has(id)) ?? null;
  const badge: BadgeVisual | null =
    ganador === null ? null : { id: ganador, ...BADGES_MANUALES[ganador] };

  return { badge, oferta, urgencia };
}
