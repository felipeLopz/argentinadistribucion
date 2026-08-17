"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MessageCircle } from "lucide-react";
import { contactConfig, type Product } from "@/lib/products";
import { useStock } from "@/lib/stock-context";
import { llevaStock } from "@/lib/stock-config";
import SinFoto from "./SinFoto";
import CardPrecio from "./CardPrecio";
import BadgeProducto from "./BadgeProducto";
import { usePromocion } from "@/hooks/use-promocion";

/* Ancho fijo de tarjeta compartido por TODAS las cards (mockup: 262px) */
const CARD_W = "w-[262px] shrink-0 max-sm:w-full max-sm:max-w-[360px]";

/* Ancho real al que se muestra la imagen de la card, para que next/image
   pida la variante justa (262px en desktop, hasta 360px en mobile). */
const CARD_IMG_SIZES = "(max-width: 639px) 360px, 262px";

/* Hover común a las cards (elevación + sombra). */
const cardHover = {
  y: -8,
  boxShadow: "0 24px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.15)",
};

const cardReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  /* Al filtrar, la card que sale se desvanece en vez de desaparecer de
     golpe. Corto (0.18s) para que no retrase la entrada de las nuevas. */
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: "easeOut" } },
} as const;

/* ═══════════════════════════════════════════════
   PRODUCT CARD — Tarjeta de producto
   Toda la card es clickeable y abre el modal de vista rápida.

   El bloque de precio y disponibilidad vive aparte, en CardPrecio: es el
   punto donde entran los badges y las ofertas más adelante.
   ═══════════════════════════════════════════════ */
export function ProductCard({
  product,
  index,
  onOpen,
  escalonar = true,
}: {
  product: Product;
  index: number;
  onOpen?: () => void;
  /** Escalona la entrada. Sólo en la carga inicial: al filtrar, las cards
   *  se remontan y escalonar cada vez se siente lento. */
  escalonar?: boolean;
}) {
  const { stockTotal, estado } = useStock();
  const isProximamente = product.status === "proximamente";
  const hasPrice = product.price != null;
  const isClickable = hasPrice && !isProximamente;

  /* Stock sumado de todas las variantes. null = todavía no se sabe.
     La card muestra el total; el detalle por variante va en el modal.
     Los productos sin stock (promo siempre disponible) no lo consultan:
     si lo hicieran, la respuesta sería 0 y saldrían como agotados. */
  const conStock = llevaStock(product);
  const total = hasPrice && !isProximamente && conStock ? stockTotal(product.id) : null;
  const agotado = total === 0;

  /* Badge, oferta y urgencia ya resueltos. La regla por categoría (los
     vapers no llevan promoción) vive adentro, no acá. */
  const promo = usePromocion(product, total);

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
      /* El escalonado va capado y sólo en la carga inicial: con la grilla
         filtrable las cards se remontan en cada cambio de filtro, y sin
         tope la última entraría casi un segundo tarde. */
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: escalonar ? Math.min(index, 8) * 0.04 : 0,
      }}
      whileHover={cardHover}
      onClick={open}
      onKeyDown={handleKeyDown}
      role={open ? "button" : undefined}
      tabIndex={open ? 0 : undefined}
      aria-label={open ? `Ver ${product.name}` : undefined}
      className={`group relative flex ${CARD_W} flex-col overflow-hidden rounded-[20px] border border-[var(--line)] bg-gradient-to-b from-[rgba(36,26,69,0.6)] to-[rgba(28,20,54,0.4)] ${
        open
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/70"
          : ""
      }`}
    >
      {/* Imagen (o el placeholder, si el producto todavía no tiene foto).
          El contenedor es `relative`: ahí van a colgarse los badges. */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#241a45] to-[#1c1436]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={CARD_IMG_SIZES}
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.08] ${
              agotado ? "opacity-40 grayscale" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <SinFoto size="md" className={agotado ? "opacity-40 grayscale" : ""} />
        )}

        {/* Badge sobre la foto. Se oculta si el producto está agotado: el
            cartel de "Agotado" manda, y un "OFERTA" sobre algo que no se
            puede comprar es ruido.
            pointer-events-none: la card entera es clickeable, el badge no
            debe robarle el click. */}
        {promo.badge && !agotado && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-24px)]">
            <BadgeProducto badge={promo.badge} />
          </div>
        )}
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
          <CardPrecio
            product={product}
            conStock={conStock}
            agotado={agotado}
            total={total}
            estadoStock={estado}
            promo={promo}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const msg = encodeURIComponent(`Hola! Quiero consultar sobre: ${product.name}`);
              window.open(`${contactConfig.whatsappLink}?text=${msg}`, "_blank", "noopener,noreferrer");
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
