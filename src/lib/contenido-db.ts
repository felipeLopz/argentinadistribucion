import { getSql } from "./db";
import type { MapaContenido } from "./contenido";

/* ══════════════════════════════════════════════════════════════
   CONTENIDO EDITABLE — acceso a la base
   ⚠️ SOLO SERVIDOR (importa la conexión).

   Una fila por producto que tenga ALGO editado. Los productos sin editar
   no tienen fila: el catálogo de products.ts ya es la base.

   Cada columna es un override independiente y con tres estados:
     - NULL  → sin override: manda products.ts
     - valor → manda el override
     - `pack_precios = '[]'` → override explícito "sin promo por cantidad"
       (apagar una promo que el código sí define, sin hacer deploy)

   ⚠️ Este módulo FALLA ABIERTO junto con el resto del contenido: quien
   lee decide qué hacer con el error, y lo que hace es caer al código.
   Ver la cabecera de contenido.ts — el criterio es el OPUESTO al stock.
   ══════════════════════════════════════════════════════════════ */

/** Código de Postgres para "la tabla no existe" (undefined_table). */
const TABLA_INEXISTENTE = "42P01";

let tablaLista = false;

/**
 * Crea la tabla si no existe. Idempotente.
 *
 * La llaman SOLO las rutas del panel: la lectura pública no hace DDL, así
 * el tráfico de visitantes nunca dispara un CREATE TABLE. La tabla queda
 * creada la primera vez que entrás al panel.
 */
export async function asegurarTabla(): Promise<void> {
  if (tablaLista) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS contenido_overrides (
      product_id   text PRIMARY KEY,
      descripcion  text,
      pack_precios jsonb,
      updated_at   timestamptz NOT NULL DEFAULT now(),
      updated_by   text
    )
  `;
  tablaLista = true;
}

interface FilaCruda {
  product_id: string;
  descripcion: string | null;
  pack_precios: number[] | null;
}

/**
 * Lee todos los overrides, indexados por id de producto.
 *
 * Si la tabla todavía no existe (nunca se entró al panel) devuelve un mapa
 * vacío en vez de romper: no hay overrides, que es exactamente la verdad.
 * Cualquier otro error SÍ se propaga, y quien llama cae al código.
 */
export async function leerOverrides(): Promise<MapaContenido> {
  const sql = getSql();
  let filas: FilaCruda[];
  try {
    filas = (await sql`
      SELECT product_id, descripcion, pack_precios FROM contenido_overrides
    `) as FilaCruda[];
  } catch (err) {
    if ((err as { code?: string })?.code === TABLA_INEXISTENTE) return {};
    throw err;
  }

  const mapa: MapaContenido = {};
  for (const f of filas) {
    mapa[f.product_id] = {
      descripcion: f.descripcion,
      packPrecios: f.pack_precios,
    };
  }
  return mapa;
}

/** Fila con metadatos de auditoría, para el panel. */
export interface FilaContenido {
  product_id: string;
  descripcion: string | null;
  pack_precios: number[] | null;
  updated_at: string;
  updated_by: string | null;
}

/** Lee los overrides con metadatos. Solo el panel (requiere sesión). */
export async function leerOverridesDetallados(): Promise<FilaContenido[]> {
  await asegurarTabla();
  const sql = getSql();
  return (await sql`
    SELECT product_id, descripcion, pack_precios, updated_at, updated_by
      FROM contenido_overrides
  `) as FilaContenido[];
}

/** Guarda (o pisa) la descripción de un producto. */
export async function fijarDescripcion(
  productId: string,
  texto: string,
  usuario: string
): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  await sql`
    INSERT INTO contenido_overrides (product_id, descripcion, updated_at, updated_by)
    VALUES (${productId}, ${texto}, now(), ${usuario})
    ON CONFLICT (product_id)
    DO UPDATE SET descripcion = ${texto}, updated_at = now(), updated_by = ${usuario}
  `;
}

/**
 * Guarda (o pisa) los precios por cantidad.
 * Una lista vacía se guarda como `[]`, que NO es lo mismo que NULL: es el
 * override explícito de "este producto no tiene promo por cantidad".
 */
export async function fijarPackPrecios(
  productId: string,
  precios: number[],
  usuario: string
): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  const json = JSON.stringify(precios);
  await sql`
    INSERT INTO contenido_overrides (product_id, pack_precios, updated_at, updated_by)
    VALUES (${productId}, ${json}::jsonb, now(), ${usuario})
    ON CONFLICT (product_id)
    DO UPDATE SET pack_precios = ${json}::jsonb, updated_at = now(), updated_by = ${usuario}
  `;
}

/** Qué campo se borra al volver al valor del código. */
export type CampoContenido = "descripcion" | "packPrecios";

/**
 * Borra un override y vuelve al valor de products.ts.
 * Si el producto queda sin ningún override, se borra la fila entera para
 * no dejar filas huérfanas con todo en NULL.
 */
export async function borrarOverride(
  productId: string,
  campo: CampoContenido,
  usuario: string
): Promise<void> {
  await asegurarTabla();
  const sql = getSql();

  if (campo === "descripcion") {
    await sql`
      UPDATE contenido_overrides
         SET descripcion = NULL, updated_at = now(), updated_by = ${usuario}
       WHERE product_id = ${productId}
    `;
  } else {
    await sql`
      UPDATE contenido_overrides
         SET pack_precios = NULL, updated_at = now(), updated_by = ${usuario}
       WHERE product_id = ${productId}
    `;
  }

  await sql`
    DELETE FROM contenido_overrides
     WHERE product_id = ${productId}
       AND descripcion IS NULL
       AND pack_precios IS NULL
  `;
}
