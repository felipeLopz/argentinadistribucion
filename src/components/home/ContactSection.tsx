"use client";

import { Send, MessageCircle, Mail, Instagram, Truck } from "lucide-react";
import { contactConfig } from "@/lib/products";

/* ═══════════════════════════════════════════════
   CONTACT SECTION — Diseño "Estadio Nocturno"
   ═══════════════════════════════════════════════ */
export default function ContactSection() {
  return (
    <section id="contacto" className="font-archivo py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7">
        {/* Encabezado */}
        <div className="mb-11 text-center">
          <span className="mb-[18px] inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(45,107,255,0.12)] px-4 py-[7px] text-[13px] font-semibold text-[var(--blue-l)]">
            <Send className="h-3.5 w-3.5" />
            Contacto
          </span>
          <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-0.03em] text-white">
            ¿Tenés alguna consulta?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[16px] text-[var(--mut)]">
            Escribinos por WhatsApp o Email y te respondemos a la brevedad.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* WhatsApp */}
          <a
            href={contactConfig.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.5)] to-[rgba(10,18,55,0.3)] p-7 text-center transition duration-300 hover:-translate-y-[5px] hover:border-[rgba(232,183,58,0.4)]"
          >
            <div className="grid h-[54px] w-[54px] place-items-center rounded-[15px] bg-[rgba(37,163,90,0.12)]">
              <MessageCircle className="h-7 w-7 text-[#37c46f]" />
            </div>
            <h3 className="mt-4 font-bold text-white">WhatsApp</h3>
            <p className="mt-1 text-[13px] text-[var(--mut)]">Escribinos al instante</p>
            <p className="mt-2.5 text-sm font-bold text-[var(--gold)]">{contactConfig.whatsapp}</p>
          </a>

          {/* Email */}
          <a
            href={contactConfig.emailLink}
            className="group flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.5)] to-[rgba(10,18,55,0.3)] p-7 text-center transition duration-300 hover:-translate-y-[5px] hover:border-[rgba(232,183,58,0.4)]"
          >
            <div className="grid h-[54px] w-[54px] place-items-center rounded-[15px] bg-[rgba(45,107,255,0.14)]">
              <Mail className="h-7 w-7 text-[var(--blue-l)]" />
            </div>
            <h3 className="mt-4 font-bold text-white">Email</h3>
            <p className="mt-1 text-[13px] text-[var(--mut)]">Consultas detalladas</p>
            <p className="mt-2.5 text-sm font-bold text-[var(--gold)]">{contactConfig.email}</p>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.5)] to-[rgba(10,18,55,0.3)] p-7 text-center transition duration-300 hover:-translate-y-[5px] hover:border-[rgba(232,183,58,0.4)]"
          >
            <div className="grid h-[54px] w-[54px] place-items-center rounded-[15px] bg-[rgba(236,72,153,0.13)]">
              <Instagram className="h-7 w-7 text-[#e46bb0]" />
            </div>
            <h3 className="mt-4 font-bold text-white">Instagram</h3>
            <p className="mt-1 text-[13px] text-[var(--mut)]">Consultas por DM</p>
            <p className="mt-2.5 text-sm font-bold text-[var(--gold)]">Escribinos</p>
          </a>

          {/* Envíos */}
          <div className="group flex flex-col items-center rounded-[18px] border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.5)] to-[rgba(10,18,55,0.3)] p-7 text-center transition duration-300 hover:-translate-y-[5px] hover:border-[rgba(232,183,58,0.4)]">
            <div className="grid h-[54px] w-[54px] place-items-center rounded-[15px] bg-[rgba(232,183,58,0.14)]">
              <Truck className="h-7 w-7 text-[var(--gold)]" />
            </div>
            <h3 className="mt-4 font-bold text-white">Envíos</h3>
            <p className="mt-1 text-[13px] text-[var(--mut)]">{contactConfig.shippingNote}</p>
            <p className="mt-2.5 text-sm font-bold text-[var(--gold)]">Todo el país</p>
          </div>
        </div>
      </div>
    </section>
  );
}
