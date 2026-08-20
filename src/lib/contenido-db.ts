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

/** "la columna no existe" (undefined_column). Pasa en la ventana entre que
 *  se deploya una columna nueva y alguien entra al panel, que es lo que
 *  dispara la migración. Se trata igual que la tabla ausente: todavía no
 *  hay overrides. */
const COLUMNA_INEXISTENTE = "42703";

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
      nombre         text,
      imagen         text,
      descripcion    text,
      pack_precios   jsonb,
      opciones_extra jsonb,
      updated_at   timestamptz NOT NULL DEFAULT now(),
      updated_by   text
    )
  `;

  /* Para las bases que ya existían antes de que el título fuera editable:
     el CREATE de arriba no corre (la tabla ya está) así que la columna la
     tiene que agregar este ALTER. Es idempotente, se puede correr siempre.
     No hay que ejecutar nada a mano: pasa sola al entrar al panel. */
  await sql`ALTER TABLE contenido_overrides ADD COLUMN IF NOT EXISTS nombre text`;
  await sql`ALTER TABLE contenido_overrides ADD COLUMN IF NOT EXISTS imagen text`;
  await sql`ALTER TABLE contenido_overrides ADD COLUMN IF NOT EXISTS opciones_extra jsonb`;

  tablaLista = true;
}

interface FilaCruda {
  product_id: string;
  nombre: string | null;
  imagen: string | null;
  descripcion: string | null;
  pack_precios: number[] | null;
  opciones_extra: Record<string, string[]> | null;
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
      SELECT product_id, nombre, imagen, descripcion, pack_precios, opciones_extra
        FROM contenido_overrides
    `) as FilaCruda[];
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === TABLA_INEXISTENTE || code === COLUMNA_INEXISTENTE) return {};
    throw err;
  }

  const mapa: MapaContenido = {};
  for (const f of filas) {
    mapa[f.product_id] = {
      nombre: f.nombre,
      imagen: f.imagen,
      descripcion: f.descripcion,
      packPrecios: f.pack_precios,
      opcionesExtra: f.opciones_extra,
    };
  }
  return mapa;
}

/** Fila con metadatos de auditoría, para el panel. */
export interface FilaContenido {
  product_id: string;
  nombre: string | null;
  imagen: string | null;
  descripcion: string | null;
  pack_precios: number[] | null;
  opciones_extra: Record<string, string[]> | null;
  updated_at: string;
  updated_by: string | null;
}

/** Lee los overrides con metadatos. Solo el panel (requiere sesión). */
export async function leerOverridesDetallados(): Promise<FilaContenido[]> {
  await asegurarTabla();
  const sql = getSql();
  return (await sql`
    SELECT product_id, nombre, imagen, descripcion, pack_precios, opciones_extra,
           updated_at, updated_by
      FROM contenido_overrides
  `) as FilaContenido[];
}

/** Guarda (o pisa) el título de un producto. */
export async function fijarNombre(
  productId: string,
  texto: string,
  usuario: string
): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  await sql`
    INSERT INTO contenido_overrides (product_id, nombre, updated_at, updated_by)
    VALUES (${productId}, ${texto}, now(), ${usuario})
    ON CONFLICT (product_id)
    DO UPDATE SET nombre = ${texto}, updated_at = now(), updated_by = ${usuario}
  `;
}

/** Guarda (o pisa) la foto principal de un producto (URL del Blob). */
export async function fijarImagen(
  productId: string,
  url: string,
  usuario: string
): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  await sql`
    INSERT INTO contenido_overrides (product_id, imagen, updated_at, updated_by)
    VALUES (${productId}, ${url}, now(), ${usuario})
    ON CONFLICT (product_id)
    DO UPDATE SET imagen = ${url}, updated_at = now(), updated_by = ${usuario}
  `;
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

/**
 * Guarda el mapa COMPLETO de valores extra de un producto.
 *
 * Quien llama arma el mapa nuevo a partir del que ya estaba: acá no hay
 * lógica de mezcla, para que la validación (duplicados, largo, tope) viva
 * en un solo lugar y no se duplique entre el handler y el SQL.
 *
 * ⚠️ No existe una función para QUITAR valores, y es a propósito: sacar
 * uno dejaría stock huérfano y carritos apuntando a una variante que ya
 * no existe. Tampoco hay acción de borrado en la API.
 */
export async function fijarOpcionesExtra(
  productId: string,
  mapa: Record<string, string[]>,
  usuario: string
): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  const json = JSON.stringify(mapa);
  await sql`
    INSERT INTO contenido_overrides (product_id, opciones_extra, updated_at, updated_by)
    VALUES (${productId}, ${json}::jsonb, now(), ${usuario})
    ON CONFLICT (product_id)
    DO UPDATE SET opciones_extra = ${json}::jsonb, updated_at = now(), updated_by = ${usuario}
  `;
}

/** Qué campo se borra al volver al valor del código.
 *  ⚠️ `opcionesExtra` NO está: los valores creados no se pueden quitar. */
export type CampoContenido = "nombre" | "imagen" | "descripcion" | "packPrecios";

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

  if (campo === "nombre") {
    await sql`
      UPDATE contenido_overrides
         SET nombre = NULL, updated_at = now(), updated_by = ${usuario}
       WHERE product_id = ${productId}
    `;
  } else if (campo === "imagen") {
    /* Sólo se olvida la URL: el blob NO se borra, porque los carritos que
       la gente tenga abiertos la siguen referenciando. Ver la nota de la
       ruta de subida. */
    await sql`
      UPDATE contenido_overrides
         SET imagen = NULL, updated_at = now(), updated_by = ${usuario}
       WHERE product_id = ${productId}
    `;
  } else if (campo === "descripcion") {
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
       AND nombre IS NULL
       AND imagen IS NULL
       AND opciones_extra IS NULL
       AND descripcion IS NULL
       AND pack_precios IS NULL
  `;
}
