"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { type Product } from "./products";
import { useContenido } from "./contenido-context";
import {
  aplicarFiltros,
  FILTROS_VACIOS,
  hayFiltrosActivos,
  parsearFiltros,
  serializarFiltros,
  type CategoriaFiltro,
  type Filtros,
  type OrdenId,
} from "./filtros";

/* ══════════════════════════════════════════════════════════════
   FILTROS CONTEXT — estado compartido del catálogo filtrable

   Mismo patrón que CartProvider y StockProvider. Existe para que el
   buscador del navbar y la grilla usen UN SOLO estado de búsqueda en vez
   de dos mecanismos paralelos, y para que sumar filtros nuevos no
   obligue a enhebrar props por media docena de componentes.

   La lógica de qué se muestra NO vive acá: vive en filtros.ts, que es
   puro. Acá sólo está el estado de React.
   ══════════════════════════════════════════════════════════════ */

type Accion =
  | { tipo: "categoria"; valor: CategoriaFiltro }
  | { tipo: "busqueda"; valor: string }
  | { tipo: "precio"; min: number | null; max: number | null }
  | { tipo: "orden"; valor: OrdenId }
  | { tipo: "limpiar" }
  /* Reemplazo completo que NO cuenta como interacción del usuario: lo usan
     la lectura inicial de la URL y el botón atrás del navegador. */
  | { tipo: "restaurar"; filtros: Filtros };

/** `tocado` = el usuario ya movió algún filtro. Sirve para no escalonar la
 *  entrada de las cards en cada refiltrado (sólo en la carga inicial). */
interface Estado {
  filtros: Filtros;
  tocado: boolean;
}

const ESTADO_INICIAL: Estado = { filtros: FILTROS_VACIOS, tocado: false };

function reducer(estado: Estado, accion: Accion): Estado {
  const conFiltros = (f: Filtros): Estado => ({ filtros: f, tocado: true });
  const { filtros } = estado;

  switch (accion.tipo) {
    case "categoria":
      return conFiltros({ ...filtros, categoria: accion.valor });
    case "busqueda":
      return conFiltros({ ...filtros, busqueda: accion.valor });
    case "precio":
      return conFiltros({ ...filtros, precioMin: accion.min, precioMax: accion.max });
    case "orden":
      return conFiltros({ ...filtros, orden: accion.valor });
    case "limpiar":
      /* Se conserva el orden elegido: es una preferencia de lectura, no
         un filtro, y perderlo al limpiar sería molesto. */
      return conFiltros({ ...FILTROS_VACIOS, orden: filtros.orden });
    case "restaurar":
      return { filtros: accion.filtros, tocado: estado.tocado };
  }
}

interface FiltrosContextType {
  filtros: Filtros;
  /** Productos que pasan los filtros, ya ordenados. */
  resultados: Product[];
  /** Cuántos productos hay en la vista actual (para el contador). */
  total: number;
  /** true si hay algún filtro puesto (el orden no cuenta). */
  hayFiltros: boolean;
  /** true desde que el usuario tocó el primer filtro. La grilla lo usa
   *  para escalonar la entrada de las cards sólo en la carga inicial. */
  tocado: boolean;
  setCategoria: (valor: CategoriaFiltro) => void;
  setBusqueda: (valor: string) => void;
  setPrecio: (min: number | null, max: number | null) => void;
  setOrden: (valor: OrdenId) => void;
  limpiar: () => void;
}

const FiltrosContext = createContext<FiltrosContextType | null>(null);

export function FiltrosProvider({ children }: { children: ReactNode }) {
  const [{ filtros, tocado }, dispatch] = useReducer(reducer, ESTADO_INICIAL);

  /* El catálogo EFECTIVO: el de products.ts con las descripciones y los
     precios por cantidad que se hayan editado desde el panel ya aplicados.

     Se filtra sobre este y no sobre `products` a propósito: así el
     buscador —que matchea por descripción— encuentra por el texto que el
     visitante realmente ve, y no por el que quedó en el código.

     Mientras los overrides no llegan (o si la base falla) esto ES
     `products`, con la misma identidad de array: no hay re-render. */
  const { productos } = useContenido();

  /* El catálogo es un array estático de 18 productos, así que filtrar es
     barato; el memo es para no romper la identidad de `resultados` en
     cada render y evitar re-renders en cascada de la grilla. */
  const resultados = useMemo(() => aplicarFiltros(productos, filtros), [productos, filtros]);

  const setCategoria = useCallback((valor: CategoriaFiltro) => dispatch({ tipo: "categoria", valor }), []);
  const setBusqueda = useCallback((valor: string) => dispatch({ tipo: "busqueda", valor }), []);
  const setPrecio = useCallback((min: number | null, max: number | null) => dispatch({ tipo: "precio", min, max }), []);
  const setOrden = useCallback((valor: OrdenId) => dispatch({ tipo: "orden", valor }), []);
  const limpiar = useCallback(() => dispatch({ tipo: "limpiar" }), []);

  /* ══════════════════════════════════════════════════════════════
     SINCRONIZACIÓN CON LA URL

     Se usa la History API nativa a propósito, en vez de useSearchParams:
     ese hook obliga a envolver el catálogo en <Suspense>, y eso lo saca
     del HTML prerenderizado — perdiendo el SEO que ya está hecho.
     ══════════════════════════════════════════════════════════════ */

  /* La URL no se escribe hasta haberla leído, para no pisar los params
     con los que el visitante entró. */
  const yaSeLeyoLaUrl = useRef(false);

  /* 1) Lectura inicial. Va en un efecto y NO en el estado inicial a
        propósito: la home se prerenderiza con los filtros vacíos, así que
        arrancar distinto en el cliente rompería la hidratación. El costo
        es un frame con el catálogo sin filtrar. */
  useEffect(() => {
    const desdeUrl = parsearFiltros(window.location.search);
    if (serializarFiltros(desdeUrl) !== "") {
      dispatch({ tipo: "restaurar", filtros: desdeUrl });
    }
    yaSeLeyoLaUrl.current = true;
  }, []);

  /* 2) Escritura, con debounce: escribir en cada tecla del buscador sería
        un manoseo inútil del historial. replaceState y no pushState, para
        no llenar el "atrás" con un paso por cada filtro. */
  useEffect(() => {
    if (!yaSeLeyoLaUrl.current) return;
    const t = setTimeout(() => {
      const qs = serializarFiltros(filtros);
      const { pathname, hash } = window.location;
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`);
    }, 300);
    return () => clearTimeout(t);
  }, [filtros]);

  /* 3) Atrás/adelante del navegador. Se restaura sin marcar `tocado`:
        no es el usuario moviendo un filtro. */
  useEffect(() => {
    const alNavegar = () =>
      dispatch({ tipo: "restaurar", filtros: parsearFiltros(window.location.search) });
    window.addEventListener("popstate", alNavegar);
    return () => window.removeEventListener("popstate", alNavegar);
  }, []);

  const valor = useMemo(
    () => ({
      filtros,
      resultados,
      total: resultados.length,
      hayFiltros: hayFiltrosActivos(filtros),
      tocado,
      setCategoria,
      setBusqueda,
      setPrecio,
      setOrden,
      limpiar,
    }),
    [filtros, tocado, resultados, setCategoria, setBusqueda, setPrecio, setOrden, limpiar]
  );

  return <FiltrosContext.Provider value={valor}>{children}</FiltrosContext.Provider>;
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext);
  if (!ctx) throw new Error("useFiltros debe usarse dentro de <FiltrosProvider>");
  return ctx;
}
