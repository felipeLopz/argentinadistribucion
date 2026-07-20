"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Clock, MessageCircle, Star, Ban } from "lucide-react";
import { contactConfig, IMG_PACKS, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { useStock } from "@/lib/stock-context";

/* Ancho fijo de tarjeta compartido por TODAS las cards (mockup: 262px) */
const CARD_W = "w-[262px] shrink-0 max-sm:w-full max-sm:max-w-[360px]";

/* Hover común a las cards (elevación + sombra). */
const cardHover = {
  y: -8,
  boxShadow: "0 24px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,183,58,0.15)",
};
const cardReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
} as const;

/* Pill de precio (azul), ajustado a su contenido. Se usa en las cards
   normales y en la card especial. */
const PRICE_PILL =
  "inline-flex w-fit items-center whitespace-nowrap rounded-[11px] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-4 py-2 text-[22px] font-extrabold leading-none text-white shadow-[0_6px_16px_rgba(11,62,204,0.5)]";

/* ═══════════════════════════════════════════════
   PRODUCT CARD — Tarjeta de producto (estilo Estadio Nocturno)
   Toda la card es clickeable y abre el modal de vista rápida.
   ═══════════════════════════════════════════════ */
export function ProductCard({ product, index, onOpen }: { product: Product; index: number; onOpen?: () => void }) {
  const { stockTotal, estado } = useStock();
  const isProximamente = product.status === "proximamente";
  const hasPrice = product.price != null;
  const isClickable = hasPrice && !isProximamente;

  /* Stock sumado de todas las variantes. null = todavía no se sabe.
     La card muestra el total; el detalle por variante va en el modal. */
  const total = hasPrice && !isProximamente ? stockTotal(product.id) : null;
  const agotado = total === 0;

  const open = isClickable && onOpen ? onOpen : undefined;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <motion.div
      {...cardReveal}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      whileHover={cardHover}
      onClick={open}
      onKeyDown={handleKeyDown}
      role={open ? "button" : undefined}
      tabIndex={open ? 0 : undefined}
      aria-label={open ? `Ver ${product.name}` : undefined}
      className={`group relative flex ${CARD_W} flex-col overflow-hidden rounded-[20px] border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.6)] to-[rgba(10,18,55,0.4)] ${
        open
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/70"
          : ""
      }`}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#12225f] to-[#0a1550]">
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08] ${
            agotado ? "opacity-40 grayscale" : ""
          }`}
          loading="lazy"
        />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-[18px]">
        <h3 className="mb-[7px] text-[16px] font-bold text-white">{product.name}</h3>
        <p className="mb-4 line-clamp-2 min-h-[40px] text-[13px] leading-[1.55] text-[var(--mut)]">
          {product.description}
        </p>

        {isProximamente ? (
          <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-[9px] border border-[var(--line)] bg-white/[0.06] px-3 py-1.5 text-[13px] font-bold text-[var(--mut)]">
            <Clock className="h-3.5 w-3.5" />
            Próximamente
          </span>
        ) : hasPrice ? (
          <div className="mt-auto flex flex-col items-center gap-2">
            <span className={`${PRICE_PILL}${agotado ? " opacity-50 line-through" : ""}`}>
              ${product.price!.toLocaleString("es-AR")}
            </span>
            {/* Disponibilidad. Mientras carga no decimos "Agotado" (sería
                falso): se avisa que se está consultando. */}
            {estado === "cargando" ? (
              <span className="animate-pulse text-[12px] font-semibold text-[var(--mut)]/70">
                Verificando stock…
              </span>
            ) : agotado ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-red-400">
                <Ban className="h-3.5 w-3.5" />
                Agotado
              </span>
            ) : total !== null ? (
              <span className="text-[12px] font-semibold text-[var(--mut)]">
                Quedan {total}
              </span>
            ) : null}
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const msg = encodeURIComponent(`Hola! Quiero consultar sobre: ${product.name}`);
              window.open(`${contactConfig.whatsappLink}?text=${msg}`, "_blank");
            }}
            className="mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#25a35a] text-[14px] font-bold text-white transition hover:-translate-y-px hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" />
            Consultar
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   FIGURITAS A ELECCIÓN — Card especial con contador
   (integrada dentro de la sección Paquetes)
   ═══════════════════════════════════════════════ */
export function FiguritasEleccionCard() {
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
      variante: "",
      cantidad,
    });
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  };

  return (
    <motion.div
      {...cardReveal}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={cardHover}
      className={`group relative flex ${CARD_W} flex-col overflow-hidden rounded-[20px] border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.6)] to-[rgba(10,18,55,0.4)]`}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#12225f] to-[#0a1550]">
        <img
          src={IMG_PACKS}
          alt="Figuritas a Elección"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          loading="lazy"
        />
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-[7px] border border-[var(--line)] bg-[rgba(5,12,46,0.85)] px-2.5 py-[5px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mut)] backdrop-blur-[6px]">
          <Star className="h-3 w-3" />
          A Elección
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-[18px]">
        <h3 className="mb-[7px] text-[16px] font-bold text-white">Figuritas a Elección</h3>
        <p className="mb-4 min-h-[40px] text-[13px] leading-[1.55] text-[var(--mut)]">
          Elegí la cantidad exacta que necesitás.
        </p>

        {/* Precio (arriba del selector de cantidad) */}
        <span className={`mx-auto mb-2 ${PRICE_PILL}`}>$150 c/u</span>

        {/* Contador − / número / + */}
        <div className="my-2 flex items-center justify-center gap-2.5">
          <button
            onClick={restar}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--line)] bg-white/[0.04] text-[18px] text-white transition-colors hover:border-[var(--blue-l)] hover:text-[var(--blue-l)]"
            aria-label="Restar"
          >
            −
          </button>
          <span className="grid h-9 w-14 place-items-center rounded-[10px] border border-[var(--line)] bg-white/[0.04] text-center font-bold tabular-nums text-white">
            {cantidad}
          </span>
          <button
            onClick={sumar}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--line)] bg-white/[0.04] text-[18px] text-white transition-colors hover:border-[var(--blue-l)] hover:text-[var(--blue-l)]"
            aria-label="Sumar"
          >
            +
          </button>
        </div>

        {/* Botones */}
        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          <motion.button
            onClick={agregarAlCarrito}
            whileTap={{ scale: 0.97 }}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-bold text-white transition ${
              feedback
                ? "bg-green-500"
                : "bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] hover:-translate-y-px hover:brightness-110"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {feedback ? "Agregado" : "Agregar al carrito"}
          </motion.button>
          <button
            onClick={consultarWhatsApp}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#25a35a] text-[14px] font-bold text-white transition hover:-translate-y-px hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" />
            Consultar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
