"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { products, type Product } from "./products";
import { aplicarOverrides, type MapaContenido } from "./contenido";

/* ══════════════════════════════════════════════════════════════
   CONTENIDO CONTEXT — catálogo con los textos y precios ya resueltos

   Mismo patrón que StockProvider: contexto de cliente que se carga al
   montar, así la web pública sigue siendo ESTÁTICA (`/` queda ○ Static).

   ⚠️⚠️ FALLA ABIERTO — AL REVÉS QUE EL STOCK ⚠️⚠️

   Arranca con el catálogo de products.ts y sólo lo pisa si la API
   responde bien. Si falla —o si no hay base configurada, como en local
   sin .env.local— el sitio muestra los valores del código y nadie se
   entera. No hay estado de "cargando" visible a propósito: siempre hay
   algo válido para mostrar, así que no existe el parpadeo que sí tiene
   el stock con su "Verificando stock…".

   ⚠️ NO agregarle un "fallar cerrado" por simetría con el stock. Ver el
   porqué en la cabecera de contenido.ts.

   Por qué el estado inicial es el catálogo pelado y no los overrides:
   el HTML prerenderizado sale con los valores del código, así que el
   primer render del cliente tiene que dar exactamente lo mismo o la
   hidratación se rompe. Los overrides entran después, en un efecto.
   ══════════════════════════════════════════════════════════════ */

export type EstadoContenido = "cargando" | "listo" | "error";

interface ContenidoContextType {
  estado: EstadoContenido;
  /** El catálogo con descripciones y packPrecios ya resueltos. */
  productos: Product[];
  /** Un producto por id, ya resuelto. null si no existe. */
  productoPorId: (id: string) => Product | null;
  recargar: () => void;
}

const ContenidoContext = createContext<ContenidoContextType | null>(null);

export function ContenidoProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<MapaContenido>({});
  const [estado, setEstado] = useState<EstadoContenido>("cargando");

  /* Traer los overrides es una función PURA de red: no toca el estado.
     Quien la llama decide qué hacer con el resultado, y así el efecto de
     montaje no dispara un setState sincrónico. */
  const traer = useCallback(async (): Promise<MapaContenido | null> => {
    try {
      const res = await fetch("/api/contenido", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.ok || typeof data.overrides !== "object" || data.overrides === null) {
        throw new Error("Respuesta inesperada");
      }
      return data.overrides as MapaContenido;
    } catch {
      /* null = no se pudo. Fallar ABIERTO lo resuelve quien llama, que
         se queda con products.ts. */
      return null;
    }
  }, []);

  useEffect(() => {
    /* `vivo` evita tocar el estado si el provider se desmontó mientras
       la respuesta venía en camino. */
    let vivo = true;
    traer().then((mapa) => {
      if (!vivo) return;
      setOverrides(mapa ?? {});
      setEstado(mapa ? "listo" : "error");
    });
    return () => {
      vivo = false;
    };
  }, [traer]);

  const cargar = useCallback(() => {
    traer().then((mapa) => {
      setOverrides(mapa ?? {});
      setEstado(mapa ? "listo" : "error");
    });
  }, [traer]);

  /* `aplicarOverrides` devuelve el MISMO array si no hay nada que pisar,
     así que sin overrides esto no dispara ni un re-render de la grilla. */
  const productos = useMemo(() => aplicarOverrides(products, overrides), [overrides]);

  const productoPorId = useCallback(
    (id: string): Product | null => productos.find((p) => p.id === id) ?? null,
    [productos]
  );

  return (
    <ContenidoContext.Provider value={{ estado, productos, productoPorId, recargar: cargar }}>
      {children}
    </ContenidoContext.Provider>
  );
}

/**
 * Catálogo efectivo.
 *
 * Fuera del provider devuelve el catálogo del código en vez de romper: es
 * coherente con fallar abierto y deja que /carrito y cualquier vista
 * suelta funcionen sin montar el provider.
 */
export function useContenido(): ContenidoContextType {
  const ctx = useContext(ContenidoContext);
  if (ctx) return ctx;
  return SIN_PROVIDER;
}

const SIN_PROVIDER: ContenidoContextType = {
  estado: "error",
  productos: products,
  productoPorId: (id: string) => products.find((p) => p.id === id) ?? null,
  recargar: () => {},
};
