"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ArrowRight,
  MessageCircle,
  ShoppingCart,
  Mail,
  MapPin,
  Truck,
  ChevronUp,
  Star,
  Trophy,
  Menu,
  Package,
  BookOpen,
  Shirt,
  Watch,
  Smartphone,
  Send,
  Heart,
  Clock,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { products, navSections, contactConfig, storeName, storeTagline, IMG_PACKS, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

/* ═══════════════════════════════════════════════
   COLORES DEL TEMA — Mundial: Blanco, Azul, Dorado
   ═══════════════════════════════════════════════ */
const THEME = {
  blue: "#0033A0",
  blueLight: "#0046D6",
  blueDark: "#002376",
  gold: "#D4AF37",
  goldLight: "#F5D775",
  goldDark: "#B8960C",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray800: "#1F2937",
  gray900: "#111827",
} as const;

/* ═══════════════════════════════════════════════
   ICONOS POR CATEGORÍA
   ═══════════════════════════════════════════════ */
const categoryIcons: Record<string, React.ReactNode> = {
  paquetes: <Package className="h-6 w-6" />,
  albumes: <BookOpen className="h-6 w-6" />,
  indumentaria: <Shirt className="h-6 w-6" />,
  accesorios: <Watch className="h-6 w-6" />,
  "accesorios-apple": <Smartphone className="h-6 w-6" />,
};

const categoryTitles: Record<string, string> = {
  paquetes: "Paquetes de Figuritas",
  albumes: "Álbumes",
  indumentaria: "Indumentaria",
  accesorios: "Accesorios",
  "accesorios-apple": "Accesorios Apple",
};

/* ═══════════════════════════════════════════════
   SCROLL-TO-TOP BUTTON
   ═══════════════════════════════════════════════ */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-5 z-40 h-11 w-11 rounded-full bg-[#0033A0] text-white shadow-lg hover:bg-[#0046D6] transition-colors flex items-center justify-center md:bottom-6 md:right-6"
          aria-label="Volver arriba"
        >
          <ChevronUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════
   NAVBAR — Fija con búsqueda y carrito
   ═══════════════════════════════════════════════ */
function Navbar({ searchQuery, onSearchChange, onCartToggle }: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCartToggle: () => void;
}) {
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Efecto para navbar al hacer scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Cerrar menú móvil al hacer clic en un enlace */
  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/97 backdrop-blur-lg shadow-lg border-b border-gray-100"
          : "bg-white shadow-sm"
      }`}
    >
      {/* Barra superior dorada */}
      <div className="h-1 bg-gradient-to-r from-[#0033A0] via-[#D4AF37] to-[#0033A0]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => handleNavClick("inicio")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0033A0]">
              <Trophy className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-extrabold text-[#0033A0] leading-tight">
                {storeName}
              </span>
              <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">
                Figuritas & Merchandising
              </span>
            </div>
          </button>

          {/* Barra de búsqueda — Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0033A0]/20 focus:border-[#0033A0] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Botones del header */}
          <div className="flex items-center gap-2">
            {/* Búsqueda mobile */}
            <button
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
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
              <Search className="h-5 w-5 text-[#0033A0]" />
            </button>

            {/* Carrito — estilo unificado (círculo azul + badge dorado) */}
            <motion.button
              onClick={onCartToggle}
              whileTap={{ scale: 0.9 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#0033A0] text-white shadow-md shadow-[#0033A0]/20 hover:shadow-lg hover:shadow-[#0033A0]/30 transition-shadow"
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
                    className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-extrabold text-white px-1 shadow-sm"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Menú hamburguesa — Mobile */}
            <button
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-[#0033A0]" /> : <Menu className="h-5 w-5 text-[#0033A0]" />}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda mobile */}
        <div id="search-mobile" className="hidden md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0033A0]/20 focus:border-[#0033A0] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Navegación desktop */}
      <nav className="hidden lg:block border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-1 h-11">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNavClick(section.id)}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-[#0033A0] rounded-md hover:bg-[#0033A0]/5 transition-all whitespace-nowrap"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menú desplegable mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden overflow-hidden border-t border-gray-100 bg-white"
          >
            <div className="py-2 px-4 space-y-1">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#0033A0] hover:bg-[#0033A0]/5 rounded-lg transition-all"
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

/* ═══════════════════════════════════════════════
   HERO — Banner principal del Mundial
   ═══════════════════════════════════════════════ */
function HeroBanner() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-gradient-to-br from-[#0033A0] via-[#002376] to-[#001A5C]">
      {/* Decoraciones de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-white/5" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute top-20 right-20 w-40 h-40 rounded-full bg-[#D4AF37]/8 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:py-36">
        <div className="text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <Badge className="mb-5 bg-[#D4AF37] text-[#0033A0] border-none px-4 py-1.5 text-sm font-bold shadow-lg">
              <Trophy className="mr-1.5 h-4 w-4" />
              Copa del Mundo
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.03 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight"
          >
            Figuritas del Mundial
            <br />
            <span className="text-[#D4AF37]">&amp; Merchandising Argentina</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.06 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed"
          >
            Tu tienda de confianza para figuritas, álbumes y toda la
            merchandising oficial de la Selección Argentina. Envíos a todo el país.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.09 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#paquetes"
              className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-[#0033A0] shadow-lg hover:bg-[#F5D775] transition-all hover:scale-105 active:scale-95"
            >
              <Package className="h-4 w-4" />
              Ver Productos
            </a>
            <a
              href={contactConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </motion.div>

          {/* Badges de confianza */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.12 }}
            className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto"
          >
            {[
              { icon: Truck, label: "Envíos a toda Argentina" },
              { icon: Star, label: "Productos oficiales" },
              { icon: MessageCircle, label: "Atención personalizada" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2 text-white/70 text-sm">
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Separador onda */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60V20C240 0 480 0 720 20C960 40 1200 40 1440 20V60H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   ADD-TO-CART BUTTON (con feedback visual)
   ═══════════════════════════════════════════════ */
function AddCartButton({ product }: { product: Product }) {
  const { addItem, justAdded } = useCart();
  const showFeedback = justAdded === product.name;

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addItem({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price!,
        talle: "",
      });
    },
    [addItem, product]
  );

  return (
    <motion.button
      onClick={handleAdd}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center justify-center gap-1.5 rounded-full h-9 px-3.5 text-xs font-bold transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${
        showFeedback
          ? "bg-green-500 text-white shadow-green-200"
          : "bg-[#0033A0] text-white hover:bg-[#0046D6]"
      }`}
    >
      <AnimatePresence mode="wait">
        {showFeedback ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            className="flex items-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Agregado
          </motion.span>
        ) : (
          <motion.span
            key="plus"
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -90 }}
            className="flex items-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Agregar
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════
   PRODUCT CARD — Tarjeta de producto
   ═══════════════════════════════════════════════ */
