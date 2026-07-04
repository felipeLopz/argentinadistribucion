"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ShoppingCart, Check, Star, Truck, Ruler, Ban, Package } from "lucide-react";
import { contactConfig, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

/* ═══════════════════════════════════════════════
   PRODUCT MODAL — Panel deslizante con detalle del producto
   (theme "Estadio Nocturno")
   ═══════════════════════════════════════════════ */
export default function ProductModal({
  product,
  isOpen,
  onClose,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addItem, justAdded } = useCart();
  const [talle, setTalle] = useState("");
  const [opciones, setOpciones] = useState<Record<string, string>>({});
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const tieneTalles = !!product?.talleStock;
  const talles = tieneTalles ? Object.keys(product!.talleStock!) : [];
  const stockTalle = tieneTalles && talle ? (product!.talleStock![talle] ?? 0) : 0;
  const stock = tieneTalles ? stockTalle : 999;
  const precioUnitario = product?.price ?? 0;
  const subtotal = precioUnitario * cantidad;

  /* Opciones genéricas (Color/Modelo). Distinto del talle: sin stock. */
  const grupos = product?.options ?? [];
  const tieneOpciones = grupos.length > 0;
  const opcionesCompletas = grupos.every((g) => !!opciones[g.label]);

  /* Variante auto-descriptiva que se guarda en el carrito y va al WhatsApp:
     "Talle L" (camiseta) · "Negro Mate - iPhone 13" (opciones) · "" (sin nada) */
  const variante = tieneTalles
    ? talle
      ? `Talle ${talle}`
      : ""
    : tieneOpciones
    ? grupos.map((g) => opciones[g.label]).join(" - ")
    : "";

  /* Se puede agregar si están completas las selecciones obligatorias */
  const puedeAgregar = tieneTalles
    ? !!talle && stockTalle > 0
    : tieneOpciones
    ? opcionesCompletas
    : true;

  const showFeedback = agregado || justAdded === product?.name;

  /* Reset estado al cambiar de producto */
  useEffect(() => {
    setTalle("");
    setOpciones({});
    setCantidad(1);
    setAgregado(false);
  }, [product?.id]);

  /* Reset cantidad cuando cambia talle */
  useEffect(() => {
    if (tieneTalles) {
      if (talle && stockTalle > 0) {
        setCantidad((c) => Math.min(c, stockTalle));
      } else {
        setCantidad(1);
      }
    }
  }, [talle, tieneTalles, stockTalle]);

  const restar = () => setCantidad((c) => Math.max(1, c - 1));
  const sumar = () => setCantidad((c) => Math.min(stock, c + 1));

  const agregarAlCarrito = () => {
    addItem({
      productId: product!.id,
      name: product!.name,
      image: product!.image,
      price: product!.price!,
      variante,
      cantidad,
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  const consultarWhatsApp = () => {
    const msg = `Hola! Quiero consultar sobre: ${product!.name}${variante ? ` - ${variante}` : ""} — x${cantidad} — $${subtotal.toLocaleString("es-AR")}`;
    window.open(`${contactConfig.whatsappLink}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const categoriaLabels: Record<string, string> = {
    paquetes: "Paquetes de Figuritas",
    albumes: "Álbumes",
    indumentaria: "Indumentaria",
    "accesorios-apple": "Accesorios Apple",
  };
  const categoriaLabel = product ? (categoriaLabels[product.category] || product.category) : "";

  if (!product || !isOpen) return null;

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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="font-archivo fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-[var(--line)] bg-[var(--navy)] shadow-2xl"
          >
            {/* Header con imagen de fondo */}
            <div className="relative h-64 shrink-0 overflow-hidden bg-gradient-to-br from-[#12225f] to-[#0a1550] sm:h-72">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[var(--navy)]/30 to-transparent" />

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(5,12,46,0.85)] text-[var(--ink)] backdrop-blur-md transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Badge categoría */}
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[rgba(5,12,46,0.85)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--mut)] backdrop-blur-md">
                  <Star className="h-3 w-3 text-[var(--blue-l)]" />
                  {categoriaLabel}
                </span>
              </div>

              {/* Nombre y precio sobre la imagen */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-xl font-black leading-tight text-white drop-shadow-lg sm:text-2xl">
                  {product.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-white/75">{product.description}</p>
              </div>
            </div>

            {/* Botones arriba: WhatsApp + Carrito */}
            <div className="space-y-2 border-b border-[var(--line)] px-5 pb-3 pt-4">
              <button
                onClick={consultarWhatsApp}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#25a35a] text-sm font-bold text-white transition hover:-translate-y-px hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </button>
              <button
                onClick={agregarAlCarrito}
                disabled={!puedeAgregar}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-sm font-bold transition ${
                  showFeedback
                    ? "bg-green-500 text-white"
                    : !puedeAgregar
                    ? "cursor-not-allowed border border-[var(--line)] bg-white/[0.05] text-[var(--mut)]"
                    : "cursor-pointer bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-white hover:-translate-y-px hover:brightness-110"
                }`}
              >
                {showFeedback ? (
                  <><Check className="h-4 w-4" /> Agregado al carrito</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" /> Agregar al carrito</>
                )}
              </button>
              <p className="text-center text-[10px] text-[var(--mut)]">
                Solo si vas a comprar este producto
              </p>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Precio grande */}
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-white">
                  ${precioUnitario.toLocaleString("es-AR")}
                </span>
                <span className="mb-0.5 text-sm text-[var(--mut)]">
                  {tieneTalles || tieneOpciones ? "por unidad" : "por pack"}
                </span>
              </div>

              {/* Info de envío */}
              <div className="flex items-center gap-2 text-sm text-[var(--mut)]">
                <Truck className="h-4 w-4 text-[var(--blue-l)]" />
                Envíos a todo el país
              </div>

              {/* Selector de talles */}
              {tieneTalles && (
                <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Ruler className="h-4 w-4 text-[var(--blue-l)]" />
                    Seleccioná tu talle
                    <span className="text-xs text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {talles.map((t) => {
                      const stockT = product!.talleStock![t] ?? 0;
                      const agotado = stockT === 0;
                      const seleccionado = talle === t;
                      return (
                        <button
                          key={t}
                          onClick={() => { if (!agotado) setTalle(t); }}
                          disabled={agotado}
                          className={`relative flex min-w-[60px] flex-col items-center gap-0.5 rounded-xl border-2 px-4 py-3 transition-all ${
                            agotado
                              ? "cursor-not-allowed border-[var(--line)] bg-white/[0.03] opacity-50"
                              : seleccionado
                              ? "scale-105 border-[var(--blue-l)] bg-[var(--blue)] text-white shadow-[0_8px_20px_rgba(11,62,204,0.4)]"
                              : "cursor-pointer border-[var(--line)] text-[var(--ink)] hover:border-[var(--blue-l)] hover:bg-white/[0.04]"
                          }`}
                        >
                          {agotado && (
                            <Ban className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-[var(--navy)] text-red-400" />
                          )}
                          <span className={`text-base font-extrabold ${seleccionado ? "text-white" : agotado ? "text-[var(--mut)] line-through" : "text-white"}`}>
                            {t}
                          </span>
                          <span className={`text-[10px] font-semibold ${
                            seleccionado ? "text-white/80" : agotado ? "text-red-400" : "text-[var(--mut)]"
                          }`}>
                            {agotado ? "Agotado" : `Stock: ${stockT}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selectores de opciones (Color / Modelo) — sin stock */}
              {tieneOpciones && grupos.map((grupo) => (
                <div key={grupo.label}>
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Star className="h-4 w-4 text-[var(--blue-l)]" />
                    {grupo.label}
                    <span className="text-xs text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {grupo.values.map((v) => {
                      const seleccionado = opciones[grupo.label] === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setOpciones((prev) => ({ ...prev, [grupo.label]: v }))}
                          className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                            seleccionado
                              ? "scale-105 border-[var(--blue-l)] bg-[var(--blue)] text-white shadow-[0_8px_20px_rgba(11,62,204,0.4)]"
                              : "cursor-pointer border-[var(--line)] text-[var(--ink)] hover:border-[var(--blue-l)] hover:bg-white/[0.04]"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Selector de cantidad */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Package className="h-4 w-4 text-[var(--blue-l)]" />
                  Cantidad de {tieneTalles || tieneOpciones ? "unidades" : "packs"}
                </label>
                <div className={`flex items-center gap-4${tieneTalles && (!talle || stockTalle === 0) ? " pointer-events-none opacity-40" : ""}`}>
                  <div className="flex items-center">
                    <button
                      onClick={restar}
                      className="flex h-11 w-11 cursor-pointer select-none items-center justify-center rounded-l-xl border border-[var(--line)] bg-white/[0.04] text-xl font-bold text-[var(--ink)] transition-colors hover:bg-white/10 active:scale-95"
                    >
                      −
                    </button>
                    <div className="flex h-11 min-w-[64px] items-center justify-center border-y border-[var(--line)] bg-white/[0.02] px-4">
                      <span className="text-xl font-extrabold tabular-nums text-white">{cantidad}</span>
                    </div>
                    <button
                      onClick={sumar}
                      className="flex h-11 w-11 cursor-pointer select-none items-center justify-center rounded-r-xl bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-xl font-bold text-white transition hover:brightness-110 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-[var(--mut)]">Subtotal</p>
                    <p className="text-2xl font-black text-white">${subtotal.toLocaleString("es-AR")}</p>
                  </div>
                </div>
              </div>

              {/* Descripción completa */}
              <div className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-4">
                <h3 className="mb-1 text-sm font-bold text-white">Descripción</h3>
                <p className="text-sm leading-relaxed text-[var(--mut)]">{product.description}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
