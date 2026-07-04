"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Trash2,
  ShoppingCart,
  ShieldCheck,
  Package,
  Ruler,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { contactConfig, storeName } from "@/lib/products";

const HORARIOS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
];

export default function CarritoPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  const [metodoEntrega, setMetodoEntrega] = useState<"envio" | "retiro">("envio");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [horario, setHorario] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (items.length === 0) e.vacio = "El carrito está vacío";
    if (!nombre.trim()) e.nombre = "Ingresá tu nombre completo";
    if (!direccion.trim()) e.direccion = "Ingresá tu dirección";
    if (!telefono.trim()) e.telefono = "Ingresá tu teléfono";
    else if (!/^\d{7,15}$/.test(telefono.replace(/[\s\-()]/g, "")))
      e.telefono = "Número de teléfono inválido";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Email inválido";
    if (!horario) e.horario = "Seleccioná un horario";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const confirmar = () => {
    if (!validar()) return;

    const lineas = items.map(
      (i, idx) =>
        `${idx + 1}. ${i.name}${i.talle ? ` (Talle ${i.talle})` : ""} x${i.cantidad} — $${(i.price * i.cantidad).toLocaleString("es-AR")}`
    );

    const msg = [
      `*PEDIDO NUEVO — ${storeName}*`,
      ``,
      `🛒 *Productos (${totalItems} unidades):*`,
      ...lineas,
      ``,
      `━━━━━━━━━━━━━━━━`,
      `💵 *Total del pedido:* $${totalPrice.toLocaleString("es-AR")}`,
      ``,
      `*Datos del cliente:*`,
      `👤 *Nombre:* ${nombre}`,
      `📍 *Dirección:* ${direccion}`,
      `📱 *Teléfono:* ${telefono}`,
      email ? `📧 *Email:* ${email}` : "",
      ``,
      `🚚 *Entrega:* ${metodoEntrega === "envio" ? "Envío a domicilio" : "Retiro en persona"}`,
      `🕐 *Horario:* ${horario}`,
      ``,
      `Por favor confirmá la disponibilidad y el total. ¡Gracias!`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `${contactConfig.whatsappLink}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    clearCart();
    setEnviado(true);
  };

  const campo = (
    label: string,
    id: string,
    value: string,
    setter: (v: string) => void,
    icon: React.ReactNode,
    type = "text",
    placeholder: string,
    required = true,
    opcional = false
  ) => (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)] mb-1.5">
        {icon}
        {label}
        {opcional && <span className="text-xs font-normal text-[var(--mut)]">(opcional)</span>}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          setter(e.target.value);
          if (errores[id]) setErrores((prev) => ({ ...prev, [id]: "" }));
        }}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--mut)] outline-none transition focus:ring-2 ${
          errores[id]
            ? "border-red-400/60 focus:border-red-400 focus:ring-[rgba(248,113,113,0.2)]"
            : "border-[var(--line)] focus:border-[var(--gold)] focus:ring-[rgba(232,183,58,0.22)]"
        }`}
      />
      {errores[id] && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          {errores[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="font-archivo min-h-screen bg-[var(--navy)] text-[var(--ink)]">
      <div className="h-1 bg-gradient-to-r from-[var(--blue)] via-[var(--gold)] to-[var(--blue)]" />

      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(5,12,46,0.82)] backdrop-blur-[14px]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-white/10 hover:text-[var(--gold)]"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)]">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-extrabold text-[var(--ink)]">{storeName}</span>
            </div>
            <div className="h-6 w-px bg-[var(--line)]" />
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)]">
                <ShoppingCart className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="hidden text-xs font-bold text-[var(--mut)] sm:block">
                Tu carrito ({totalItems} {totalItems === 1 ? "producto" : "productos"})
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {!enviado ? (
            <motion.div
              key="carrito"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-5 gap-8"
            >
              {/* COLUMNA IZQUIERDA: Items */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-black text-white">Tu carrito</h1>
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="flex items-center gap-1 text-xs font-semibold text-red-400 transition-colors hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Vaciar carrito
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl border border-[var(--line)] bg-[rgba(15,26,80,0.5)] p-12 text-center"
                  >
                    <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-white/5">
                      <ShoppingCart className="h-10 w-10 text-[var(--mut)]" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-white">Tu carrito está vacío</h2>
                    <p className="mb-6 text-[var(--mut)]">Explorá nuestros productos y agregá los que te gusten.</p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-px hover:brightness-110"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Ir a la tienda
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.talle}`}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          className="flex gap-4 rounded-2xl border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.6)] to-[rgba(10,18,55,0.4)] p-4"
                        >
                          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#12225f]">
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-white line-clamp-1">
                                  {item.name}
                                </p>
                                {item.talle && (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold text-[var(--blue-l)]">
                                    <Ruler className="h-3 w-3" />
                                    {item.talle}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(item.productId, item.talle)}
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[var(--mut)] transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-sm font-extrabold text-[var(--blue-l)]">
                              ${item.price.toLocaleString("es-AR")} c/u
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex items-center">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.talle, item.cantidad - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-l-lg border border-[var(--line)] bg-white/[0.04] text-sm font-bold text-[var(--ink)] transition-colors hover:bg-white/10 active:scale-95 select-none cursor-pointer"
                                >
                                  −
                                </button>
                                <div className="flex h-8 min-w-[40px] items-center justify-center border-y border-[var(--line)] bg-white/[0.02] px-2">
                                  <span className="text-sm font-extrabold text-white tabular-nums">{item.cantidad}</span>
                                </div>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.talle, item.cantidad + 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-r-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-sm font-bold text-white transition hover:brightness-110 active:scale-95 select-none cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-bold text-white">
                                ${(item.price * item.cantidad).toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="rounded-2xl border border-[var(--line)] bg-[rgba(15,26,80,0.4)] p-4 text-sm text-[var(--mut)]">
                    <p className="text-center">
                      <Package className="inline h-4 w-4 mr-1 text-[var(--blue-l)]" />
                      Se envían {totalItems} {totalItems === 1 ? "producto" : "productos"} — Envíos a todo el país
                    </p>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: Formulario */}
              {items.length > 0 && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-[var(--line)] bg-[rgba(15,26,80,0.5)] p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                      <ShieldCheck className="h-5 w-5 text-[var(--blue-l)]" />
                      Resumen del pedido
                    </h3>
                    <div className="space-y-2 text-sm">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.talle}`} className="flex justify-between">
                          <span className="mr-2 truncate text-[var(--mut)]">
                            {item.name}{item.talle ? ` (${item.talle})` : ""} x{item.cantidad}
                          </span>
                          <span className="whitespace-nowrap font-semibold text-white">
                            ${(item.price * item.cantidad).toLocaleString("es-AR")}
                          </span>
                        </div>
                      ))}
                      <div className="my-1 h-px w-full bg-[var(--line)]" />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-bold text-white">Total</span>
                        <span className="text-2xl font-black text-white">
                          ${totalPrice.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-[rgba(15,26,80,0.5)] p-6">
                    <h2 className="mb-1 text-xl font-bold text-white">Datos de entrega</h2>
                    <p className="mb-6 text-sm text-[var(--mut)]">Completá tus datos para confirmar la compra.</p>

                    <div className="mb-5">
                      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                        <Truck className="h-4 w-4 text-[var(--blue-l)]" />
                        Método de entrega
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setMetodoEntrega("envio")}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                            metodoEntrega === "envio"
                              ? "border-[var(--blue-l)] bg-[rgba(45,107,255,0.15)] text-white"
                              : "border-[var(--line)] text-[var(--mut)] hover:border-[var(--blue-l)]/60"
                          }`}
                        >
                          <Truck className="h-4 w-4" />
                          Envío
                        </button>
                        <button
                          onClick={() => setMetodoEntrega("retiro")}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                            metodoEntrega === "retiro"
                              ? "border-[var(--blue-l)] bg-[rgba(45,107,255,0.15)] text-white"
                              : "border-[var(--line)] text-[var(--mut)] hover:border-[var(--blue-l)]/60"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                          Retiro
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {campo("Nombre y apellido", "nombre", nombre, setNombre, <User className="h-4 w-4 text-[var(--mut)]" />, "text", "Ej: Juan Pérez")}
                      {campo(
                        metodoEntrega === "envio" ? "Dirección completa" : "Dirección de retiro",
                        "direccion", direccion, setDireccion, <MapPin className="h-4 w-4 text-[var(--mut)]" />, "text",
                        metodoEntrega === "envio" ? "Calle, número, piso, ciudad, CP" : "Dirección donde retirás"
                      )}
                      {campo("Número de teléfono", "telefono", telefono, setTelefono, <Phone className="h-4 w-4 text-[var(--mut)]" />, "tel", "Ej: 2615551234")}
                      {campo("Correo electrónico", "email", email, setEmail, <Mail className="h-4 w-4 text-[var(--mut)]" />, "email", "Ej: tu@email.com", false, true)}

                      <div>
                        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <Clock className="h-4 w-4 text-[var(--mut)]" />
                          Horario de {metodoEntrega === "envio" ? "entrega" : "retiro"}
                          <span className="text-red-400 text-xs">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HORARIOS.map((h) => (
                            <button
                              key={h}
                              onClick={() => {
                                setHorario(h);
                                if (errores.horario) setErrores((prev) => ({ ...prev, horario: "" }));
                              }}
                              className={`rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                horario === h
                                  ? "border-[var(--blue-l)] bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-white shadow-md"
                                  : "border-[var(--line)] text-[var(--mut)] hover:border-[var(--blue-l)]/60 hover:bg-white/[0.04]"
                              }`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                        {errores.horario && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {errores.horario}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={confirmar}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-base font-bold text-white shadow-lg transition hover:-translate-y-px hover:brightness-110 cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Confirmar compra por WhatsApp
                    </button>
                    <p className="mt-3 text-center text-[11px] text-[var(--mut)]">
                      Se abrirá WhatsApp con todos los productos del carrito para coordinar el pago y la entrega.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="confirmado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto flex max-w-lg flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15"
              >
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </motion.div>
              <h2 className="mb-2 text-2xl font-black text-white">¡Pedido enviado!</h2>
              <p className="mb-8 leading-relaxed text-[var(--mut)]">
                Tu pedido fue enviado por WhatsApp. Te van a responder a la brevedad para coordinar el pago y la entrega.
              </p>
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-px hover:brightness-110"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la tienda
                </Link>
                <a
                  href={`${contactConfig.whatsappLink}?text=${encodeURIComponent("Hola! Acabo de hacer un pedido. Quería confirmar el estado.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25a35a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-px hover:brightness-110"
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir WhatsApp
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-12 border-t border-[var(--line)] bg-[rgba(5,12,46,0.5)] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-[var(--mut)] sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} {storeName}</p>
          <p>{contactConfig.location} · {contactConfig.shippingNote}</p>
        </div>
      </footer>
    </div>
  );
}
