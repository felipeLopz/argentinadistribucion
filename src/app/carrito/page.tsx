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
import { Separator } from "@/components/ui/separator";

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
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
        {icon}
        {label}
        {opcional && <span className="text-xs font-normal text-gray-400">(opcional)</span>}
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
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
          errores[id]
            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
            : "border-gray-200 focus:ring-[#0033A0]/20 focus:border-[#0033A0]"
        }`}
      />
      {errores[id] && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {errores[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-1 bg-gradient-to-r from-[#0033A0] via-[#D4AF37] to-[#0033A0]" />

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[#0033A0]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0033A0]">
                <Trophy className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-extrabold text-[#0033A0]">{storeName}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0033A0]">
                <ShoppingCart className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-[#0033A0] hidden sm:block">
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
                  <h1 className="text-2xl font-black text-gray-900">Tu carrito</h1>
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
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
                    className="rounded-3xl border border-gray-200 bg-white p-12 text-center"
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
                      <ShoppingCart className="h-10 w-10 text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
                    <p className="text-gray-500 mb-6">Explorá nuestros productos y agregá los que te gusten.</p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 rounded-full bg-[#0033A0] hover:bg-[#0046D6] text-white px-6 py-3 font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
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
                          className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Link
                            href={`/producto/${item.productId}`}
                            className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100"
                          >
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/producto/${item.productId}`}
                                  className="text-sm font-bold text-gray-900 hover:text-[#0033A0] transition-colors line-clamp-1"
                                >
                                  {item.name}
                                </Link>
                                {item.talle && (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-[#0033A0]/10 text-[#0033A0] px-2 py-0.5 text-[11px] font-bold">
                                    <Ruler className="h-3 w-3" />
                                    {item.talle}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(item.productId, item.talle)}
                                className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-sm font-extrabold text-[#0033A0]">
                              ${item.price.toLocaleString("es-AR")} c/u
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex items-center">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.talle, item.cantidad - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-l-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors active:scale-95 select-none cursor-pointer"
                                >
                                  −
                                </button>
                                <div className="flex h-8 min-w-[40px] items-center justify-center bg-white border-y-2 border-gray-200 px-2">
                                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">{item.cantidad}</span>
                                </div>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.talle, item.cantidad + 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-r-lg bg-[#0033A0] text-white font-bold text-sm hover:bg-[#0046D6] transition-colors active:scale-95 select-none cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-bold text-gray-900">
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
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-400">
                    <p className="text-center">
                      <Package className="inline h-4 w-4 mr-1" />
                      Se envián {totalItems} {totalItems === 1 ? "producto" : "productos"} — Envíos a todo el país
                    </p>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: Formulario */}
              {items.length > 0 && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border-2 border-[#0033A0]/10 bg-gradient-to-br from-[#0033A0]/[0.02] to-[#D4AF37]/[0.03] p-6">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                      <ShieldCheck className="h-5 w-5 text-[#0033A0]" />
                      Resumen del pedido
                    </h3>
                    <div className="space-y-2 text-sm">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.talle}`} className="flex justify-between">
                          <span className="text-gray-500 truncate mr-2">
                            {item.name}{item.talle ? ` (${item.talle})` : ""} x{item.cantidad}
                          </span>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">
                            ${(item.price * item.cantidad).toLocaleString("es-AR")}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-[#0033A0]">
                          ${totalPrice.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Datos de entrega</h2>
                    <p className="text-sm text-gray-400 mb-6">Completá tus datos para confirmar la compra.</p>

                    <div className="mb-5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Truck className="h-4 w-4 text-[#0033A0]" />
                        Método de entrega
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setMetodoEntrega("envio")}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                            metodoEntrega === "envio"
                              ? "border-[#0033A0] bg-[#0033A0]/5 text-[#0033A0]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <Truck className="h-4 w-4" />
                          Envío
                        </button>
                        <button
                          onClick={() => setMetodoEntrega("retiro")}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                            metodoEntrega === "retiro"
                              ? "border-[#0033A0] bg-[#0033A0]/5 text-[#0033A0]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                          Retiro
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {campo("Nombre y apellido", "nombre", nombre, setNombre, <User className="h-4 w-4 text-gray-400" />, "text", "Ej: Juan Pérez")}
                      {campo(
                        metodoEntrega === "envio" ? "Dirección completa" : "Dirección de retiro",
                        "direccion", direccion, setDireccion, <MapPin className="h-4 w-4 text-gray-400" />, "text",
                        metodoEntrega === "envio" ? "Calle, número, piso, ciudad, CP" : "Dirección donde retirás"
                      )}
                      {campo("Número de teléfono", "telefono", telefono, setTelefono, <Phone className="h-4 w-4 text-gray-400" />, "tel", "Ej: 2615551234")}
                      {campo("Correo electrónico", "email", email, setEmail, <Mail className="h-4 w-4 text-gray-400" />, "email", "Ej: tu@email.com", false, true)}

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                          <Clock className="h-4 w-4 text-gray-400" />
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
                                  ? "border-[#0033A0] bg-[#0033A0] text-white shadow-md"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                        {errores.horario && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            {errores.horario}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={confirmar}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white h-13 py-3.5 font-bold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Confirmar compra por WhatsApp
                    </button>
                    <p className="mt-3 text-center text-[11px] text-gray-400">
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
              className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6"
              >
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">¡Pedido enviado!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Tu pedido fue enviado por WhatsApp. Te van a responder a la brevedad para coordinar el pago y la entrega.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#0033A0] hover:bg-[#0046D6] text-white px-6 py-3.5 font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la tienda
                </Link>
                <a
                  href={`${contactConfig.whatsappLink}?text=${encodeURIComponent("Hola! Acabo de hacer un pedido. Quería confirmar el estado.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir WhatsApp
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} {storeName}</p>
          <p>{contactConfig.location} · {contactConfig.shippingNote}</p>
        </div>
      </footer>
    </div>
  );
}