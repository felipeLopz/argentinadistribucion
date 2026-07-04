"use client";

import { motion } from "framer-motion";
import { Trophy, MessageCircle } from "lucide-react";
import { contactConfig } from "@/lib/products";

const FEATURES = [
  "Envíos a toda Argentina",
  "Productos oficiales",
  "Atención personalizada",
];

/* ═══════════════════════════════════════════════
   HERO — Diseño "Estadio Nocturno"
   Fondo navy con glows radiales y franjas de estadio,
   pill dorado, título con parte dorada, CTA y features.
   ═══════════════════════════════════════════════ */
export default function Hero() {
  return (
    <section id="inicio" className="font-archivo relative overflow-hidden bg-[var(--navy)] text-center">
      {/* Fondo: glows radiales + franjas de estadio */}
      <div className="hero-glow absolute inset-0" />
      <div className="hero-stripes absolute inset-0" />

      {/* Contenido */}
      <div className="relative z-[2] mx-auto max-w-[1240px] px-5 pb-[150px] pt-24 sm:px-7">
        {/* Pill */}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,183,58,0.4)] bg-[rgba(232,183,58,0.12)] px-[18px] py-2 text-[13px] font-bold uppercase tracking-[0.03em] text-[var(--gold-l)]"
        >
          <Trophy className="h-4 w-4" />
          Copa del Mundo
        </motion.span>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-7 font-black leading-[0.98] tracking-[-0.035em] text-[clamp(38px,6.5vw,80px)]"
        >
          <span className="text-white">Figuritas del Mundial</span>
          <span className="text-gold-gradient mt-1.5 block">&amp; Merchandising Argentina</span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-[560px] text-[17px] leading-[1.65] text-[var(--mut)]"
        >
          Tu tienda de confianza para figuritas, álbumes y toda la merchandising
          oficial de la Selección Argentina. Envíos a todo el país.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row"
        >
          <a
            href="#paquetes"
            className="inline-flex items-center gap-2 rounded-[13px] bg-gradient-to-br from-[var(--gold)] to-[var(--gold-l)] px-[30px] py-[15px] text-[15px] font-bold text-[#3a2c00] shadow-[0_10px_30px_rgba(232,183,58,0.35)] transition-[transform,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(232,183,58,0.5)]"
          >
            <Trophy className="h-[18px] w-[18px]" />
            Ver Productos
          </a>
          <a
            href={`${contactConfig.whatsappLink}?text=${encodeURIComponent("Hola! Quiero consultar por las promos activas.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[13px] border border-[var(--line)] bg-white/5 px-[30px] py-[15px] text-[15px] font-bold text-white transition duration-300 hover:-translate-y-[3px] hover:bg-white/10"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            Consultar por promos
          </a>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-11 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-[var(--mut)]"
        >
          {FEATURES.map((label) => (
            <span key={label} className="inline-flex items-center gap-2">
              <i className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Línea dorada inferior del hero (según el mockup) */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />
    </section>
  );
}
