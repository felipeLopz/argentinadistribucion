"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/products";
import { agruparPorCategoria, correspondeAgrupar } from "@/lib/filtros";
import { useFiltros } from "@/lib/filtros-context";
import BarraFiltros from "./BarraFiltros";
import { ProductCard } from "./ProductCard";
import CatalogoVacio from "./CatalogoVacio";
import EncabezadoGrupo from "./EncabezadoGrupo";

/* ═══════════════════════════════════════════════
   CATÁLOGO — una sola sección con barra de filtros y grilla

   Reemplaza a las 4 secciones apiladas por categoría.

   ─── Agrupada o plana ───
   En "Ver todo" la grilla va SIEMPRE agrupada: un bloque por categoría con
   su encabezado, en el orden de los chips. Es lo que hace navegable un
   catálogo mezclado, y vale igual con cualquier orden y con búsqueda
   activa (ahí sólo se muestran los bloques que tienen resultados).

   Se aplana en un solo caso: con un chip puntual, porque son todos de la
   misma categoría y no hay nada que separar.

   El orden elegido se aplica DENTRO de cada bloque — decisión tomada, ver
   la nota en `correspondeAgrupar()` (filtros.ts), que es donde vive la
   regla. No reintroducir un aplanado al ordenar o al buscar.

   ─── Sobre el "tirón" al cambiar de filtro ───
   Pasar de 19 cards a 3 acorta el documento de golpe. Si el usuario está
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
  const { filtros, resultados, tocado } = useFiltros();

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

  /* Sólo se aplana con un chip puntual; en "Ver todo" va siempre agrupado,
     con cualquier orden y con búsqueda. La regla vive en filtros.ts. */
  const agrupado = correspondeAgrupar(filtros);

  return (
    <section id="catalogo" className="font-archivo">
      <div ref={anclaRef} aria-hidden="true" />
      <BarraFiltros onAntesDeCambiar={irAlCatalogo} />

      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-7 sm:py-12">
        {resultados.length === 0 ? (
          /* Un solo estado vacío para los tres motivos (texto, precio,
             categoría) y sus combinaciones: él se diagnostica solo. */
          <CatalogoVacio />
        ) : agrupado ? (
          /* "Ver todo": un bloque por categoría, con cualquier orden. El
             fundido entre agrupado y plano evita que la vista salte de
             golpe al cambiar de chip. */
          <motion.div
            key="agrupado"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-12"
          >
            {agruparPorCategoria(resultados).map((grupo) => (
              <div key={grupo.id}>
                <EncabezadoGrupo
                  categoria={grupo.id}
                  label={grupo.label}
                  cantidad={grupo.productos.length}
                />
                <Grilla
                  productos={grupo.productos}
                  escalonar={!tocado}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="plano"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Grilla
              productos={resultados}
              escalonar={!tocado}
              onProductClick={onProductClick}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* La grilla de cards. Se usa igual en el modo plano y dentro de cada
   bloque del modo agrupado, así el markup y las animaciones no se
   duplican. */
function Grilla({
  productos,
  escalonar,
  onProductClick,
}: {
  productos: Product[];
  escalonar: boolean;
  onProductClick: (p: Product) => void;
}) {
  return (
    /* `relative` porque popLayout saca a las cards que salen del flujo y
       las posiciona absolutas respecto de este contenedor. */
    <div className="relative flex flex-wrap justify-center gap-[22px]">
      {/* popLayout: la card que sale deja de ocupar lugar YA (así el alto se
          ajusta en el mismo commit que corrige el scroll) y se desvanece
          por encima, en vez de cortarse de golpe. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {productos.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            /* Sólo la carga inicial se escalona: una vez que el usuario
               filtra, las cards entran todas juntas. */
            escalonar={escalonar}
            onOpen={() => onProductClick(product)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
