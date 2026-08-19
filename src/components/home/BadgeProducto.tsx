import { Flame, Sparkles, TrendingUp } from "lucide-react";
import type { BadgeVisual } from "@/lib/promos";

/* ═══════════════════════════════════════════════
   BADGE DE PRODUCTO — la pastilla de promoción

   Es sólo la pastilla, SIN posicionamiento: lo ubica quien lo usa. La card
   lo cuelga absoluto sobre la foto; el modal lo pone en flujo al lado del
   badge de categoría. Así el mismo componente sirve en los dos lados.

   Qué badge mostrar NO se decide acá: llega resuelto desde promos.ts.
   ═══════════════════════════════════════════════ */

/* Los tres tonos van en el MISMO cian (--promo), con texto oscuro: el
   blanco da 2.37:1 sobre el cian y no pasa contraste.

   Que los tres compartan color es a propósito. El cian es el único color
   de la paleta y sólo se usa en promociones; si cada badge tuviera el
   suyo, el cian dejaría de leerse como "esto es una promo". Se distinguen
   por ÍCONO y por TEXTO, no por color.

   El social queda en versión sutil (contorno y fondo oscuro) porque es el
   menos accionable de los tres. */
const TONOS = {
  oferta: "bg-[var(--promo)] text-[var(--promo-ink)]",
  nuevo: "bg-[var(--promo)] text-[var(--promo-ink)]",
  social: "border border-[var(--promo)]/50 bg-[rgba(28,28,30,0.85)] text-[var(--promo)] backdrop-blur-[6px]",
} as const;

const ICONOS = {
  oferta: <Flame className="h-3 w-3" />,
  nuevo: <Sparkles className="h-3 w-3" />,
  social: <TrendingUp className="h-3 w-3" />,
} as const;

export default function BadgeProducto({ badge }: { badge: BadgeVisual }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-[7px] px-2.5 py-[5px] text-[10px] font-bold uppercase leading-none tracking-[0.06em] shadow-[0_4px_12px_rgba(0,0,0,0.35)] ${TONOS[badge.tono]}`}
    >
      {ICONOS[badge.tono]}
      <span className="truncate">{badge.label}</span>
    </span>
  );
}
