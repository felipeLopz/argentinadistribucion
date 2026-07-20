import { products, type Product } from "./products";

/* ══════════════════════════════════════════════════════════════
   CONFIGURACIÓN DE STOCK — granularidad por producto

   Decisión tomada (granularidad MIXTA): no todos los productos llevan
   stock con el mismo detalle que sus opciones de compra.

   Ejemplo clave: las fundas 11-16 se ofrecen en 11 colores × 6 modelos
   (66 combinaciones), pero el stock se lleva SOLO por modelo (6 filas).
   El color se coordina por WhatsApp al cerrar la venta.

   Este archivo es "puro": no toca la base de datos, así que lo pueden
   importar tanto el servidor como los componentes del navegador.
   ══════════════════════════════════════════════════════════════ */

/** Grupos de opciones por los que SÍ se lleva stock, por producto.
 *  Si un producto con opciones no figura acá, se lleva stock por todas
 *  sus opciones. Si no tiene opciones, lleva una sola fila (clave ""). */
export const STOCK_GROUPS: Record<string, string[]> = {
  "apl-1": ["Modelo"], // fundas 11-16: por modelo, NO por color
  "apl-4": ["Color"],  // funda 17: solo color
  "apl-5": ["Modelo"], // protectores 11-16: solo modelo
};

/** Prefijo con el que la camiseta arma su variante ("Talle L").
 *  Se mantiene igual que en el carrito para que las claves coincidan. */
const TALLE_PREFIJO = "Talle ";

/** Stock indexado: { productId: { stockKey: cantidad } } */
export type MapaDeStock = Record<string, Record<string, number>>;

/** Grupos de opciones que definen el stock de un producto. */
export function gruposDeStock(product: Product): string[] {
  if (STOCK_GROUPS[product.id]) return STOCK_GROUPS[product.id];
  return (product.options ?? []).map((g) => g.label);
}

/** true si el stock de este producto se distingue por ese grupo de opciones.
 *  Ej: en las fundas 11-16 es true para "Modelo" y false para "Color". */
export function esGrupoDeStock(product: Product, label: string): boolean {
  return gruposDeStock(product).includes(label);
}

/**
 * Clave de stock a partir de las opciones elegidas en el modal.
 * Devuelve "" para productos sin opciones.
 *
 * Ojo: NO siempre coincide con la `variante` del carrito. Para las fundas
 * 11-16 la variante es "Negro Mate - iPhone 13" pero la clave de stock es
 * "iPhone 13", porque el stock se lleva solo por modelo.
 */
export function stockKeyDesdeOpciones(
  product: Product,
  opciones: Record<string, string>
): string {
  if (product.talleStock) {
    const talle = opciones[TALLE_PREFIJO.trim()] ?? opciones["Talle"] ?? "";
    return talle ? `${TALLE_PREFIJO}${talle}` : "";
  }
  const grupos = gruposDeStock(product);
  if (grupos.length === 0) return "";
  return grupos.map((g) => opciones[g] ?? "").join(" - ");
}

/** Clave de stock de un talle puntual de la camiseta. */
export function stockKeyDeTalle(talle: string): string {
  return `${TALLE_PREFIJO}${talle}`;
}

/**
 * Todas las claves de stock de un producto, con su cantidad inicial.
 * Se usa para la carga inicial de la tabla.
 */
export function clavesDeStock(product: Product): { key: string; inicial: number | null }[] {
  /* Camiseta: usa los talles y sus cantidades ya conocidas */
  if (product.talleStock) {
    return Object.entries(product.talleStock).map(([talle, cant]) => ({
      key: stockKeyDeTalle(talle),
      inicial: cant,
    }));
  }

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
