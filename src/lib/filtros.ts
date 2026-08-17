import { CATEGORIAS, type Product } from "./products";

/* ══════════════════════════════════════════════════════════════
   FILTROS DEL CATÁLOGO — lógica pura

   Este archivo NO usa React ni toca la base: recibe una lista de
   productos y un objeto de filtros, y devuelve la lista resultante.
   Toda la semántica de "qué se muestra y en qué orden" vive acá.

   Es el punto de extensión: para sumar un filtro nuevo (por ejemplo
   "Nuevos / Usados" cuando entren los celulares usados) alcanza con
   agregar un campo a `Filtros`, su default en `FILTROS_VACIOS`, y su
   condición en `aplicarFiltros`. Ningún componente cambia.
   ══════════════════════════════════════════════════════════════ */

/** Categoría seleccionada. "todo" = no filtrar por categoría. */
export type CategoriaFiltro = "todo" | Product["category"];

/** Criterios de orden disponibles en el selector. */
export type OrdenId = "catalogo" | "precio-asc" | "precio-desc" | "alfabetico";

export const ORDENES: { id: OrdenId; label: string }[] = [
  /* El default es el orden de products.ts: se controla a mano editando
     el archivo, igual que el resto del catálogo. */
  { id: "catalogo", label: "Orden por defecto" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "alfabetico", label: "Nombre: A a Z" },
];

export interface Filtros {
  categoria: CategoriaFiltro;
  busqueda: string;
  /** null = sin tope. Son pesos, no centavos. */
  precioMin: number | null;
  precioMax: number | null;
  orden: OrdenId;
}

export const FILTROS_VACIOS: Filtros = {
  categoria: "todo",
  busqueda: "",
  precioMin: null,
  precioMax: null,
  orden: "catalogo",
};

/**
 * Criterio de búsqueda de un producto (nombre o descripción).
 * Es el MISMO que usaba ProductGrid antes de los filtros: se mudó acá sin
 * cambiarlo, para que el buscador del navbar y la grilla compartan una
 * sola fuente de verdad.
 */
export function coincideBusqueda(product: Product, query: string): boolean {
  const q = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q)
  );
}

/** ¿Hay algún filtro puesto? (el orden no cuenta como filtro) */
export function hayFiltrosActivos(filtros: Filtros): boolean {
  return (
    filtros.categoria !== "todo" ||
    filtros.busqueda.trim() !== "" ||
    filtros.precioMin !== null ||
    filtros.precioMax !== null
  );
}

/* ══════════════════════════════════════════════════════════════
   FILTROS ↔ URL

   Permite compartir un link ya filtrado ("mirá los vapers"), que para una
   tienda que vende por WhatsApp vale bastante.

   Se escriben SOLO los valores distintos del default, así la URL queda
   corta y legible. Estas funciones son puras: el manejo del historial
   (replaceState, popstate) vive en filtros-context.tsx.
   ══════════════════════════════════════════════════════════════ */

/** Filtros → query string, sin el "?". Devuelve "" si no hay nada puesto. */
export function serializarFiltros(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.categoria !== FILTROS_VACIOS.categoria) p.set("cat", f.categoria);
  const q = f.busqueda.trim();
  if (q !== "") p.set("q", q);
  if (f.precioMin !== null) p.set("min", String(f.precioMin));
  if (f.precioMax !== null) p.set("max", String(f.precioMax));
  if (f.orden !== FILTROS_VACIOS.orden) p.set("orden", f.orden);
  return p.toString();
}

/**
 * Query string → filtros. Todo lo que no se reconoce cae al default:
 * una URL manoseada nunca deja el catálogo en un estado imposible.
 */
