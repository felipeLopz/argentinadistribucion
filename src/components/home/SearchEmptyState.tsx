"use client";

import { motion } from "framer-motion";
import { SearchX, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════
   ESTADO VACÍO DE BÚSQUEDA
   Se muestra sólo cuando hay una búsqueda activa y NINGUNA categoría
   devolvió resultados (cada sección se oculta sola, así que sin esto la
   página quedaría en blanco entre el Hero y Contacto).
   ═══════════════════════════════════════════════ */

/* Tope visual del término mostrado: una búsqueda larguísima no debe
   romper el layout de la tarjeta. */
const MAX_LARGO = 48;

export default function SearchEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  const termino = query.length > MAX_LARGO ? `${query.slice(0, MAX_LARGO)}…` : query;

  return (
    <section className="font-archivo py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[560px] rounded-[20px] border border-dashed border-[var(--line)] bg-[rgba(10,18,55,0.3)] px-5 py-[70px] text-center"
        >
          <div className="mx-auto mb-[18px] grid h-16 w-16 place-items-center rounded-full bg-white/5 text-[var(--mut)]">
            <SearchX className="h-7 w-7" />
          </div>

          {/* El término va como texto: React lo escapa, no se interpreta como HTML */}
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-white">
            No encontramos resultados para{" "}
            <span className="break-words text-[var(--gold)]">&ldquo;{termino}&rdquo;</span>
          </h2>

          <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-[1.6] text-[var(--mut)]">
            Probá con otro término o revisá las categorías disponibles.
          </p>

          <button
            onClick={onClear}
            className="mt-6 inline-flex items-center gap-2 rounded-[13px] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-[26px] py-[13px] text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(11,62,204,0.35)] transition duration-300 hover:-translate-y-[2px] hover:brightness-110"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar búsqueda
          </button>
        </motion.div>
      </div>
    </section>
  );
}
