"use client";

import { Fish, Instagram, MessageCircle, Mail, MapPin, Truck, Heart } from "lucide-react";
import { CATEGORIAS, navSections, storeName, contactConfig } from "@/lib/products";
import { useFiltros } from "@/lib/filtros-context";
import type { CategoriaFiltro } from "@/lib/filtros";

/* ═══════════════════════════════════════════════
   FOOTER — Diseño "Estadio Nocturno"
   ═══════════════════════════════════════════════ */
export default function Footer() {
  const { setCategoria } = useFiltros();

  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* Los links de categoría del footer activan el chip correspondiente y
     llevan al catálogo: las secciones por categoría ya no existen. */
  const irACategoria = (id: CategoriaFiltro) => {
    setCategoria(id);
    irASeccion("catalogo");
  };

  return (
    <footer className="font-archivo bg-gradient-to-b from-transparent to-[rgba(124,58,237,0.08)] text-[var(--mut)]">
      {/* Hairline dorado superior */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />

      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-7">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)]">
                <Fish className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">{storeName}</span>
            </div>
            <p className="max-w-[280px] text-sm leading-relaxed text-[var(--mut)]">
              Tu tienda de confianza en vapers, termos Stanley y accesorios Apple.
            </p>
            {/* Redes sociales */}
            <div className="mt-5 flex items-center gap-3">
              {contactConfig.instagrams.map((ig) => (
                <a
                  key={ig.user}
                  href={ig.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-white/[0.06] text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  aria-label={`Instagram @${ig.user}`}
                  title={`@${ig.user}`}
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">Secciones</h4>
            <ul className="space-y-2.5 text-sm">
              {/* Inicio */}
              <li>
                <button
                  onClick={() => irASeccion(navSections[0].id)}
                  className="text-[var(--mut)] transition-colors hover:text-[var(--ink)]"
                >
                  {navSections[0].label}
                </button>
              </li>

              {/* Categorías: activan el chip, no scrollean a una sección */}
              {CATEGORIAS.filter((c) => c.id !== "todo").map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => irACategoria(c.id as CategoriaFiltro)}
                    className="text-[var(--mut)] transition-colors hover:text-[var(--ink)]"
                  >
                    {c.label}
                  </button>
                </li>
              ))}

              {/* Contacto */}
              <li>
                <button
                  onClick={() => irASeccion(navSections[1].id)}
                  className="text-[var(--mut)] transition-colors hover:text-[var(--ink)]"
                >
                  {navSections[1].label}
                </button>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">Contacto</h4>
            <ul className="space-y-3 text-sm text-[var(--mut)]">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-[#37c46f]" />
                <a href={contactConfig.whatsappLink} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink)]">
                  {contactConfig.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[var(--blue-l)]" />
                <a href={contactConfig.emailLink} className="transition-colors hover:text-[var(--ink)]">
                  {contactConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                {contactConfig.location}
              </li>
            </ul>
          </div>

          {/* Envíos */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">Envíos</h4>
            <div className="flex items-start gap-2 text-sm text-[var(--mut)]">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
              <p>{contactConfig.shippingNote}</p>
            </div>
            <p className="mt-4 text-xs text-[var(--mut)]/70">
              Tiempos de entrega estimados al consultar por WhatsApp o Email.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-6 text-sm text-[var(--mut)] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <p>Hecho con <Heart className="inline h-3.5 w-3.5 text-red-400" /> en Argentina</p>
        </div>
      </div>
    </footer>
  );
}
