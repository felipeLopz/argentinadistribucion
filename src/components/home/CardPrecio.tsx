"use client";

import { Ban, Timer } from "lucide-react";
import type { Product } from "@/lib/products";
import type { EstadoStock } from "@/lib/stock-context";
import type { PromoResuelta } from "@/lib/promos";

/* ═══════════════════════════════════════════════
   CARD PRECIO — bloque de precio + disponibilidad de la tarjeta

   Único lugar donde la card habla de plata y de stock.

   No decide nada de promoción: recibe `promo` ya resuelta (ver promos.ts).
   Por eso el día que los badges y las ofertas se editen desde el panel,
   este archivo no se toca.
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
  promo,
}: {
  product: Product;
  /** false = producto siempre disponible: no se consulta la base. */
  conStock: boolean;
  agotado: boolean;
  /** Stock sumado de todas las variantes. null = todavía no se sabe. */
  total: number | null;
  estadoStock: EstadoStock;
  promo: PromoResuelta;
}) {
  /* Agotado apaga la oferta, igual que apaga el badge: mostrar
     "Ahorrás $7.000" en lila brillante justo al lado de "Agotado" se
     contradice, y el precio ya se ve tachado por estar sin stock. */
  const oferta = agotado ? null : promo.oferta;
  const { urgencia } = promo;

  return (
    <div className="mt-auto flex flex-col items-center gap-2">
      {/* Precio anterior tachado, sólo cuando hay oferta válida */}
      {oferta && (
        <span className="text-[13px] font-semibold text-[var(--mut)] line-through">
          ${oferta.anterior.toLocaleString("es-AR")}
        </span>
      )}

      {/* Precio */}
      <span className={`${PRICE_PILL}${agotado ? " opacity-50 line-through" : ""}`}>
        ${product.price!.toLocaleString("es-AR")}
      </span>

      {/* Cuánto se ahorra, en pesos y en porcentaje */}
      {oferta && (
        <span className="rounded-[7px] bg-[rgba(167,139,250,0.14)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--gold-l)]">
          Ahorrás ${oferta.ahorro.toLocaleString("es-AR")} ({oferta.porcentaje}%)
        </span>
      )}

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
      ) : urgencia !== null ? (
        /* Variante urgente del renglón de siempre. `urgencia` ya viene
           filtrada por categoría: en los vapers es null y cae al neutro. */
        <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-[#ff6b8a]">
          <Timer className="h-3.5 w-3.5" />
          ¡Últimas {urgencia} {urgencia === 1 ? "unidad" : "unidades"}!
        </span>
      ) : total !== null ? (
        <span className="text-[12px] font-semibold text-[var(--mut)]">Quedan {total}</span>
      ) : null}
    </div>
  );
}
