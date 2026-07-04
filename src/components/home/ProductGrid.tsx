"use client";

import { motion } from "framer-motion";
import { Clock, MessageCircle } from "lucide-react";
import { products, contactConfig, type Product } from "@/lib/products";
import { categoryIcons, categoryTitles } from "./categories";
import { ProductCard, FiguritasEleccionCard } from "./ProductCard";

/* ═══════════════════════════════════════════════
   PRODUCT SECTION — Sección genérica de categoría
   (estilo "Estadio Nocturno": grilla flex centrada,
   tarjetas de ancho fijo)
   ═══════════════════════════════════════════════ */
export default function ProductGrid({
  sectionId,
  category,
  searchQuery,
  onProductClick,
}: {
  sectionId: string;
  category: string;
  searchQuery: string;
  onProductClick: (product: Product) => void;
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

  if (searchQuery && filtered.length === 0) return null;

  return (
    <section id={sectionId} className="font-archivo py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7">
        {/* Encabezado de sección */}
        <div className="mb-[38px] flex items-center gap-4">
          <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[15px] border border-[var(--line)] bg-[rgba(45,107,255,0.14)] text-[var(--blue-l)]">
            {icon}
          </div>
          <div>
            <h2 className="text-[clamp(26px,3vw,36px)] font-extrabold tracking-[-0.03em] text-white">
              {title}
            </h2>
            {!searchQuery && (
              <p className="mt-0.5 text-[13px] font-medium text-[var(--mut)]">
                {sectionProducts.length} producto{sectionProducts.length !== 1 && "s"}
              </p>
            )}
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--line)] to-transparent" />
        </div>

        {/* Sin productos — estado "Próximamente" */}
        {filtered.length === 0 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-[560px] rounded-[20px] border border-dashed border-[var(--line)] bg-[rgba(10,18,55,0.3)] px-5 py-[70px] text-center"
          >
            <div className="mx-auto mb-[18px] grid h-16 w-16 place-items-center rounded-full bg-white/5 text-[var(--mut)]">
              <Clock className="h-7 w-7" />
            </div>
            <span className="mb-3.5 inline-block rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-l)] px-4 py-1.5 text-[13px] font-bold text-[#3a2c00]">
              Próximamente
            </span>
            <p className="text-[14px] leading-[1.6] text-[var(--mut)]">
              ¡Mirá nuestras promos con los mejores combos al mejor precio!
            </p>
            <a
              href={`${contactConfig.whatsappLink}?text=${encodeURIComponent("Hola! Quiero saber cuándo van a tener accesorios disponibles")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--gold)] transition-colors hover:text-[var(--gold-l)]"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </motion.div>
        )}

        {/* Grilla flex centrada — todas las cards del mismo ancho */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap justify-center gap-[22px]">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onOpen={() => onProductClick(product)}
              />
            ))}
            {/* Card de Figuritas a Elección — solo en la sección paquetes */}
            {category === "paquetes" && <FiguritasEleccionCard />}
          </div>
        )}
      </div>
    </section>
  );
}
