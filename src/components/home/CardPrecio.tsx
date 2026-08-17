"use client";

import { Ban } from "lucide-react";
import type { Product } from "@/lib/products";
import type { EstadoStock } from "@/lib/stock-context";

/* ═══════════════════════════════════════════════
   CARD PRECIO — bloque de precio + disponibilidad de la tarjeta

   Se extrajo de ProductCard para tener UN solo lugar donde vive todo lo
   que la card dice sobre plata y stock. Es el punto de entrada de las
   mejoras de marketing que vienen después:

     · badges (NUEVO / OFERTA / MÁS VENDIDO) → van sobre la imagen, que ya
       es `relative` en ProductCard;
     · precio tachado + % de ahorro → un `precioAnterior` en Product y dos
       renglones acá, alrededor de la pill;
     · "¡Últimas N unidades!" → es una variante del renglón "Quedan N" de
       más abajo: una constante de umbral y cambia el texto y el color.

   Nada de eso está implementado todavía: esto es sólo la estructura.
   ═══════════════════════════════════════════════ */

/* Pill de precio (azul), ajustado a su contenido. */
const PRICE_PILL =
  "inline-flex w-fit items-center whitespace-nowrap rounded-[11px] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-4 py-2 text-[22px] font-extrabold leading-none text-white shadow-[0_6px_16px_rgba(124,58,237,0.5)]";

export default function CardPrecio({
  product,
  conStock,
  agotado,
  total,
  estadoStock,
}: {
  product: Product;
  /** false = producto siempre disponible: no se consulta la base. */
  conStock: boolean;
  agotado: boolean;
  /** Stock sumado de todas las variantes. null = todavía no se sabe. */
  total: number | null;
  estadoStock: EstadoStock;
}) {
  return (
    <div className="mt-auto flex flex-col items-center gap-2">
      {/* Precio */}
      <span className={`${PRICE_PILL}${agotado ? " opacity-50 line-through" : ""}`}>
        ${product.price!.toLocaleString("es-AR")}
      </span>

      {/* Disponibilidad. Mientras carga no decimos "Agotado" (sería falso):
          se avisa que se está consultando. Los productos sin stock
          muestran, en su lugar, de qué va la promo. */}
      {!conStock ? (
        product.packPrecios ? (
          <span className="text-[12px] font-semibold text-[var(--gold)]">
            Promo por cantidad · hasta {product.packPrecios.length}
          </span>
        ) : null
      ) : estadoStock === "cargando" ? (
        <span className="animate-pulse text-[12px] font-semibold text-[var(--mut)]/70">
          Verificando stock…
        </span>
      ) : agotado ? (
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-red-400">
          <Ban className="h-3.5 w-3.5" />
          Agotado
        </span>
      ) : total !== null ? (
        <span className="text-[12px] font-semibold text-[var(--mut)]">Quedan {total}</span>
      ) : null}
    </div>
  );
}
