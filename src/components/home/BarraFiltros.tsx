"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";
import { CATEGORIAS } from "@/lib/products";
import { ORDENES, type CategoriaFiltro, type OrdenId } from "@/lib/filtros";
import { useFiltros } from "@/lib/filtros-context";
import { categoryIcons } from "./categories";

/* ═══════════════════════════════════════════════
   BARRA DE FILTROS — chips de categoría, precio, orden y contador

   Va sticky abajo del navbar. Todo su estado sale del contexto de
   filtros: este componente sólo dibuja controles.

   En mobile los chips scrollean en horizontal (con degradés que avisan que
   hay más) y precio/orden se pliegan detrás de un botón "Filtros", para no
   comerse media pantalla. En desktop va todo a la vista.
   ═══════════════════════════════════════════════ */

/* La barra se pega justo abajo del navbar. El alto NO va hardcodeado: lo
   publica el propio Navbar en `--alto-navbar` midiéndose, porque en mobile
   crece al desplegar el buscador. */
const TOP_STICKY = "top-[var(--alto-navbar)]";

/** "" cuando no hay tope; si no, el número. Nunca NaN ni negativos. */
function parsePrecio(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === "") return null;
  const n = Number(limpio);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export default function BarraFiltros({ onAntesDeCambiar }: { onAntesDeCambiar?: () => void }) {
  const { filtros, total, hayFiltros, setCategoria, setOrden, setPrecio, limpiar } = useFiltros();

  const chipsRef = useRef<HTMLDivElement>(null);
  const [sombras, setSombras] = useState({ izq: false, der: false });
  const [panelAbierto, setPanelAbierto] = useState(false);

  /* Los inputs se DERIVAN del contexto en vez de tener copia local: así
     "Limpiar" (o cualquier cambio de afuera) los vacía solo, sin efectos
     de sincronización que se desincronicen. */
  const minTexto = filtros.precioMin === null ? "" : String(filtros.precioMin);
  const maxTexto = filtros.precioMax === null ? "" : String(filtros.precioMax);

  const cambiarMin = (v: string) => setPrecio(parsePrecio(v), filtros.precioMax);
  const cambiarMax = (v: string) => setPrecio(filtros.precioMin, parsePrecio(v));

  /* ¿Hay algo puesto en el panel plegable? Sirve para el puntito del botón */
  const panelConFiltros =
    filtros.precioMin !== null || filtros.precioMax !== null || filtros.orden !== "catalogo";

  /* ─── Degradés de los bordes: sólo si realmente hay más para scrollear ─── */
  const medirSombras = useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    const margen = 4;
    setSombras({
      izq: el.scrollLeft > margen,
      der: el.scrollLeft + el.clientWidth < el.scrollWidth - margen,
    });
  }, []);

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    medirSombras();
    el.addEventListener("scroll", medirSombras, { passive: true });

    /* La primera medición corre antes de que se asienten las fuentes y los
       íconos, así que el ancho real de la fila puede llegar después. Sin
       esto, si el usuario nunca scrollea, el degradé no aparece nunca. */
    const observer = new ResizeObserver(medirSombras);
    observer.observe(el);
    for (const chip of Array.from(el.children)) observer.observe(chip);

    return () => {
      el.removeEventListener("scroll", medirSombras);
      observer.disconnect();
    };
  }, [medirSombras]);

  /* ─── El chip activo se trae a la vista ───
     Se mueve scrollLeft a mano en vez de usar scrollIntoView: ese también
     scrollea la PÁGINA en vertical, que es justo lo que no queremos. */
  useEffect(() => {
    const cont = chipsRef.current;
    if (!cont) return;
    const activo = cont.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!activo) return;
    const destino = activo.offsetLeft - (cont.clientWidth - activo.clientWidth) / 2;
    cont.scrollTo({ left: Math.max(0, destino), behavior: "smooth" });
  }, [filtros.categoria]);

  const elegirCategoria = (id: CategoriaFiltro) => {
    /* PRIMERO el scroll, DESPUÉS el filtro: ver el comentario de Catalogo.tsx */
    onAntesDeCambiar?.();
    setCategoria(id);
  };

  const inputPrecio =
    "h-10 w-full min-w-0 rounded-[10px] border border-[var(--line)] bg-white/[0.04] px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mut)]/70 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.18)]";

  return (
    <div
      className={`sticky ${TOP_STICKY} z-40 border-y border-[var(--line)] bg-[rgba(20,15,38,0.92)] backdrop-blur-[14px]`}
    >
      <div className="mx-auto max-w-[1240px] px-5 py-3 sm:px-7">
        {/* ─── Chips de categoría ─── */}
        <div className="relative">
          <div
            ref={chipsRef}
            role="tablist"
            aria-label="Categorías"
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIAS.map((c) => {
              const activa = filtros.categoria === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={activa}
                  onClick={() => elegirCategoria(c.id as CategoriaFiltro)}
                  className={`inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] font-bold transition ${
                    activa
                      ? "border-transparent bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-white shadow-[0_6px_16px_rgba(124,58,237,0.45)]"
                      : "border-[var(--line)] bg-white/[0.04] text-[var(--mut)] hover:border-[var(--blue-l)]/60 hover:text-[var(--ink)]"
                  }`}
                >
                  {c.id !== "todo" && (
                    <span className={`[&>svg]:h-4 [&>svg]:w-4 ${activa ? "text-white" : "text-[var(--blue-l)]"}`}>
                      {categoryIcons[c.id]}
                    </span>
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Degradés que avisan que la fila sigue. pointer-events-none para
              que no roben el click del chip que tapan a medias. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[rgba(20,15,38,0.95)] to-transparent transition-opacity duration-200 ${
              sombras.izq ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[rgba(20,15,38,0.95)] to-transparent transition-opacity duration-200 ${
              sombras.der ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* ─── Contador + botón "Filtros" (mobile) ─── */}
        <div className="mt-3 flex items-center gap-3">
          <p className="text-[13px] font-semibold text-[var(--mut)]" aria-live="polite">
            {total} {total === 1 ? "producto" : "productos"}
          </p>

          {/* Sólo en mobile: pliega precio y orden */}
          <button
            onClick={() => setPanelAbierto((v) => !v)}
            aria-expanded={panelAbierto}
            aria-controls="panel-filtros"
            className="ml-auto inline-flex items-center gap-2 rounded-[10px] border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--blue-l)]/60 sm:hidden"
          >
            <SlidersHorizontal className="h-4 w-4 text-[var(--blue-l)]" />
            Filtros
            {panelConFiltros && (
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--gold-l)]" />
            )}
            <ChevronDown
              className={`h-4 w-4 text-[var(--mut)] transition-transform ${panelAbierto ? "rotate-180" : ""}`}
            />
          </button>

          {/* Desktop: los controles van acá al lado, siempre visibles */}
          <div className="ml-auto hidden sm:block">
            <Controles
              minTexto={minTexto}
              maxTexto={maxTexto}
              cambiarMin={cambiarMin}
              cambiarMax={cambiarMax}
              orden={filtros.orden}
              setOrden={setOrden}
              hayFiltros={hayFiltros}
              limpiar={limpiar}
              inputPrecio={inputPrecio}
              sufijoId="d"
            />
          </div>
        </div>

        {/* Mobile: el mismo bloque, plegado */}
        {panelAbierto && (
          <div id="panel-filtros" className="mt-3 sm:hidden">
            <Controles
              minTexto={minTexto}
              maxTexto={maxTexto}
              cambiarMin={cambiarMin}
              cambiarMax={cambiarMax}
              orden={filtros.orden}
              setOrden={setOrden}
              hayFiltros={hayFiltros}
              limpiar={limpiar}
              inputPrecio={inputPrecio}
              sufijoId="m"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* Precio + orden + limpiar. Se renderiza dos veces (desktop inline, mobile
   plegado), así que los id llevan sufijo para no duplicarse. */
function Controles({
  minTexto,
  maxTexto,
  cambiarMin,
  cambiarMax,
  orden,
  setOrden,
  hayFiltros,
  limpiar,
  inputPrecio,
  sufijoId,
}: {
  minTexto: string;
  maxTexto: string;
  cambiarMin: (v: string) => void;
  cambiarMax: (v: string) => void;
  orden: OrdenId;
  setOrden: (v: OrdenId) => void;
  hayFiltros: boolean;
  limpiar: () => void;
  inputPrecio: string;
  sufijoId: string;
}) {
  const idMin = `precio-min-${sufijoId}`;
  const idMax = `precio-max-${sufijoId}`;
  const idOrden = `orden-${sufijoId}`;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      {/* Precio — en mobile ocupa su propio renglón: compartiendo línea con
          el orden, a 320px los inputs quedaban de 29px e inusables. */}
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <span className="hidden shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)] sm:flex">
          <SlidersHorizontal className="h-4 w-4 text-[var(--blue-l)]" />
          Precio
        </span>
        <label className="sr-only" htmlFor={idMin}>Precio mínimo</label>
        <input
          id={idMin}
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Desde"
          value={minTexto}
          onChange={(e) => cambiarMin(e.target.value)}
          className={`${inputPrecio} sm:max-w-[104px]`}
        />
        <span className="shrink-0 text-[var(--mut)]">–</span>
        <label className="sr-only" htmlFor={idMax}>Precio máximo</label>
        <input
          id={idMax}
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Hasta"
          value={maxTexto}
          onChange={(e) => cambiarMax(e.target.value)}
          className={`${inputPrecio} sm:max-w-[104px]`}
        />
      </div>

      {/* Orden — select nativo: abre el picker del sistema en mobile */}
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <label htmlFor={idOrden} className="hidden shrink-0 text-[13px] font-semibold text-[var(--ink)] sm:block">
          Ordenar
        </label>
        <select
          id={idOrden}
          value={orden}
          onChange={(e) => setOrden(e.target.value as OrdenId)}
          className="h-10 w-full min-w-0 cursor-pointer rounded-[10px] border border-[var(--line)] bg-white/[0.04] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.18)] sm:max-w-[210px]"
        >
          {ORDENES.map((o) => (
            /* El fondo explícito es para el desplegable nativo, que no
               hereda el theme oscuro */
            <option key={o.id} value={o.id} className="bg-[var(--navy-2)] text-[var(--ink)]">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {hayFiltros && (
        <button
          onClick={limpiar}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-[var(--line)] px-3 text-[13px] font-semibold text-[var(--mut)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
