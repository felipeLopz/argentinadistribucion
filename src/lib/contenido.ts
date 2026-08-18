import type { Product } from "./products";

/* ══════════════════════════════════════════════════════════════
   CONTENIDO EDITABLE — lógica pura (sin React, sin base de datos)

   Qué resuelve: la DESCRIPCIÓN y los PRECIOS POR CANTIDAD de un producto
   se pueden editar desde /admindistribucion sin tocar código ni hacer
   deploy. Los valores de `products.ts` siguen siendo la BASE; la base de
   datos guarda únicamente lo que se editó.

       Precedencia:   override de la base   >   valor de products.ts

   ⚠️⚠️ ESTO FALLA ABIERTO — AL REVÉS QUE EL STOCK ⚠️⚠️

   Si la base no responde, o si una fila guardada quedó corrupta, se usan
   los valores del código. Nunca se muestra un producto sin descripción ni
   sin precio.

   El stock falla CERRADO (sin datos → agotado) porque prometer stock que
   no existe cuesta una venta caída y un cliente enojado. Acá el criterio
   es el OPUESTO: una descripción desactualizada es molesta, pero un
   producto sin descripción o sin precio directamente no se puede vender.

   ⚠️ NO "corregir" esto para que se parezca al stock. Son criterios
   opuestos a propósito, cada uno por su motivo.
   ══════════════════════════════════════════════════════════════ */

/* ─── Límites ───
   Topes de cordura para lo que llega por la API. No son reglas de negocio:
   están para que un payload absurdo no entre a la base. */

/** Largo máximo de una descripción. Las del catálogo rondan los 200. */
export const LARGO_MAX_DESCRIPCION = 600;

/** Máximo de escalones de un pack. */
export const MAX_ESCALONES = 24;

/** Techo por escalón, en pesos. */
export const PRECIO_MAX = 100_000_000;

/**
 * Override guardado para un producto.
 *
 * Los dos campos son independientes y tienen TRES estados:
 *   - ausente / null  → no hay override: manda el valor de products.ts
 *   - valor válido    → manda el override
 *   - `packPrecios: []` → override explícito "este producto NO tiene promo
 *     por cantidad", aunque el código sí se la defina. Es lo que permite
 *     apagar una promo sin hacer deploy.
 */
export interface OverrideContenido {
  descripcion?: string | null;
  packPrecios?: number[] | null;
}

/** Overrides indexados por id de producto. */
export type MapaContenido = Record<string, OverrideContenido>;

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

/* ─── Validaciones ───
   Las usa el handler de escritura ANTES de guardar, y también la
   resolución al leer: una fila que no pasa se descarta y se cae al
   código. Así una fila corrupta no rompe la web. */

/** Valida una descripción. Devuelve el texto ya recortado. */
export function validarDescripcion(entrada: unknown): Resultado<string> {
  if (typeof entrada !== "string") {
    return { ok: false, error: "La descripción tiene que ser texto." };
  }
  const texto = entrada.trim();
  if (texto === "") {
    return {
      ok: false,
      error: "La descripción no puede quedar vacía. Si querés el texto original, usá «Volver al código».",
    };
  }
  if (texto.length > LARGO_MAX_DESCRIPCION) {
    return {
      ok: false,
      error: `La descripción no puede pasar de ${LARGO_MAX_DESCRIPCION} caracteres (tiene ${texto.length}).`,
    };
  }
  return { ok: true, valor: texto };
}

/**
 * Valida una lista de precios por cantidad.
 *
 * La POSICIÓN define la cantidad: `precios[0]` es el precio de 1 unidad,
 * `precios[1]` el de 2, y así. Por eso los escalones son necesariamente
 * consecutivos desde 1, y un hueco (un `null` o un salteado) es un error
 * de carga, no un escalón "sin precio".
 *
 * Una lista vacía es válida y significa "sin promo por cantidad".
 */
