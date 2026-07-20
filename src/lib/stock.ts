import { getSql } from "./db";
import { filasDeStockDelCatalogo, type MapaDeStock } from "./stock-config";

/* ══════════════════════════════════════════════════════════════
   ACCESO AL STOCK — ⚠️ SOLO SERVIDOR (importa la conexión a la base)

   El stock vive en la base; el catálogo (nombres, precios, imágenes,
   opciones) sigue viviendo en products.ts. La base guarda solo números.

   Identidad de cada fila: (product_id, stock_key), con stock_key "" para
   los productos sin opciones.
   ══════════════════════════════════════════════════════════════ */

export type { MapaDeStock };

/** Cantidad por defecto para filas nuevas cuyo valor no conocemos. */
const STOCK_INICIAL_POR_DEFECTO = 10;

/** Crea la tabla si no existe. Idempotente. */
export async function crearTabla(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS stock (
      product_id  text        NOT NULL,
      stock_key   text        NOT NULL DEFAULT '',
      cantidad    integer     NOT NULL DEFAULT 0,
      updated_at  timestamptz NOT NULL DEFAULT now(),
      updated_by  text,
      PRIMARY KEY (product_id, stock_key)
    )
  `;
}

/**
 * Inserta las filas que falten según el catálogo actual.
 * NO pisa las filas existentes: es seguro correrlo de nuevo cuando se
 * agregan productos nuevos al catálogo.
 * Devuelve cuántas filas se crearon.
 */
export async function sincronizarConCatalogo(): Promise<{
  creadas: number;
  totalCatalogo: number;
}> {
  const sql = getSql();
  await crearTabla();

  const filas = filasDeStockDelCatalogo();
  let creadas = 0;

  for (const fila of filas) {
    const cantidad = fila.inicial ?? STOCK_INICIAL_POR_DEFECTO;
    const res = await sql`
      INSERT INTO stock (product_id, stock_key, cantidad, updated_by)
      VALUES (${fila.productId}, ${fila.key}, ${cantidad}, 'carga-inicial')
      ON CONFLICT (product_id, stock_key) DO NOTHING
      RETURNING product_id
    `;
    if (res.length > 0) creadas++;
  }

  return { creadas, totalCatalogo: filas.length };
}

/** Fila de stock con sus metadatos de auditoría (para el panel). */
export interface FilaStockDetallada {
  product_id: string;
  stock_key: string;
  cantidad: number;
  updated_at: string;
  updated_by: string | null;
}

/** Lee el stock con metadatos. Solo lo usa el panel (requiere sesión). */
export async function leerStockDetallado(): Promise<FilaStockDetallada[]> {
  const sql = getSql();
  return (await sql`
    SELECT product_id, stock_key, cantidad, updated_at, updated_by
      FROM stock
  `) as FilaStockDetallada[];
}

/** Lee todo el stock. Lanza error si la base no responde (fallamos cerrado). */
export async function leerStock(): Promise<MapaDeStock> {
  const sql = getSql();
  const filas = (await sql`
    SELECT product_id, stock_key, cantidad FROM stock
  `) as { product_id: string; stock_key: string; cantidad: number }[];

  const mapa: MapaDeStock = {};
  for (const f of filas) {
    if (!mapa[f.product_id]) mapa[f.product_id] = {};
    mapa[f.product_id][f.stock_key] = f.cantidad;
  }
  return mapa;
}

/** Fija el stock de una variante. Se usará desde el panel (Fase 3). */
export async function fijarStock(
  productId: string,
  stockKey: string,
  cantidad: number,
  usuario: string
): Promise<void> {
  const sql = getSql();
  const valor = Math.max(0, Math.floor(cantidad));
  await sql`
    INSERT INTO stock (product_id, stock_key, cantidad, updated_at, updated_by)
    VALUES (${productId}, ${stockKey}, ${valor}, now(), ${usuario})
    ON CONFLICT (product_id, stock_key)
    DO UPDATE SET cantidad = ${valor}, updated_at = now(), updated_by = ${usuario}
  `;
}

/**
 * Descuenta unidades (al confirmar una venta por WhatsApp). Nunca baja de 0.
 * Devuelve la cantidad resultante, o null si la fila no existe.
 */
export async function descontarStock(
  productId: string,
  stockKey: string,
  unidades: number,
  usuario: string
): Promise<number | null> {
  const sql = getSql();
  const n = Math.max(1, Math.floor(unidades));
  const res = (await sql`
    UPDATE stock
       SET cantidad = GREATEST(0, cantidad - ${n}),
           updated_at = now(),
           updated_by = ${usuario}
     WHERE product_id = ${productId} AND stock_key = ${stockKey}
     RETURNING cantidad
  `) as { cantidad: number }[];
  return res.length > 0 ? res[0].cantidad : null;
}
