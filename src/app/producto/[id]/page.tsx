"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  Truck,
  Star,
  Trophy,
  Ruler,
  Ban,
  ShoppingCart,
  Check,
  ShieldCheck,
  Package,
} from "lucide-react";
import { products, contactConfig, storeName } from "@/lib/products";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";

export default function ProductoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const product = useMemo(() => products.find((p) => p.id === id), [id]);

  /* ─── Estado ─── */
  const [talle, setTalle] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const { addItem } = useCart();

  /* ─── Transición de entrada (muy corta) ─── */
  const [transicion, setTransicion] = useState(true);
  const [fase, setFase] = useState<"entrando" | "unido" | "saliendo" | "listo">("entrando");

  useEffect(() => {
    const t1 = setTimeout(() => setFase("unido"), 150);
    const t2 = setTimeout(() => setFase("saliendo"), 250);
    const t3 = setTimeout(() => {
      setFase("listo");
      setTransicion(false);
    }, 400);
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

  /* ─── Agregar al carrito ─── */
  const agregarAlCarrito = () => {
    if (tieneTalles && !talle) return;
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

  /* ─── Consultar por WhatsApp ─── */
  const consultarWhatsApp = () => {
    const msg = `Hola! Quiero consultar por el producto: ${product.name}${tieneTalles ? " (necesito saber talles disponibles)" : ""}. Precio: $${precioUnitario.toLocaleString("es-AR")}. Gracias!`;
    window.open(
      `${contactConfig.whatsappLink}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

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
              transition={{ duration: 0.15, ease: [0.76, 0, 0.24, 1] }}
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
              transition={{ duration: 0.15, ease: [0.76, 0, 0.24, 1] }}
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
                transition={{ duration: 0.1 }}
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
                transition={{ duration: 0.15, ease: "easeOut" }}
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
                      transition={{ duration: 0.15, ease: "easeOut" }}
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
        transition={{ duration: 0.15, delay: 0.05 }}
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

        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* ═══ BOTONES ARRIBA ═══ */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={consultarWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white h-12 py-3 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
              Consultar por WhatsApp
            </button>
            <button
              onClick={agregarAlCarrito}
              disabled={tieneTalles && !talle}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full h-12 py-3 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                agregado
                  ? "bg-green-500 text-white"
                  : "bg-[#0033A0] hover:bg-[#0046D6] text-white"
              } ${tieneTalles && !talle ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {agregado ? (
                <><Check className="h-5 w-5" /> Agregado!</>
              ) : (
                <><ShoppingCart className="h-5 w-5" /> Agregar al carrito</>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mb-6">Solo si vas a comprar este producto</p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* COLUMNA IZQUIERDA: Imagen + Info */}
            <div className="space-y-6">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[#0033A0]/5 to-[#D4AF37]/5 shadow-lg">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0033A0] text-white px-3 py-1.5 text-xs font-bold shadow-md">
                    <Star className="h-3 w-3 text-[#D4AF37]" />
                    {categoriaLabel}
                  </span>
                </div>
              </div>

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
            </div>

            {/* COLUMNA DERECHA: Talle + Cantidad */}
            <div className="space-y-6">
              {/* SELECTOR DE TALLES */}
              {tieneTalles && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Ruler className="h-4 w-4 text-[#0033A0]" />
                    Seleccioná tu talle
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {talles.map((t) => {
                      const agotado = (product.talleStock![t] ?? 0) === 0;
                      const seleccionado = talle === t;
                      return (
                        <button
                          key={t}
                          onClick={() => { if (!agotado) setTalle(t); }}
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

              {/* Info de compra */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 space-y-2">
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0033A0]" /> Envíos a toda Argentina</p>
                <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> Consultá cualquier duda por WhatsApp</p>
                <p>Para finalizar la compra, agregá productos al carrito y completá el formulario al final.</p>
              </div>
            </div>
          </div>
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