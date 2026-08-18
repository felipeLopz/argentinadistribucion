"use client";

import { categoryIcons } from "./categories";

/* ═══════════════════════════════════════════════
   ENCABEZADO DE GRUPO — el título arriba de cada bloque de categoría

   Sólo se usa en "Ver todo", donde la grilla va agrupada. Reusa el estilo
   del encabezado de sección que tenía el catálogo antes de los filtros
   (recuadro con el ícono + título + contador + hairline), en una escala
   más chica: antes encabezaba una sección entera de la página, ahora
   separa bloques dentro de una sola.
   ═══════════════════════════════════════════════ */
export default function EncabezadoGrupo({
  categoria,
  label,
  cantidad,
}: {
  categoria: string;
  label: string;
  cantidad: number;
}) {
  return (
    <div className="mb-6 flex items-center gap-3.5">
      <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-[var(--line)] bg-[rgba(139,92,246,0.14)] text-[var(--blue-l)] [&>svg]:h-5 [&>svg]:w-5">
        {categoryIcons[categoria]}
      </div>
      <div className="min-w-0">
        <h2 className="text-[clamp(20px,2.4vw,28px)] font-extrabold leading-tight tracking-[-0.03em] text-white">
          {label}
        </h2>
        <p className="mt-0.5 text-[12.5px] font-medium text-[var(--mut)]">
          {cantidad} producto{cantidad !== 1 && "s"}
        </p>
      </div>
      {/* Hairline que completa el ancho, como en el diseño original */}
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--line)] to-transparent" />
    </div>
  );
}
