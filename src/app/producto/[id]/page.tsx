"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Package,
  ShieldCheck,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
  Star,
  Trophy,
  Ruler,
  Ban,
  ShoppingCart,
  Check,
} from "lucide-react";
import { products, contactConfig, storeName } from "@/lib/products";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";

const HORARIOS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
];

export default function ProductoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const product = useMemo(() => products.find((p) => p.id === id), [id]);

  /* ─── Estado del formulario ─── */
  const [talle, setTalle] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [horario, setHorario] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState<"envio" | "retiro">("envio");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [agregado, setAgregado] = useState(false);
  const { addItem } = useCart();

  /* ─── Transición de entrada ─── */
  const [transicion, setTransicion] = useState(true);
  const [fase, setFase] = useState<"entrando" | "unido" | "saliendo" | "listo">("entrando");

  useEffect(() => {
    const t1 = setTimeout(() => setFase("unido"), 450);
    const t2 = setTimeout(() => setFase("saliendo"), 700);
    const t3 = setTimeout(() => {
      setFase("listo");
      setTransicion(false);
    }, 1150);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  /* ─── No encontrado ─── */
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
          <p className="text-gray-500 mb-6">
            El producto que buscás no existe o no está disponible para compra directa.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#0033A0] hover:bg-[#0046D6] text-white px-6 py-3 font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la tienda
          </Link>
        </motion.div>
      </div>
    );
  }

  const categoriaLabels: Record<string, string> = {
    paquetes: "Paquetes de Figuritas",
    albumes: "Álbumes",
    indumentaria: "Indumentaria",
    "accesorios-apple": "Accesorios Apple",
  };
  const categoriaLabel = categoriaLabels[product.category] || product.category;

  const tieneTalles = !!product.talleStock;
  const talles = tieneTalles ? Object.keys(product.talleStock!) : [];
  const stockTalle = tieneTalles && talle ? (product.talleStock![talle] ?? 0) : 0;
  const stock = tieneTalles ? stockTalle : 999;
  const precioUnitario = product.price!;
  const subtotal = precioUnitario * cantidad;

  /* Reset cantidad cuando cambia el talle o no hay stock */
  useEffect(() => {
    if (tieneTalles) {
      if (talle && stockTalle > 0) {
        setCantidad((c) => Math.min(c, stockTalle));
      } else {
        setCantidad(1);
      }
    }
  }, [talle, tieneTalles, stockTalle]);

  /* ─── Controles de cantidad ─── */
  const restar = () => setCantidad((c) => Math.max(1, c - 1));
  const sumar = () => setCantidad((c) => Math.min(stock, c + 1));

  /* ─── Validación ─── */
  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    if (!nombre.trim()) nuevosErrores.nombre = "Ingresá tu nombre completo";
    if (!direccion.trim()) nuevosErrores.direccion = "Ingresá tu dirección";
    if (!telefono.trim()) nuevosErrores.telefono = "Ingresá tu teléfono";
    else if (!/^\d{7,15}$/.test(telefono.replace(/[\s\-()]/g, "")))
      nuevosErrores.telefono = "Número de teléfono inválido";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nuevosErrores.email = "Email inválido";
    if (!horario) nuevosErrores.horario = "Seleccioná un horario";
    if (tieneTalles && !talle) nuevosErrores.talle = "Seleccioná un talle";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /* ─── Agregar al carrito ─── */
  const agregarAlCarrito = () => {
    if (tieneTalles && !talle) {
      setErrores((prev) => ({ ...prev, talle: "Seleccioná un talle" }));
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: precioUnitario,
      talle: tieneTalles ? talle : "",
      cantidad,
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  /* ─── Confirmar compra → WhatsApp ─── */
  const confirmar = () => {
    if (!validar()) return;

    const msg = [
      `*PEDIDO NUEVO — ${storeName}*`,
      ``,
      `📦 *Producto:* ${product.name}${tieneTalles ? ` — Talle ${talle}` : ""}`,
      `💰 *Precio unitario:* $${precioUnitario.toLocaleString("es-AR")}`,
      `🔢 *Cantidad:* ${cantidad}${tieneTalles ? ` (talle ${talle})` : ""}`,
      `💵 *Total:* $${subtotal.toLocaleString("es-AR")}`,
      ``,
      `━━━━━━━━━━━━━━━━`,
      `*Datos del cliente: *`,
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
    setEnviado(true);
  };

  /* ─── Field helper ─── */
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* ═══ TRANSICIÓN DE ENTRADA ═══ */}
      <AnimatePresence>
        {transicion && (
          <>
            <motion.div
              key="panel-azul"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={
                fase === "entrando"
                  ? { clipPath: "inset(0 0% 0 0)" }
                  : fase === "saliendo"
                  ? { clipPath: "inset(0 100% 0 0)" }
                  : {}
              }
              exit={{ clipPath: "inset(0 100% 0 0)" }}
              transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              className="fixed inset-0 z-[100]"
              style={{ background: "linear-gradient(135deg, #001A5C 0%, #0033A0 50%, #0046D6 100%)" }}
            >
              <div className="absolute top-1/3 left-1/4 w-60 h-60 rounded-full bg-white/[0.03] blur-3xl" />
              <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full bg-[#D4AF37]/10 blur-2xl" />
              {fase === "unido" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.15, scale: 1 }}
                  className="absolute top-1/2 left-0 -translate-y-1/2 w-full flex justify-center"
                >
                  <Trophy className="h-24 w-24 text-white" />
                </motion.div>
              )}
            </motion.div>

            <motion.div
              key="panel-dorado"
              initial={{ clipPath: "inset(0 0 0 100%)" }}
              animate={
                fase === "entrando"
                  ? { clipPath: "inset(0 0 0 0%)" }
                  : fase === "saliendo"
                  ? { clipPath: "inset(0 0 0 100%)" }
                  : {}
              }
              exit={{ clipPath: "inset(0 0 0 100%)" }}
              transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              className="fixed inset-0 z-[100]"
              style={{ background: "linear-gradient(225deg, #F5D775 0%, #D4AF37 50%, #B8960C 100%)" }}
            >
              <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full bg-white/[0.06] blur-3xl" />
              <div className="absolute top-1/4 right-1/3 w-40 h-40 rounded-full bg-[#0033A0]/10 blur-2xl" />
            </motion.div>

            {fase === "unido" && (
              <motion.div
                key="linea-central"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0, 1, 0.6] }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 z-[101] origin-center"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.9), transparent)" }}
              />
            )}

            {(fase === "unido" || fase === "saliendo") && (
              <motion.div
                key="flash-radial"
                initial={fase === "unido" ? { scale: 0, opacity: 0 } : false}
                animate={
                  fase === "unido"
                    ? { scale: 0.2, opacity: 0.3 }
                    : { scale: 3, opacity: 0 }
                }
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[102] w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)" }}
              />
            )}

            {fase === "saliendo" && (
              <>
                {[...Array(8)].map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const dist = 200 + Math.random() * 150;
                  return (
                    <motion.div
                      key={`part-${i}`}
                      initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="fixed top-1/2 left-1/2 z-[102] w-2 h-2 rounded-full pointer-events-none"
                      style={{ background: i % 2 === 0 ? "#0033A0" : "#D4AF37" }}
                    />
                  );
                })}
              </>
            )}
          </>
        )}
      </AnimatePresence>

      {/* ═══ CONTENIDO ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: transicion ? 0 : 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="h-1 bg-gradient-to-r from-[#0033A0] via-[#D4AF37] to-[#0033A0]" />

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
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
              <span className="text-xs text-gray-400 hidden sm:block">Detalle del producto</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <AnimatePresence mode="wait">
            {!enviado ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid lg:grid-cols-2 gap-8 lg:gap-12"
              >
                {/* COLUMNA IZQUIERDA: Producto */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[#0033A0]/5 to-[#D4AF37]/5 shadow-lg"
                  >
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0033A0] text-white px-3 py-1.5 text-xs font-bold shadow-md">
                        <Star className="h-3 w-3 text-[#D4AF37]" />
                        {categoriaLabel}
                      </span>
                    </div>

                  </motion.div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
                    <p className="mt-2 text-gray-500 leading-relaxed">{product.description}</p>
                    <div className="mt-4 flex items-end gap-3">
                      <span className="text-3xl sm:text-4xl font-black text-[#0033A0]">
                        ${precioUnitario.toLocaleString("es-AR")}
                      </span>
                      <span className="text-sm text-gray-400 mb-1">{tieneTalles ? "por unidad" : "por pack"}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-[#D4AF37]" />
                        Envíos a todo el país
                      </span>
                    </div>
                  </div>

                  {/* SELECTOR DE TALLES */}
                  {tieneTalles && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Ruler className="h-4 w-4 text-[#0033A0]" />
                        Seleccioná tu talle
                        <span className="text-red-400 text-xs">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {talles.map((t) => {
                          const stockT = product.talleStock![t] ?? 0;
                          const agotado = stockT === 0;
                          const seleccionado = talle === t;
                          return (
                            <button
                              key={t}
                              onClick={() => {
                                if (agotado) return;
                                setTalle(t);
                                if (errores.talle) setErrores((prev) => ({ ...prev, talle: "" }));
                              }}
                              disabled={agotado}
                              className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-4 py-3 min-w-[64px] transition-all ${
                                agotado
                                  ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                                  : seleccionado
                                  ? "border-[#0033A0] bg-[#0033A0] text-white shadow-md scale-105"
                                  : "border-gray-200 text-gray-700 hover:border-[#0033A0]/50 hover:bg-[#0033A0]/5 cursor-pointer"
                              }`}
                            >
                              {agotado && (
                                <Ban className="absolute -top-1.5 -right-1.5 h-4 w-4 text-red-400 bg-white rounded-full" />
                              )}
                              <span className={`text-base font-extrabold ${seleccionado ? "text-white" : agotado ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                {t}
                              </span>
                              <span className={`text-[10px] font-semibold leading-tight ${
                                seleccionado ? "text-white/80" : agotado ? "text-red-400" : "text-gray-500"
                              }`}>
                                {agotado ? "Agotado" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {errores.talle && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errores.talle}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Selector de cantidad */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Package className="h-4 w-4 text-[#0033A0]" />
                      Cantidad de {tieneTalles ? "unidades" : "packs"}
                    </label>
                    <div className={`flex items-center gap-4${tieneTalles && (!talle || stockTalle === 0) ? " opacity-40 pointer-events-none" : ""}`}>
                      <div className="flex items-center">
                        <button
                          onClick={restar}
                          className="flex h-12 w-12 items-center justify-center rounded-l-xl bg-gray-100 text-gray-700 font-bold text-xl hover:bg-gray-200 transition-colors active:scale-95 select-none cursor-pointer"
                        >
                          −
                        </button>
                        <div className="flex h-12 min-w-[72px] items-center justify-center bg-white border-y-2 border-gray-200 px-4">
                          <span className="text-xl font-extrabold text-gray-900 tabular-nums">{cantidad}</span>
                        </div>
                        <button
                          onClick={sumar}
                          className="flex h-12 w-12 items-center justify-center rounded-r-xl bg-[#0033A0] text-white font-bold text-xl hover:bg-[#0046D6] transition-colors active:scale-95 select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-400">Subtotal</p>
                        <p className="text-2xl font-black text-[#0033A0]">${subtotal.toLocaleString("es-AR")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Formulario */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Datos de entrega</h2>
                    <p className="text-sm text-gray-400 mb-6">Completá tus datos para confirmar la compra.</p>

                    <div className="mb-6">
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
                  </div>

                  {/* RESUMEN DEL PEDIDO */}
                  <div className="rounded-2xl border-2 border-[#0033A0]/10 bg-gradient-to-br from-[#0033A0]/[0.02] to-[#D4AF37]/[0.03] p-6">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                      <ShieldCheck className="h-5 w-5 text-[#0033A0]" />
                      Resumen del pedido
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Producto</span>
                        <span className="font-semibold text-gray-900">{product.name}{tieneTalles && talle ? ` — ${talle}` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio unitario</span>
                        <span className="font-semibold text-gray-900">${precioUnitario.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cantidad</span>
                        <span className="font-semibold text-gray-900">{cantidad} {tieneTalles ? "unidad" + (cantidad !== 1 ? "es" : "") : "pack" + (cantidad !== 1 ? "s" : "")}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-[#0033A0]">${subtotal.toLocaleString("es-AR")}</span>
                      </div>
                    </div>

                    {nombre && (
                      <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs text-gray-500 space-y-1">
                        <p><span className="font-semibold text-gray-700">Cliente:</span> {nombre}</p>
                        {direccion && (
                          <p>
                            <span className="font-semibold text-gray-700">{metodoEntrega === "envio" ? "Envío a:" : "Retiro en:"}</span> {direccion}
                          </p>
                        )}
                        {telefono && <p><span className="font-semibold text-gray-700">Tel:</span> {telefono}</p>}
                        {horario && <p><span className="font-semibold text-gray-700">Horario:</span> {horario}</p>}
                      </div>
                    )}

                    {/* Botón agregar al carrito */}
                    <button
                      onClick={agregarAlCarrito}
                      disabled={tieneTalles && (!talle || stockTalle === 0)}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full h-13 py-3.5 font-bold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl cursor-pointer ${
                        agregado
                          ? "bg-green-500 text-white"
                          : "bg-[#0033A0] hover:bg-[#0046D6] text-white"
                      } ${tieneTalles && !talle ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {agregado ? (
                        <><Check className="h-5 w-5" /> Agregado al carrito</>
                      ) : (
                        <><ShoppingCart className="h-5 w-5" /> Agregar al carrito</>
                      )}
                    </button>

                    {/* Botón confirmar WhatsApp */}
                    <button
                      onClick={confirmar}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white h-13 py-3.5 font-bold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Comprar ahora por WhatsApp
                    </button>

                    <p className="mt-3 text-center text-[11px] text-gray-400">
                      Al confirmar, se abrirá WhatsApp con los datos de tu pedido para coordinar el pago y la entrega.
                    </p>
                  </div>
                </div>
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
                  Tu pedido de <span className="font-bold text-gray-700">{cantidad}x {product.name}{tieneTalles && talle ? ` (Talle ${talle})` : ""}</span> fue
                  enviado por WhatsApp. Te van a responder a la brevedad para coordinar el pago y la entrega.
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
                    href={`${contactConfig.whatsappLink}?text=${encodeURIComponent(
                      `Hola! Acabo de hacer un pedido de ${cantidad}x ${product.name}${tieneTalles && talle ? ` (Talle ${talle})` : ""}. Quería confirmar el estado.`
                    )}`}
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
      </motion.div>
    </div>
  );
}