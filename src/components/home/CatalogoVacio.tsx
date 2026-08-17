"use client";

import { motion } from "framer-motion";
import { SearchX, Tag, LayoutGrid, PackageSearch, RotateCcw } from "lucide-react";
import { CATEGORIAS, products } from "@/lib/products";
import { diagnosticarVacio } from "@/lib/filtros";
import { useFiltros } from "@/lib/filtros-context";

/* ═══════════════════════════════════════════════
   CATÁLOGO VACÍO — único estado vacío de la grilla

   Reemplaza al viejo SearchEmptyState, que sólo sabía de búsquedas.
   Cubre los tres motivos por los que la vista puede quedar sin productos
   —texto buscado, rango de precio, categoría— y también la combinación
   de varios, diciendo en cada caso qué conviene aflojar.
   ═══════════════════════════════════════════════ */

/* Tope visual del término mostrado: una búsqueda larguísima no debe
   romper el layout de la tarjeta. */
const MAX_LARGO = 48;

export default function CatalogoVacio() {
  const { filtros, hayFiltros, limpiar, setBusqueda, setCategoria, setPrecio } = useFiltros();
  const { culpable, siSeQuita } = diagnosticarVacio(products, filtros);

  const termino =
    filtros.busqueda.trim().length > MAX_LARGO
      ? `${filtros.busqueda.trim().slice(0, MAX_LARGO)}…`
      : filtros.busqueda.trim();

  const categoriaLabel =
    CATEGORIAS.find((c) => c.id === filtros.categoria)?.label ?? filtros.categoria;

  /* El término va SIEMPRE como texto dentro de JSX: React lo escapa, así
     que no se interpreta como HTML. */
  const comillas = <span className="break-words text-[var(--gold)]">&ldquo;{termino}&rdquo;</span>;

  /* Cada motivo trae su ícono, su mensaje y un atajo que arregla ESE
     filtro, sin tocar los otros. */
  const caso = (() => {
    switch (culpable) {
      case "precio":
        return {
          icono: <Tag className="h-7 w-7" />,
          titulo: <>Ningún producto entra en ese rango de precio</>,
          detalle: (
            <>
              Sin el filtro de precio {siSeQuita === 1 ? "queda" : "quedan"}{" "}
              <strong className="text-[var(--ink)]">{siSeQuita}</strong>{" "}
              {siSeQuita === 1 ? "producto" : "productos"}.
            </>
          ),
          atajo: { texto: "Quitar el rango de precio", accion: () => setPrecio(null, null) },
        };

      case "categoria":
        return {
          icono: <LayoutGrid className="h-7 w-7" />,
          titulo: termino ? (
            <>No encontramos {comillas} en {categoriaLabel}</>
          ) : (
            <>No hay productos en {categoriaLabel}</>
          ),
          detalle: (
            <>
              En el resto del catálogo {siSeQuita === 1 ? "hay" : "hay"}{" "}
              <strong className="text-[var(--ink)]">{siSeQuita}</strong>{" "}
              {siSeQuita === 1 ? "producto" : "productos"}.
            </>
          ),
          atajo: { texto: "Buscar en todo el catálogo", accion: () => setCategoria("todo") },
        };

      case "busqueda":
        return {
          icono: <SearchX className="h-7 w-7" />,
          titulo: <>No encontramos resultados para {comillas}</>,
          detalle: <>Probá con otro término, o mirá el catálogo completo.</>,
          atajo: { texto: "Limpiar la búsqueda", accion: () => setBusqueda("") },
        };

      /* Ningún filtro alcanza por sí solo: es la combinación de varios */
      default:
        return {
          icono: <PackageSearch className="h-7 w-7" />,
          titulo: <>No hay productos con estos filtros</>,
          detalle: <>Ninguna combinación de los filtros activos devuelve resultados.</>,
          atajo: null,
        };
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-[560px] rounded-[20px] border border-dashed border-[var(--line)] bg-[rgba(28,20,54,0.3)] px-5 py-[70px] text-center"
    >
      <div className="mx-auto mb-[18px] grid h-16 w-16 place-items-center rounded-full bg-white/5 text-[var(--mut)]">
        {caso.icono}
      </div>

      <h2 className="text-[20px] font-extrabold leading-snug tracking-[-0.02em] text-white">
        {caso.titulo}
      </h2>

      <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-[1.6] text-[var(--mut)]">
        {caso.detalle}
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {/* Atajo puntual: arregla sólo el filtro que dejó la vista vacía */}
        {caso.atajo && (
          <button
            onClick={caso.atajo.accion}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[13px] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-[26px] py-[13px] text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition duration-300 hover:-translate-y-[2px] hover:brightness-110"
          >
            {caso.atajo.texto}
          </button>
        )}

        {/* Salida completa, siempre disponible mientras haya algo puesto */}
        {hayFiltros && (
          <button
            onClick={limpiar}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[13px] px-[26px] py-[13px] text-[14px] font-bold transition duration-300 ${
              caso.atajo
                ? "border border-[var(--line)] text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                : "bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] hover:-translate-y-[2px] hover:brightness-110"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar filtros
          </button>
        )}
      </div>
    </motion.div>
  );
}
