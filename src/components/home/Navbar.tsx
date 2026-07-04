"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ShoppingCart, Menu, Trophy } from "lucide-react";
import { navSections, storeName } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

/* ═══════════════════════════════════════════════
   NAVBAR — Diseño "Estadio Nocturno"
   Barra oscura translúcida, buscador con foco dorado,
   links con subrayado dorado y carrito dorado con badge azul.
   ═══════════════════════════════════════════════ */
export default function Navbar({ searchQuery, onSearchChange, onCartToggle }: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCartToggle: () => void;
}) {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Cerrar menú móvil al hacer clic en un enlace */
  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="font-archivo sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[rgba(5,12,46,0.82)] backdrop-blur-[14px]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7">
        <div className="flex h-[74px] items-center gap-6">
          {/* Logo */}
          <button
            onClick={() => handleNavClick("inicio")}
            className="flex items-center gap-[11px] shrink-0"
          >
            <span className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_22px_rgba(11,62,204,0.5)]">
              <Trophy className="h-[19px] w-[19px]" />
            </span>
            <span className="hidden flex-col text-left leading-none sm:flex">
              <span className="text-[15px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
                {storeName}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                Figuritas &amp; Merchandising
              </span>
            </span>
          </button>

          {/* Buscador — Desktop */}
          <div className="relative hidden max-w-[340px] flex-1 md:block">
            <Search className="pointer-events-none absolute left-[13px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mut)]" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-[42px] w-full rounded-[12px] border border-[var(--line)] bg-white/[0.04] pl-10 pr-9 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mut)] focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(232,183,58,0.18)]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mut)] transition-colors hover:text-[var(--ink)]"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Bloque derecho: links + acciones */}
          <div className="ml-auto flex items-center gap-6">
            {/* Navegación desktop */}
            <nav className="hidden items-center gap-[22px] text-[13.5px] font-medium text-[var(--mut)] lg:flex">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className="nav-underline relative whitespace-nowrap py-1 transition-colors hover:text-[var(--ink)]"
                >
                  {section.label}
                </button>
              ))}
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              {/* Búsqueda mobile */}
              <button
                className="grid h-11 w-11 place-items-center rounded-[12px] border border-[var(--line)] bg-white/[0.04] text-[var(--ink)] transition-colors hover:bg-white/10 md:hidden"
                onClick={() => {
                  const searchMobile = document.getElementById("search-mobile");
                  if (searchMobile) {
                    const isHidden = searchMobile.classList.contains("hidden");
                    searchMobile.classList.toggle("hidden");
                    if (isHidden) searchMobile.querySelector("input")?.focus();
                  }
                }}
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Carrito — dorado con badge azul */}
              <motion.button
                onClick={onCartToggle}
                whileTap={{ scale: 0.9 }}
                className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-[var(--gold)] to-[var(--gold-l)] text-[#3a2c00] shadow-[0_8px_22px_rgba(232,183,58,0.35)] transition-transform hover:-translate-y-0.5"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-5 w-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--blue-l)] px-1 text-[11px] font-bold text-white"
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Menú hamburguesa — Mobile */}
              <button
                className="grid h-11 w-11 place-items-center rounded-[12px] border border-[var(--line)] bg-white/[0.04] text-[var(--ink)] transition-colors hover:bg-white/10 lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menú"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Buscador mobile (colapsable) */}
        <div id="search-mobile" className="hidden pb-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-[13px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mut)]" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-[42px] w-full rounded-[12px] border border-[var(--line)] bg-white/[0.04] pl-10 pr-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mut)] focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(232,183,58,0.18)]"
            />
          </div>
        </div>
      </div>

      {/* Menú desplegable mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-[var(--line)] bg-[rgba(5,12,46,0.95)] lg:hidden"
          >
            <div className="space-y-1 px-4 py-2">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-[var(--mut)] transition-colors hover:bg-white/5 hover:text-[var(--ink)]"
                >
                  {section.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
