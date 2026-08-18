"use client";

import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/products";
import { useFiltros } from "@/lib/filtros-context";
import BarraFiltros from "./BarraFiltros";
import { ProductCard } from "./ProductCard";
import CatalogoVacio from "./CatalogoVacio";

/* ═══════════════════════════════════════════════
   CATÁLOGO — una sola sección con barra de filtros y grilla plana

   Reemplaza a las 4 secciones apiladas por categoría. La grilla es plana
   a propósito: si estuviera agrupada por categoría, ordenar por precio
   sólo ordenaría dentro de cada grupo y dejaría de significar algo. La
   categoría la comunica el chip activo.

   ─── Sobre el "tirón" al cambiar de filtro ───
   Pasar de 18 cards a 3 acorta el documento de golpe. Si el usuario está
   scrolleado abajo, el navegador CLAMPEA su scroll al nuevo máximo, y eso
   se siente como un golpe seco. La primera versión encima lanzaba un
   scroll suave ANTES de que React re-renderizara, así que la animación y
   el clampeo peleaban.

   Se arregla con el ORDEN de las operaciones: el scroll va PRIMERO, y
   recién después cambia el filtro.

     1. Al tocar un chip se reposiciona al inicio de la grilla —
        instantáneo, sin animación— con el contenido viejo todavía puesto.
     2. Esa posición está cerca del tope del documento, así que sigue
        siendo válida por corto que quede el catálogo: cuando el contenido
        se achica, no hay nada que clampear y el tirón desaparece.
     3. Recién ahí cambia el filtro y el contenido se renueva debajo.

   Por qué NO se corrige después (en un useLayoutEffect): las cards que
   salen se van con animación, así que la altura no colapsa en el mismo
   commit sino un frame más tarde. Corregir antes evita esa carrera.

   ⚠️ El reposicionamiento va en las DOS direcciones. Restringirlo a
   "sólo si el usuario está por debajo" rompe mobile: ahí el hero mide más
   que la pantalla, así que el chip se toca cuando recién asoma al pie —
   con el usuario ARRIBA del catálogo— y entonces no se scrolleaba nada y
   las cards quedaban fuera de la vista.

   En desktop eso también cambió la conducta (antes, tocando un chip desde
   arriba no pasaba nada). Se dejó igual a propósito, decisión tomada: en
   los dos tamaños, tocar una categoría baja al catálogo.
   ═══════════════════════════════════════════════ */

/** Alto real del navbar, que el propio Navbar publica midiéndose (en mobile
 *  crece al desplegar el buscador). Se descuenta al reposicionar, así la
 *  barra de filtros queda visible en vez de tapada. */
function altoNavbar(): number {
  const valor = getComputedStyle(document.documentElement).getPropertyValue("--alto-navbar");
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 75;
}

export default function Catalogo({ onProductClick }: { onProductClick: (p: Product) => void }) {
  const { resultados, tocado } = useFiltros();

  /* Ancla de altura cero JUSTO antes de la barra. Se mide sobre esto y no
     sobre la barra misma porque la barra es sticky: una vez pegada, su
     posición en pantalla ya no dice dónde empieza el catálogo. */
  const anclaRef = useRef<HTMLDivElement>(null);

  /**
   * Lleva el inicio de la grilla justo abajo del navbar.
   * Se llama ANTES de cambiar el filtro: con el contenido todavía viejo,
   * la posición de destino existe seguro y no hay clampeo posible.
   *
   * Reposiciona en las DOS direcciones. Al principio sólo lo hacía cuando
   * el usuario estaba POR DEBAJO del catálogo, y eso rompía el caso más
   * común de mobile: el hero mide más que la pantalla, así que se toca un
   * chip cuando recién asoma al pie: ahí el usuario está ARRIBA del
   * catálogo, no se scrolleaba nada, y las cards quedaban abajo de todo.
   */
  const irAlCatalogo = () => {
    const ancla = anclaRef.current;
    if (!ancla) return;
    const y = Math.max(0, ancla.getBoundingClientRect().top + window.scrollY - altoNavbar());
    /* La tolerancia evita un salto imperceptible cuando ya está en su lugar */
    if (Math.abs(window.scrollY - y) > 2) {
      /* Instantáneo, nunca suave: una animación de scroll compitiendo con
         el cambio de altura es exactamente el "tirón" que se arregló. */
      window.scrollTo({ top: y, behavior: "instant" });
    }
  };

  return (
    <section id="catalogo" className="font-archivo">
      <div ref={anclaRef} aria-hidden="true" />
      <BarraFiltros onAntesDeCambiar={irAlCatalogo} />

      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-7 sm:py-12">
        {resultados.length === 0 ? (
          /* Un solo estado vacío para los tres motivos (texto, precio,
             categoría) y sus combinaciones: él se diagnostica solo. */
          <CatalogoVacio />
        ) : (
          /* `relative` porque popLayout saca a las cards que salen del flujo
             y las posiciona absolutas respecto de este contenedor. */
          <div className="relative flex flex-wrap justify-center gap-[22px]">
            {/* popLayout: la card que sale deja de ocupar lugar YA (así el
                alto se ajusta en el mismo commit que corrige el scroll) y
                se desvanece por encima, en vez de cortarse de golpe. */}
            <AnimatePresence mode="popLayout" initial={false}>
              {resultados.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  /* Sólo la carga inicial se escalona: una vez que el
                     usuario filtra, las cards entran todas juntas. */
                  escalonar={!tocado}
                  onOpen={() => onProductClick(product)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