export function validarPackPrecios(entrada: unknown): Resultado<number[]> {
  if (!Array.isArray(entrada)) {
    return { ok: false, error: "Los precios por cantidad tienen que venir como una lista." };
  }
  if (entrada.length === 0) return { ok: true, valor: [] };

  if (entrada.length > MAX_ESCALONES) {
    return {
      ok: false,
      error: `Son demasiados escalones: ${entrada.length}. El máximo es ${MAX_ESCALONES}.`,
    };
  }

  const precios: number[] = [];
  for (let i = 0; i < entrada.length; i++) {
    const n = entrada[i];
    const unidades = i + 1;

    /* Hueco: null, undefined, "" o cualquier cosa que no sea número.
       Cubre el "sin escalones vacíos": como la posición ES la cantidad,
       dejar uno vacío correría todos los de abajo. */
    if (n === null || n === undefined || n === "" || typeof n !== "number" || !Number.isFinite(n)) {
      return {
        ok: false,
        error: `Falta el precio de ${unidades} ${unidades === 1 ? "unidad" : "unidades"}. Todos los escalones tienen que tener precio.`,
      };
    }
    if (!Number.isInteger(n)) {
      return {
        ok: false,
        error: `El precio de ${unidades} ${unidades === 1 ? "unidad" : "unidades"} tiene que ser un número entero, sin centavos (llegó ${n}).`,
      };
    }
    if (n <= 0) {
      return {
        ok: false,
        error: `El precio de ${unidades} ${unidades === 1 ? "unidad" : "unidades"} tiene que ser mayor que 0.`,
      };
    }
    if (n > PRECIO_MAX) {
      return {
        ok: false,
        error: `El precio de ${unidades} ${unidades === 1 ? "unidad" : "unidades"} es demasiado grande.`,
      };
    }
    precios.push(n);
  }

  /* Techo por escalón: un pack de N nunca puede salir más que N veces el
     precio de 1. Si eso pasa, el pack es más caro que comprar suelto y es
     un error de carga (un cero de más, o los precios corridos). */
  const unitario = precios[0];
  for (let i = 1; i < precios.length; i++) {
    const unidades = i + 1;
    const techo = unitario * unidades;
    if (precios[i] > techo) {
      return {
        ok: false,
        error:
          `El pack de ${unidades} unidades sale $${precios[i].toLocaleString("es-AR")}, ` +
          `más que ${unidades} veces el precio de 1 ($${techo.toLocaleString("es-AR")}). ` +
          `Así conviene comprarlas sueltas: revisá la carga.`,
      };
    }
  }

  return { ok: true, valor: precios };
}

/* ─── Resolución ─── */

/**
 * Devuelve el producto con su contenido efectivo aplicado.
 *
 * Fallar abierto en la práctica: cualquier override ausente, nulo o que
 * no pase la validación se DESCARTA en silencio y queda el valor del
 * código. Esta función no lanza nunca.
 *
 * Si no hay nada que cambiar devuelve el MISMO objeto, para no romper la
 * identidad referencial de la que dependen los memos de la grilla.
 */
export function aplicarOverride(product: Product, override?: OverrideContenido | null): Product {
  if (!override) return product;

  const parches: Partial<Product> = {};

  if (override.descripcion !== undefined && override.descripcion !== null) {
    const v = validarDescripcion(override.descripcion);
    if (v.ok && v.valor !== product.description) parches.description = v.valor;
  }

  if (override.packPrecios !== undefined && override.packPrecios !== null) {
    const v = validarPackPrecios(override.packPrecios);
    if (v.ok) {
      /* Lista vacía = "sin promo por cantidad". Se representa quitando el
         campo, que es lo que el resto del código entiende como sin promo. */
      const nuevo = v.valor.length > 0 ? v.valor : undefined;
      if (!mismosPrecios(nuevo, product.packPrecios)) parches.packPrecios = nuevo;
    }
  }

  if (Object.keys(parches).length === 0) return product;
  return { ...product, ...parches };
}

/** Aplica los overrides a todo el catálogo, preservando identidades. */
export function aplicarOverrides(productos: Product[], mapa: MapaContenido | null): Product[] {
  if (!mapa || Object.keys(mapa).length === 0) return productos;

  let hubocambio = false;
  const salida = productos.map((p) => {
    const efectivo = aplicarOverride(p, mapa[p.id]);
    if (efectivo !== p) hubocambio = true;
    return efectivo;
  });

  /* Sin cambios reales, se devuelve el array original: si no, cada carga
     de overrides dispararía un re-render de la grilla entera para nada. */
  return hubocambio ? salida : productos;
}

function mismosPrecios(a: number[] | undefined, b: number[] | undefined): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return a.length === b.length && a.every((n, i) => n === b[i]);
}
