import { products, type Product } from "./products";

/* ══════════════════════════════════════════════════════════════
   CONFIGURACIÓN DE STOCK — granularidad por producto

   Permite granularidad MIXTA: un producto puede ofrecerse con más detalle
   del que se lleva en el stock. Por ejemplo, ofrecer 11 colores × 6
   modelos (66 combinaciones) pero llevar stock sólo por modelo (6 filas),
   coordinando el color por WhatsApp al cerrar la venta.

   ⚠️ Hoy NINGÚN producto usa esto: al salir los protectores del catálogo,
   no quedó ninguno con `options`. La maquinaria se conserva a propósito,
   porque los celulares usados que vienen más adelante van a necesitar
   variantes (color, capacidad).

   Este archivo es "puro": no toca la base de datos, así que lo pueden
   importar tanto el servidor como los componentes del navegador.
   ══════════════════════════════════════════════════════════════ */

/** Grupos de opciones por los que SÍ se lleva stock, por producto.
 *  Si un producto con opciones no figura acá, se lleva stock por todas
 *  sus opciones. Si no tiene opciones, lleva una sola fila (clave "").
 *  Vacío por ahora: ningún producto tiene opciones. */
export const STOCK_GROUPS: Record<string, string[]> = {};

/** Stock indexado: { productId: { stockKey: cantidad } } */
export type MapaDeStock = Record<string, Record<string, number>>;

/**
 * ¿Este producto lleva stock?
 *
 * Los marcados con `sinStock` (hoy, la promo de silicone case) están
 * siempre disponibles: no tienen fila en la base, el seed no se las crea
 * y el panel no los lista. Es la ÚNICA excepción al "fallar cerrado":
 * acá no hay número que consultar, así que no hay nada que fallar.
 */
export function llevaStock(product: Product): boolean {
  return product.sinStock !== true;
}

/** Grupos de opciones que definen el stock de un producto. */
export function gruposDeStock(product: Product): string[] {
  if (STOCK_GROUPS[product.id]) return STOCK_GROUPS[product.id];
  return (product.options ?? []).map((g) => g.label);
}

/** true si el stock de este producto se distingue por ese grupo de opciones.
 *  Ej: con stock por modelo, sería true para "Modelo" y false para "Color". */
export function esGrupoDeStock(product: Product, label: string): boolean {
  return gruposDeStock(product).includes(label);
}

/**
 * Clave de stock a partir de las opciones elegidas en el modal.
 * Devuelve "" para productos sin opciones.
 *
 * Ojo: NO siempre coincide con la `variante` del carrito. Con stock por
 * modelo, la variante podría ser "Negro Mate - Modelo X" mientras la clave
 * de stock es sólo "Modelo X".
 */
export function stockKeyDesdeOpciones(
  product: Product,
  opciones: Record<string, string>
): string {
  const grupos = gruposDeStock(product);
  if (grupos.length === 0) return "";
  return grupos.map((g) => opciones[g] ?? "").join(" - ");
}

/**
 * Todas las claves de stock de un producto, con su cantidad inicial.
 * Se usa para la carga inicial de la tabla.
 */
export function clavesDeStock(product: Product): { key: string; inicial: number | null }[] {
  /* Producto siempre disponible: ninguna fila (ni en el seed ni en el panel) */
  if (!llevaStock(product)) return [];

  const grupos = gruposDeStock(product);
  if (grupos.length === 0) return [{ key: "", inicial: null }];

  /* Producto con opciones: combinar los valores de los grupos que definen stock */
  const valoresPorGrupo = grupos.map(
    (label) => product.options?.find((g) => g.label === label)?.values ?? []
  );

  let combinaciones: string[][] = [[]];
  for (const valores of valoresPorGrupo) {
    combinaciones = combinaciones.flatMap((acc) => valores.map((v) => [...acc, v]));
  }

  return combinaciones.map((combo) => ({ key: combo.join(" - "), inicial: null }));
}

/** Todas las filas de stock que debería tener la tabla, según el catálogo. */
export function filasDeStockDelCatalogo(): {
  productId: string;
  key: string;
  inicial: number | null;
}[] {
  return products.flatMap((p) =>
    clavesDeStock(p).map(({ key, inicial }) => ({
      productId: p.id,
      key,
      inicial,
    }))
  );
}
