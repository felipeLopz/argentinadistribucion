"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Product } from "./products";
import {
  stockKeyDesdeOpciones,
  stockKeyDeTalle,
  type MapaDeStock,
} from "./stock-config";

/* ══════════════════════════════════════════════════════════════
   STOCK CONTEXT — stock compartido, leído desde /api/stock

   Mismo patrón que CartProvider: contexto de cliente, se carga al montar.
   Así la web pública sigue siendo estática (no se vuelve dinámica).

   ⚠️ FALLAMOS CERRADO: si la API no responde, todo se trata como agotado.
   Preferimos frenar una venta antes que prometer stock inexistente.

   Tres estados, con una distinción importante:
     - "cargando" → todavía NO sabemos  → devuelve null → no se puede agregar,
                    pero tampoco mostramos "Agotado" (evita el cartel falso
                    de agotado durante el parpadeo inicial).
     - "listo"    → datos reales.
     - "error"    → devuelve 0 → agotado en toda la web.
   ══════════════════════════════════════════════════════════════ */

export type EstadoStock = "cargando" | "listo" | "error";

interface StockContextType {
  estado: EstadoStock;
  /** Stock de una clave concreta. null = todavía no se sabe. */
  stockDeClave: (productId: string, key: string) => number | null;
  /** Stock según las opciones elegidas en el modal. null = no se sabe. */
  stockDeOpciones: (product: Product, opciones: Record<string, string>) => number | null;
  /** Stock de un talle de la camiseta. null = no se sabe. */
  stockDeTalle: (productId: string, talle: string) => number | null;
  /** Suma de todas las variantes de un producto. null = no se sabe. */
  stockTotal: (productId: string) => number | null;
  recargar: () => void;
}

const StockContext = createContext<StockContextType | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const [mapa, setMapa] = useState<MapaDeStock>({});
  const [estado, setEstado] = useState<EstadoStock>("cargando");

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/stock", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.ok || typeof data.stock !== "object" || data.stock === null) {
        throw new Error("Respuesta inesperada");
      }
      setMapa(data.stock as MapaDeStock);
      setEstado("listo");
    } catch {
      /* Fallar cerrado: sin datos confiables, todo queda agotado */
      setMapa({});
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* El stock es compartido entre visitantes: al volver a la pestaña puede
     estar desactualizado, así que se relee. */
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === "visible") cargar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [cargar]);

  /* Lectura base: "cargando" no sabe nada; "error" es agotado; una fila
     ausente estando listo también es agotado (fallar cerrado: obliga a
     cargarla en el panel antes de venderla). */
  const stockDeClave = useCallback(
    (productId: string, key: string): number | null => {
      if (estado === "cargando") return null;
      if (estado === "error") return 0;
      return mapa[productId]?.[key] ?? 0;
    },
    [mapa, estado]
  );

  const stockDeOpciones = useCallback(
    (product: Product, opciones: Record<string, string>): number | null =>
      stockDeClave(product.id, stockKeyDesdeOpciones(product, opciones)),
    [stockDeClave]
  );

  const stockDeTalle = useCallback(
    (productId: string, talle: string): number | null =>
      stockDeClave(productId, stockKeyDeTalle(talle)),
    [stockDeClave]
  );

  const stockTotal = useCallback(
    (productId: string): number | null => {
      if (estado === "cargando") return null;
      if (estado === "error") return 0;
      const porClave = mapa[productId];
      if (!porClave) return 0;
      return Object.values(porClave).reduce((s, n) => s + n, 0);
    },
    [mapa, estado]
  );

  return (
    <StockContext.Provider
      value={{ estado, stockDeClave, stockDeOpciones, stockDeTalle, stockTotal, recargar: cargar }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock debe usarse dentro de <StockProvider>");
  return ctx;
}