export function parsearFiltros(search: string): Filtros {
  const p = new URLSearchParams(search);

  const numero = (v: string | null): number | null => {
    if (v === null || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const cat = p.get("cat");
  const orden = p.get("orden");

  return {
    categoria: CATEGORIAS.some((c) => c.id === cat)
      ? (cat as CategoriaFiltro)
      : FILTROS_VACIOS.categoria,
    busqueda: p.get("q") ?? "",
    precioMin: numero(p.get("min")),
    precioMax: numero(p.get("max")),
    orden: ORDENES.some((o) => o.id === orden) ? (orden as OrdenId) : FILTROS_VACIOS.orden,
  };
}

/* ─── Diagnóstico del estado vacío ───
   Cuando no queda ningún producto, saber CUÁL filtro lo dejó vacío es la
   diferencia entre "no hay nada" y "no hay nada con ese precio, pero sí
   hay 8 si lo sacás". Se averigua aflojando un filtro por vez y viendo
   cuál devuelve resultados. */

export interface DiagnosticoVacio {
  /** Filtro que, si se quitara, volvería a dar resultados.
   *  null = ninguno alcanza por sí solo (es la combinación). */
  culpable: "busqueda" | "precio" | "categoria" | null;
  /** Cuántos productos aparecerían al quitar ese filtro. */
  siSeQuita: number;
}

export function diagnosticarVacio(lista: Product[], filtros: Filtros): DiagnosticoVacio {
  const cuenta = (cambio: Partial<Filtros>) =>
    aplicarFiltros(lista, { ...filtros, ...cambio }).length;

  /* Orden a propósito: primero los controles (precio, categoría) y recién
     al final la búsqueda. Lo que el usuario escribió es lo que más quiere
     conservar, así que se sugiere aflojar lo otro antes de abandonarla. */
  if (filtros.precioMin !== null || filtros.precioMax !== null) {
    const n = cuenta({ precioMin: null, precioMax: null });
    if (n > 0) return { culpable: "precio", siSeQuita: n };
  }
  if (filtros.categoria !== "todo") {
    const n = cuenta({ categoria: "todo" });
    if (n > 0) return { culpable: "categoria", siSeQuita: n };
  }
  if (filtros.busqueda.trim() !== "") {
    const n = cuenta({ busqueda: "" });
    if (n > 0) return { culpable: "busqueda", siSeQuita: n };
  }
  return { culpable: null, siSeQuita: 0 };
}

/** Menor y mayor precio del catálogo, para los placeholders del rango. */
export function rangoDePrecios(lista: Product[]): { min: number; max: number } | null {
  const precios = lista.map((p) => p.price).filter((p): p is number => p != null);
  if (precios.length === 0) return null;
  return { min: Math.min(...precios), max: Math.max(...precios) };
}

/* ─── Orden ───
   Los productos sin precio van SIEMPRE al final de los órdenes por
   precio: no hay con qué compararlos, y dejarlos primero (como haría un
   0 implícito) los pondría arriba de todo. */
function compararPrecio(a: Product, b: Product, desc: boolean): number {
  const pa = a.price;
  const pb = b.price;
  if (pa == null && pb == null) return 0;
  if (pa == null) return 1;
  if (pb == null) return -1;
  return desc ? pb - pa : pa - pb;
}

/**
 * Aplica filtros y orden. NO muta la lista recibida.
 *
 * Reglas:
 *  - categoría "todo" no filtra nada.
 *  - la búsqueda ignora espacios al borde; vacía no filtra.
 *  - con un tope de precio activo, los productos SIN precio quedan fuera
 *    (no se puede afirmar que entren en el rango).
 *  - un rango invertido (min > max) no devuelve nada, que es la verdad:
 *    no hay producto que cumpla las dos condiciones.
 */
export function aplicarFiltros(lista: Product[], filtros: Filtros): Product[] {
  const q = filtros.busqueda.trim();
  const { categoria, precioMin, precioMax } = filtros;

  const filtrados = lista.filter((p) => {
    if (categoria !== "todo" && p.category !== categoria) return false;
    if (q !== "" && !coincideBusqueda(p, q)) return false;

    if (precioMin !== null || precioMax !== null) {
      if (p.price == null) return false;
      if (precioMin !== null && p.price < precioMin) return false;
      if (precioMax !== null && p.price > precioMax) return false;
    }
    return true;
  });

  switch (filtros.orden) {
    case "precio-asc":
      return [...filtrados].sort((a, b) => compararPrecio(a, b, false));
    case "precio-desc":
      return [...filtrados].sort((a, b) => compararPrecio(a, b, true));
    case "alfabetico":
      return [...filtrados].sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "catalogo":
    default:
      /* Sin ordenar: se respeta el orden de products.ts */
      return filtrados;
  }
}