function ProductCard({ product, index }: { product: Product; index: number }) {
  const isProximamente = product.status === "proximamente";
  const hasPrice = product.price != null;
  const isClickable = hasPrice && !isProximamente;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      whileHover={isClickable ? { y: -6 } : undefined}
      onClick={isClickable ? () => { window.location.href = `/producto/${product.id}`; } : undefined}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-[#0033A0]/10 transition-all duration-300 ${isClickable ? "cursor-pointer" : ""}`}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#0033A0]/5 to-[#D4AF37]/5">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#0033A0]/0 group-hover:bg-[#0033A0]/10 transition-colors duration-300 pointer-events-none" />

        <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0033A0] border-none text-[10px] font-bold uppercase tracking-wider pointer-events-none">
          {categoryTitles[product.category] || product.category}
        </Badge>

        {isProximamente ? (
          <Badge className="absolute top-3 right-3 bg-[#D4AF37] text-[#0033A0] border-none text-[10px] font-bold pointer-events-none">
            Próximamente
          </Badge>
        ) : hasPrice ? (
          <Badge className="absolute top-3 right-3 bg-[#0033A0] text-white border-none text-[10px] font-bold pointer-events-none">
            ${product.price!.toLocaleString("es-AR")}
          </Badge>
        ) : null}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900 leading-tight sm:text-base line-clamp-2 group-hover:text-[#0033A0] transition-colors">
          {product.name}
        </h3>
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2 sm:text-sm">
          {product.description}
        </p>

        <div className="mt-auto pt-4">
          {isProximamente ? (
            <Button
              variant="secondary"
              className="w-full rounded-full h-10 text-sm font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Próximamente
            </Button>
          ) : hasPrice ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[#0033A0] font-black">
                ${product.price?.toLocaleString("es-AR")}
              </span>
              <AddCartButton product={product} />
            </div>
          ) : (
            <Button
              variant="default"
              className="w-full rounded-full h-10 text-sm font-semibold bg-[#0033A0] hover:bg-[#0046D6] text-white hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                const msg = encodeURIComponent(`Hola! Quiero consultar sobre: ${product.name}`);
                window.open(`${contactConfig.whatsappLink}?text=${msg}`, "_blank");
              }}
            >
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Consultar
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}



/* ═══════════════════════════════════════════════
   PRODUCT SECTION — Sección genérica de categoría
   ═══════════════════════════════════════════════ */
function ProductSection({
  sectionId,
  category,
  searchQuery,
}: {
  sectionId: string;
  category: string;
  searchQuery: string;
}) {
  const sectionProducts = products.filter((p) => p.category === category);
  const filtered = searchQuery
    ? sectionProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sectionProducts;
  const icon = categoryIcons[category];
  const title = categoryTitles[category];

  /* Determinar colores de acento por categoría */
  const accentColors: Record<string, { bg: string; text: string; border: string }> = {
    paquetes: { bg: "bg-[#0033A0]/5", text: "text-[#0033A0]", border: "border-[#0033A0]/20" },
    albumes: { bg: "bg-[#D4AF37]/10", text: "text-[#D4AF37]", border: "border-[#D4AF37]/30" },
    indumentaria: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    accesorios: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
    "accesorios-apple": { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
  };
  const colors = accentColors[category] || accentColors.accesorios;

  if (searchQuery && filtered.length === 0) return null;

  return (
    <section id={sectionId} className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado de sección */}
        <div className="flex items-center gap-4 mb-10">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} border ${colors.border}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{title}</h2>
            {!searchQuery && (
              <p className="text-sm text-gray-400 mt-0.5">{sectionProducts.length} producto{sectionProducts.length !== 1 && "s"}</p>
            )}
          </div>
          <Separator className="flex-1" />
        </div>

        {/* Sin productos — mostrar "Próximamente" */}
        {filtered.length === 0 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-5">
              <Clock className="h-10 w-10 text-gray-300" />
            </div>
            <Badge className="mb-3 bg-[#D4AF37] text-[#0033A0] border-none text-sm font-bold px-4">
              Próximamente
            </Badge>
            <p className="text-gray-500 max-w-md">
              Estamos trabajando para traerte los mejores accesorios.
              ¡Pronto vas a encontrar todo lo que necesitás acá!
            </p>
            <a
              href={`${contactConfig.whatsappLink}?text=${encodeURIComponent("Hola! Quiero saber cuándo van a tener accesorios disponibles")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0033A0] hover:text-[#0046D6] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </motion.div>
        )}

        {/* Grid de productos */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
            {/* Card de Figuritas a Elección — solo en la sección paquetes */}
            {category === "paquetes" && <FiguritasEleccionCard />}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FIGURITAS A ELECCIÓN — Card con contador
   (integrada dentro de la sección Paquetes)
   ═══════════════════════════════════════════════ */

function FiguritasEleccionCard() {
  const [cantidad, setCantidad] = useState(1);
  const [feedback, setFeedback] = useState(false);
  const { addItem } = useCart();

  const restar = () => setCantidad((prev) => Math.max(1, prev - 1));
  const sumar = () => setCantidad((prev) => Math.min(500, prev + 1));

  const consultarWhatsApp = () => {
    const msg = `Hola! Quiero consultar por ${cantidad} figurita${cantidad !== 1 ? "s" : ""} a elección.`;
    window.open(`${contactConfig.whatsappLink}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const agregarAlCarrito = () => {
    addItem({
      productId: "fig-eleccion",
      name: `${cantidad} Figurita${cantidad !== 1 ? "s" : ""} a Elección`,
      image: IMG_PACKS,
      price: 150,
      talle: "",
      cantidad,
    });
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  };

  const precioTotal = cantidad * 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-white to-[#D4AF37]/5 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/60 transition-all duration-300"
    >
      {/* Barra dorada arriba */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0033A0] via-[#D4AF37] to-[#0033A0] z-10" />

      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#0033A0]/5 to-[#D4AF37]/5">
        <img
          src={IMG_PACKS}
          alt="Figuritas a Elección"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#0033A0]/0 group-hover:bg-[#0033A0]/10 transition-colors duration-300 pointer-events-none" />
        <Badge className="absolute top-3 left-3 bg-[#D4AF37] text-[#0033A0] border-none text-[10px] font-bold uppercase tracking-wider">
          <Star className="mr-1 h-3 w-3" />
          A Elección
        </Badge>
        <Badge className="absolute top-3 right-3 bg-[#0033A0] text-white border-none text-[10px] font-bold">
          $150 c/u
        </Badge>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900 leading-tight sm:text-base group-hover:text-[#0033A0] transition-colors">
          Figuritas a Elección
        </h3>
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed sm:text-sm">
          Elegí la cantidad exacta que necesitás.
        </p>

        {/* Precio total dinámico */}
        <p className="mt-3 text-center text-base font-extrabold text-[#0033A0]">
          ${precioTotal.toLocaleString("es-AR")}
        </p>

        {/* Contador − / número / + */}
        <div className="mt-2 flex items-center justify-center">
          <button
            onClick={restar}
            className="flex h-10 w-10 items-center justify-center rounded-l-full bg-[#0033A0] text-white font-bold text-lg hover:bg-[#0046D6] transition-colors active:scale-95 select-none"
            aria-label="Restar"
          >
            −
          </button>
          <div className="flex h-10 min-w-[60px] items-center justify-center bg-gray-50 border-y-2 border-[#0033A0]/20 px-3">
            <span className="text-lg font-extrabold text-[#0033A0] tabular-nums">{cantidad}</span>
          </div>
          <button
            onClick={sumar}
            className="flex h-10 w-10 items-center justify-center rounded-r-full bg-[#0033A0] text-white font-bold text-lg hover:bg-[#0046D6] transition-colors active:scale-95 select-none"
            aria-label="Sumar"
          >
            +
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          {cantidad} figurita{cantidad !== 1 ? "s" : ""}
        </p>

        {/* Botones */}
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <motion.button
            onClick={agregarAlCarrito}
            whileTap={{ scale: 0.95 }}
            className={`w-full rounded-full h-10 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer ${
              feedback
                ? "bg-green-500 text-white shadow-green-200"
                : "bg-[#0033A0] text-white hover:bg-[#0046D6] hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <AnimatePresence mode="wait">
              {feedback ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  className="flex items-center gap-1.5"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Agregado
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  className="flex items-center gap-1.5"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Agregar al carrito
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <button
            onClick={consultarWhatsApp}
            className="w-full rounded-full h-9 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Consultar
          </button>
        </div>
      </div>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════
   CONTACT SECTION
   ═══════════════════════════════════════════════ */
function ContactSection() {
  return (
    <section id="contacto" className="py-16 sm:py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-3 bg-[#0033A0]/10 text-[#0033A0] border-[#0033A0]/20 text-xs font-bold">
            <Send className="mr-1 h-3 w-3" />
            Contacto
          </Badge>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">¿Tenes alguna consulta?</h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto">
            Escribinos por WhatsApp o Email y te respondemos a la brevedad.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* WhatsApp */}
          <a
            href={contactConfig.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">WhatsApp</h3>
            <p className="mt-1 text-sm text-gray-500">Escribinos al instante</p>
            <p className="mt-2 text-sm font-semibold text-green-600">{contactConfig.whatsapp}</p>
          </a>

          {/* Email */}
          <a
            href={contactConfig.emailLink}
            className="group flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-[#0033A0]/20 transition-all duration-300"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0033A0]/5 group-hover:bg-[#0033A0]/10 transition-colors">
              <Mail className="h-8 w-8 text-[#0033A0]" />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">Email</h3>
            <p className="mt-1 text-sm text-gray-500">Consultas detalladas</p>
            <p className="mt-2 text-sm font-semibold text-[#0033A0]">{contactConfig.email}</p>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-pink-200 transition-all duration-300"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
              <Instagram className="h-8 w-8 text-pink-600" />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">Instagram</h3>
            <p className="mt-1 text-sm text-gray-500">Consultas por DM</p>
            <p className="mt-2 text-sm font-semibold text-pink-600">Escribinos</p>
          </a>

          {/* Envíos */}
          <div className="group flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors">
              <Truck className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">Envíos</h3>
            <p className="mt-1 text-sm text-gray-500">{contactConfig.shippingNote}</p>
            <p className="mt-2 text-sm font-semibold text-[#D4AF37]">Todo el país</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FOOTER — Pie de página completo
   ═══════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#0033A0] text-white">
      {/* Barra dorada superior */}
      <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5D775] to-[#D4AF37]" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Marca */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Trophy className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-lg font-extrabold">{storeName}</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Tu tienda de confianza para figuritas del Mundial y merchandising oficial de la Selección Argentina.
            </p>
            {/* Redes sociales */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href={contactConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={contactConfig.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href={contactConfig.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4">Secciones</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {navSections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      const el = document.getElementById(s.id);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-400 shrink-0" />
                <a href={contactConfig.whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {contactConfig.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-300 shrink-0" />
                <a href={contactConfig.emailLink} className="hover:text-white transition-colors">
                  {contactConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#D4AF37] shrink-0" />
                {contactConfig.location}
              </li>
            </ul>
          </div>

          {/* Envíos */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4">Envíos</h4>
            <div className="flex items-start gap-2 text-sm text-white/60">
              <Truck className="h-4 w-4 mt-0.5 text-[#D4AF37] shrink-0" />
              <p>{contactConfig.shippingNote}</p>
            </div>
            <p className="mt-4 text-xs text-white/40">
              Tiempos de entrega estimados al consultar por WhatsApp o Email.
            </p>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>&copy; {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <p>Hecho con <Heart className="inline h-3.5 w-3.5 text-red-400" /> en Argentina</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════
   FLOATING WHATSAPP BUTTON
   ═══════════════════════════════════════════════ */
function FloatingWhatsApp() {
  return (
    <motion.a
      href={`${contactConfig.whatsappLink}?text=${encodeURIComponent("Hola! Quiero información sobre los productos")}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.2, duration: 0.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl hover:bg-green-600 transition-colors md:left-6"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </motion.a>
  );
}

/* ═══════════════════════════════════════════════
   CART PANEL — Preview lateral usando CartContext
   ═══════════════════════════════════════════════ */
function CartPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, totalItems, totalPrice, removeItem } = useCart();
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel lateral */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0033A0]">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                Mi Carrito ({totalItems})
              </h2>
              <button
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <ShoppingCart className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="mt-4 text-gray-400 font-medium">Tu carrito está vacío</p>
                  <p className="mt-1 text-sm text-gray-300">Agregá productos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.productId}-${item.talle}`}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="flex gap-3 rounded-xl border border-gray-100 p-3 hover:border-gray-200 transition-colors"
                      >
                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover bg-gray-50" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                          {item.talle && (
                            <span className="text-[11px] font-bold text-[#0033A0] bg-[#0033A0]/10 rounded-md px-1.5 py-0.5">Talle {item.talle}</span>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            ${item.price.toLocaleString("es-AR")} c/u · x{item.cantidad}
                          </p>
                          <p className="text-sm font-bold text-[#0033A0]">
                            ${(item.price * item.cantidad).toLocaleString("es-AR")}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.talle)}
                          className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors self-start cursor-pointer"
                          title="Eliminar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer del carrito */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-xl font-black text-[#0033A0]">${totalPrice.toLocaleString("es-AR")}</span>
                </div>
                <button
                  onClick={() => { onClose(); router.push("/carrito"); }}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0033A0] hover:bg-[#0046D6] text-white h-12 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Ver carrito completo
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded-full border-2 border-gray-200 text-gray-600 h-10 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartToggle={() => setCartOpen(true)}
      />

      <main className="flex-1">
        <HeroBanner />

        {/* Separador visual entre secciones */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        <ProductSection sectionId="paquetes" category="paquetes" searchQuery={searchQuery} />
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <ProductSection sectionId="albumes" category="albumes" searchQuery={searchQuery} />
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <ProductSection sectionId="indumentaria" category="indumentaria" searchQuery={searchQuery} />
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <ProductSection sectionId="accesorios" category="accesorios" searchQuery={searchQuery} />
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <ProductSection sectionId="accesorios-apple" category="accesorios-apple" searchQuery={searchQuery} />
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        <ContactSection />
      </main>

      <Footer />
      <CartPanel
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
      <FloatingWhatsApp />
      <ScrollToTop />
    </div>
  );
}