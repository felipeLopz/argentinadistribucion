"use client";

import type { Product } from "@/lib/products";
import { resolverPromo, type DatosPromo, type PromoResuelta } from "@/lib/promos";

/* ═══════════════════════════════════════════════
   USE PROMOCIÓN — de dónde salen los datos promocionales

   ⚠️ ESTE ES EL ÚNICO ARCHIVO A CAMBIAR para que los badges y las ofertas
   se editen desde el panel de admin en vez de a mano.

   Hoy los datos salen del catálogo (`products.ts`). Para moverlos a la
   base, el cambio es acá y en ningún otro lado:

     1. crear la tabla (`promos`: product_id, badges, precio_anterior) y su
        endpoint público de solo lectura, igual que `/api/stock`;
     2. un `PromoProvider` que la lea desde el navegador, calcado de
        `StockProvider`;
     3. en este archivo, reemplazar `datosDelCatalogo(product)` por
        `usePromoContext().datosDe(product.id)`.

   Los componentes (`BadgeProducto`, `CardPrecio`, `ProductModal`) consumen
   `PromoResuelta` y no saben de dónde vino: no se tocan.

   Los campos de `products.ts` pueden quedar como fallback (catálogo si la
   base no tiene fila) o eliminarse; eso se decide en ese momento.
   ═══════════════════════════════════════════════ */

/** Fuente actual: el propio catálogo. */
function datosDelCatalogo(product: Product): DatosPromo {
  return {
    badges: product.badges,
    precioAnterior: product.precioAnterior,
  };
}

const SIN_PROMO: PromoResuelta = { badge: null, oferta: null, urgencia: null };

/**
 * Qué mostrar de promoción para un producto.
 *
 * Acepta `null` para que el modal —que puede no tener producto abierto—
 * lo llame siempre en el mismo orden, sin condicionales.
 *
 * @param stockTotal Suma del stock de todas las variantes; `null` si no se
 *                   sabe todavía o el producto no lleva stock.
 */
export function usePromocion(product: Product | null, stockTotal: number | null): PromoResuelta {
  if (!product) return SIN_PROMO;
  return resolverPromo(product, datosDelCatalogo(product), stockTotal);
}
