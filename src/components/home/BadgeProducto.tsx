import { Flame, Sparkles, TrendingUp } from "lucide-react";
import type { BadgeVisual } from "@/lib/promos";

/* ═══════════════════════════════════════════════
   BADGE DE PRODUCTO — la pastilla de promoción

   Es sólo la pastilla, SIN posicionamiento: lo ubica quien lo usa. La card
   lo cuelga absoluto sobre la foto; el modal lo pone en flujo al lado del
   badge de categoría. Así el mismo componente sirve en los dos lados.

   Qué badge mostrar NO se decide acá: llega resuelto desde promos.ts.
   ═══════════════════════════════════════════════ */

const TONOS = {
  /* Lila → rosa con texto oscuro: el blanco no pasa contraste sobre estos
     acentos (ver la nota de la paleta en CLAUDE.md). */
  oferta: "bg-gradient-to-br from-[var(--gold)] to-[var(--gold-l)] text-[#140f26]",
  nuevo: "bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-white",
  social: "border border-[var(--line)] bg-[rgba(20,15,38,0.85)] text-[var(--gold-l)] backdrop-blur-[6px]",
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
