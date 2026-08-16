"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MessageCircle, Ban } from "lucide-react";
import { contactConfig, type Product } from "@/lib/products";
import { useStock } from "@/lib/stock-context";
import { llevaStock } from "@/lib/stock-config";
import SinFoto from "./SinFoto";

/* Ancho fijo de tarjeta compartido por TODAS las cards (mockup: 262px) */
const CARD_W = "w-[262px] shrink-0 max-sm:w-full max-sm:max-w-[360px]";

/* Ancho real al que se muestra la imagen de la card, para que next/image
   pida la variante justa (262px en desktop, hasta 360px en mobile). */
const CARD_IMG_SIZES = "(max-width: 639px) 360px, 262px";

/* Hover comÃºn a las cards (elevaciÃ³n + sombra). */
const cardHover = {
  y: -8,
  boxShadow: "0 24px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.15)",
};
const cardReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
} as const;

/* Pill de precio (azul), ajustado a su contenido. */
const PRICE_PILL =
  "inline-flex w-fit items-center whitespace-nowrap rounded-[11px] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-4 py-2 text-[22px] font-extrabold leading-none text-white shadow-[0_6px_16px_rgba(124,58,237,0.5)]";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PRODUCT CARD â€” Tarjeta de producto (estilo Estadio Nocturno)
   Toda la card es clickeable y abre el modal de vista rÃ¡pida.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function ProductCard({ product, index, onOpen }: { product: Product; index: number; onOpen?: () => void }) {
  const { stockTotal, estado } = useStock();
  const isProximamente = product.status === "proximamente";
  const hasPrice = product.price != null;
  const isClickable = hasPrice && !isProximamente;

  /* Stock sumado de todas las variantes. null = todavÃ­a no se sabe.
     La card muestra el total; el detalle por variante va en el modal.
     Los productos sin stock (promo siempre disponible) no lo consultan:
     si lo hicieran, la respuesta serÃ­a 0 y saldrÃ­an como agotados. */
  const conStock = llevaStock(product);
  const total = hasPrice && !isProximamente && conStock ? stockTotal(product.id) : null;
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
      className={`group relative flex ${CARD_W} flex-col overflow-hidden rounded-[20px] border border-[var(--line)] bg-gradient-to-b from-[rgba(36,26,69,0.6)] to-[rgba(28,20,54,0.4)] ${
        open
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/70"
          : ""
      }`}
    >
      {/* Imagen (o el placeholder, si el producto todavÃ­a no tiene foto) */}
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
            PrÃ³ximamente
          </span>
        ) : hasPrice ? (
          <div className="mt-auto flex flex-col items-center gap-2">
            <span className={`${PRICE_PILL}${agotado ? " opacity-50 line-through" : ""}`}>
              ${product.price!.toLocaleString("es-AR")}
            </span>
            {/* Disponibilidad. Mientras carga no decimos "Agotado" (serÃ­a
                falso): se avisa que se estÃ¡ consultando. Los productos sin
                stock muestran, en su lugar, de quÃ© va la promo. */}
            {!conStock ? (
              product.packPrecios ? (
                <span className="text-[12px] font-semibold text-[var(--gold)]">
                  Promo por cantidad Â· hasta {product.packPrecios.length}
                </span>
              ) : null
            ) : estado === "cargando" ? (
              <span className="animate-pulse text-[12px] font-semibold text-[var(--mut)]/70">
                Verificando stockâ€¦
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
