"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ShoppingCart, Check, Star, Truck, Ban, Package, AlertTriangle, Tag } from "lucide-react";
import { contactConfig, imagenDeOpciones, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { useStock } from "@/lib/stock-context";
import { esGrupoDeStock, gruposDeStock, llevaStock } from "@/lib/stock-config";
import { useDialogoAccesible } from "@/hooks/use-dialogo-accesible";
import { categoryTitles } from "./categories";
import SinFoto from "./SinFoto";
import BadgeProducto from "./BadgeProducto";
import { usePromocion } from "@/hooks/use-promocion";

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
  const { stockDeClave, stockDeOpciones, stockTotal, estado: estadoStock } = useStock();
  const [opciones, setOpciones] = useState<Record<string, string>>({});
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const [avisoTope, setAvisoTope] = useState(false);

  const precioUnitario = product?.price ?? 0;

  /* ─── Promo por cantidad (pack) ───
     El precio NO es unitario: sale de la tabla packPrecios según cuántas
     unidades entran al pack. Pasado el tope se deriva a WhatsApp. */
  const packPrecios = product?.packPrecios;
  const esPromoPack = !!packPrecios && packPrecios.length > 0;
  const topePack = packPrecios?.length ?? 0;
  /* Con qué palabra se nombra cada ítem del pack. Genérico por defecto,
     para que una promo cargada desde el panel no diga "3 fundas". */
  const sustantivoPack = product?.sustantivoPack ?? ["unidad", "unidades"];

  const subtotal = esPromoPack
    ? packPrecios![Math.min(Math.max(cantidad, 1), topePack) - 1]
    : precioUnitario * cantidad;

  /* ─── Foto que se está mostrando ───
     En los productos con foto por variante (las fundas) cambia al elegir
     el color; en el resto es siempre la principal. Es la MISMA que entra
     al carrito, así que lo que se ve al agregar es lo que después aparece
     en el panel del carrito y en /carrito. */
  const imagenActual = product ? imagenDeOpciones(product, opciones) : undefined;

  /* Opciones genéricas (Color/Modelo) */
  const grupos = product?.options ?? [];
  const tieneOpciones = grupos.length > 0;
  const opcionesCompletas = grupos.every((g) => !!opciones[g.label]);

  /* ─── Stock de la selección actual ───
     null = todavía no se sabe (cargando, o falta elegir opciones).
     0 = agotado. Ojo con la granularidad mixta: si un producto llevara el
     stock con menos detalle que sus opciones (ej. sólo por Modelo aunque
     ofrezca Color y Modelo), lo resuelve stock-config. */
  const seleccionCompleta = tieneOpciones ? opcionesCompletas : true;

  /* Productos siempre disponibles: no se consulta la base (no tienen fila) */
  const conStock = product ? llevaStock(product) : true;
  const stockActual: number | null = !product || !conStock
    ? null
    : tieneOpciones
    ? opcionesCompletas
      ? stockDeOpciones(product, opciones)
      : null
    : stockDeClave(product.id, "");

  const agotado = conStock && stockActual === 0;

  /* Promoción resuelta (badge, oferta, urgencia). Se calcula con el stock
     TOTAL del producto, igual que la card, para que digan lo mismo.
     Va antes de cualquier return temprano: el orden no debe cambiar. */
  const promo = usePromocion(product, product && conStock ? stockTotal(product.id) : null);
  /* Tope del selector: el stock disponible, o el tope del pack en las
     promos por cantidad. Sin control de stock, no hay techo. */
  const stock = !conStock ? Number.MAX_SAFE_INTEGER : stockActual ?? 1;

  /* Variante auto-descriptiva que se guarda en el carrito y va al WhatsApp:
     "Negro" (opciones) · "3 fundas" (promo por cantidad) · "" (sin nada).

     El sustantivo sale de `sustantivoPack` y NO está hardcodeado, porque
     ahora una promo por cantidad se puede cargar desde el panel sobre
     cualquier producto: un cable diría "3 fundas" en el carrito y en el
     mensaje de WhatsApp. Para la Silicone Case el texto es idéntico al de
     antes, porque su sustantivo es exactamente ["funda", "fundas"].
     En la promo es lo que le da identidad propia a cada pack: dos packs de
     distinto tamaño son dos ítems separados en el carrito. */
  const variante = esPromoPack
    ? `${cantidad} ${cantidad === 1 ? sustantivoPack[0] : sustantivoPack[1]}`
    : tieneOpciones
    ? grupos.map((g) => opciones[g.label]).join(" - ")
    : "";

  /* Se puede agregar si están completas las selecciones obligatorias Y hay
     stock confirmado. Sin dato de stock NO se habilita (fallamos cerrado),
     salvo que el producto directamente no lleve stock. */
  const puedeAgregar =
    seleccionCompleta && (!conStock || (stockActual !== null && stockActual > 0));

  const showFeedback = agregado || justAdded === product?.name;

  /* Reset estado al cambiar de producto */
  useEffect(() => {
    setOpciones({});
    setCantidad(1);
    setAgregado(false);
    setAvisoTope(false);
  }, [product?.id]);

  /* La cantidad nunca puede superar el stock disponible.
     Los productos sin stock quedan afuera: su cantidad la manda el usuario
     (y en las promos, el tope del pack). */
  useEffect(() => {
    if (!conStock) return;
    if (stockActual !== null && stockActual > 0) {
      setCantidad((c) => Math.min(c, stockActual));
    } else {
      setCantidad(1);
    }
  }, [stockActual, conStock]);

  const restar = () => {
    setAvisoTope(false);
    setCantidad((c) => Math.max(1, c - 1));
  };

  const sumar = () => {
    /* Promo: el pack no pasa de su tope. Al intentarlo, se avisa y se
       ofrece WhatsApp en vez de dejar armar un pack sin precio. */
    if (esPromoPack && cantidad >= topePack) {
      setAvisoTope(true);
      return;
    }
    setCantidad((c) => Math.min(stock, c + 1));
  };

  const agregarAlCarrito = () => {
    /* La promo entra como UN ítem con el precio del pack ya resuelto: el
       carrito solo hace precio × cantidad, y acá la cantidad es 1 pack.

       La foto que se guarda es la del COLOR ELEGIDO, no la principal: el
       ítem ya dice "Fucsia" en la variante, y mostrarle la funda negra al
       lado sería contradecirse. Se resuelve ACÁ, antes de llamar a
       `addItem`, para no tocar la lógica del carrito: el carrito sigue
       guardando un string y sin saber que existen fotos por variante. */
    addItem(
      esPromoPack
        ? {
            productId: product!.id,
            name: product!.cartName ?? product!.name,
            /* El carrito guarda un string; "" = todavía sin foto, y las
               vistas del carrito muestran el placeholder. */
            image: imagenActual ?? "",
            price: subtotal,
            variante,
            cantidad: 1,
          }
        : {
            productId: product!.id,
            name: product!.cartName ?? product!.name,
            image: imagenActual ?? "",
            price: product!.price!,
            variante,
            cantidad,
          }
    );
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  const consultarWhatsApp = () => {
    /* En la promo la variante ya dice cuántas unidades son ("3 fundas"),
       así que no se repite el "x3". */
    const msg = esPromoPack
      ? `Hola! Quiero consultar sobre: ${product!.name} — ${variante} — $${subtotal.toLocaleString("es-AR")}`
      : `Hola! Quiero consultar sobre: ${product!.name}${variante ? ` - ${variante}` : ""} — x${cantidad} — $${subtotal.toLocaleString("es-AR")}`;
    window.open(`${contactConfig.whatsappLink}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  /* Aviso de tope: se pasa de la promo, se cierra por WhatsApp */
  const consultarPorMas = () => {
    const msg = `Hola! Quiero hacer precio por más de ${topePack} silicone case.`;
    window.open(`${contactConfig.whatsappLink}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const categoriaLabel = product ? categoryTitles[product.category] ?? product.category : "";

  /* Accesibilidad del diálogo (foco, Escape, focus trap).
     Va ANTES del return temprano para no alterar el orden de hooks.
     Se pasa la misma condición con la que el diálogo realmente se
     renderiza, así el foco entra recién cuando el panel existe. */
  const dialogoRef = useDialogoAccesible<HTMLDivElement>(isOpen && !!product, onClose);

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
            ref={dialogoRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-producto"
            tabIndex={-1}
            className="font-archivo fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-[var(--line)] bg-[var(--navy)] shadow-2xl outline-none"
          >
            {/* Botón cerrar — overlay fijo, siempre accesible aunque el
                contenido de abajo se scrollee (en mobile el panel cubre todo
                el ancho y no queda backdrop clickeable como alternativa). */}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(28,28,30,0.85)] text-[var(--ink)] backdrop-blur-md transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Todo el contenido scrollea junto: imagen, nombre, botones,
                selectores, cantidad y descripción — una sola pieza. */}
            <div className="flex-1 overflow-y-auto">
              {/* Header con imagen de fondo */}
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[var(--navy-3)] to-[#242427] sm:h-72">
                {imagenActual ? (
                  <Image
                    /* `key` para que React remonte el <Image> al cambiar de
                       color: sin eso Next puede quedarse con la anterior. */
                    key={imagenActual}
                    src={imagenActual}
                    alt={product.name}
                    fill
                    /* El panel mide max-w-lg (512px) y ocupa todo el ancho en mobile */
                    sizes="(max-width: 512px) 100vw, 512px"
                    className="object-cover"
                    /* Eager a propósito: la imagen sólo se monta cuando el usuario
                       abre el modal y es su contenido principal; con lazy podría
                       aparecer con retraso durante la animación de entrada. */
                    priority={false}
                    loading="eager"
                  />
                ) : (
                  <SinFoto size="lg" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[var(--navy)]/30 to-transparent" />

                {/* Badge de categoría + el de promoción, si hay */}
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[rgba(28,28,30,0.85)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--mut)] backdrop-blur-md">
                    <Star className="h-3 w-3 text-[var(--blue-l)]" />
                    {categoriaLabel}
                  </span>
                  {promo.badge && !agotado && <BadgeProducto badge={promo.badge} />}
                </div>

                {/* Nombre y precio sobre la imagen */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2
                    id="titulo-modal-producto"
                    className="text-xl font-black leading-tight text-white drop-shadow-lg sm:text-2xl"
                  >
                    {product.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-white/75">{product.description}</p>
                </div>
              </div>

              {/* Botones: WhatsApp + Carrito */}
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
                      : "cursor-pointer bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-[#1c1c1e] hover:-translate-y-px hover:brightness-110"
                  }`}
                >
                  {showFeedback ? (
                    <><Check className="h-4 w-4" /> Agregado al carrito</>
                  ) : agotado && seleccionCompleta ? (
                    <><Ban className="h-4 w-4" /> Agotado</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4" /> Agregar al carrito</>
                  )}
                </button>
                {conStock && estadoStock === "cargando" ? (
                  <p className="animate-pulse text-center text-[10px] font-semibold text-[var(--mut)]">
                    Verificando stock…
                  </p>
                ) : agotado && seleccionCompleta ? (
                  <p className="text-center text-[10px] font-semibold text-red-400">
                    Sin stock por el momento — podés consultarnos por WhatsApp
                  </p>
                ) : (
                  <p className="text-center text-[10px] text-[var(--mut)]">
                    Solo si vas a comprar este producto
                  </p>
                )}
              </div>

              {/* Resto del detalle */}
              <div className="space-y-5 px-5 py-4">
                {/* Precio. En la promo por cantidad no hay un precio único:
                    va la TABLA completa, con la fila elegida resaltada. */}
                {esPromoPack ? (
                  <div className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                      <Tag className="h-4 w-4 text-[var(--gold)]" />
                      Precio por cantidad
                    </h3>
                    <ul className="space-y-1.5">
                      {packPrecios!.map((precio, i) => {
                        const n = i + 1;
                        const elegida = n === cantidad;
                        return (
                          <li
                            key={n}
                            aria-current={elegida ? "true" : undefined}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                              elegida
                                ? "border-[var(--blue-l)] bg-[rgba(196,191,183,0.15)] text-white"
                                : "border-transparent text-[var(--mut)]"
                            }`}
                          >
                            <span className="font-semibold">
                              {n} {n === 1 ? sustantivoPack[0] : sustantivoPack[1]}
                            </span>
                            <span className={`font-extrabold tabular-nums ${elegida ? "text-white" : "text-[var(--ink)]"}`}>
                              ${precio.toLocaleString("es-AR")}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--mut)]">
                      El precio es por el pack completo. ¿Querés más de {topePack}?
                      Podés sumar otro pack, o consultarnos para hacer precio.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-black text-white">
                        ${precioUnitario.toLocaleString("es-AR")}
                      </span>
                      {/* Precio viejo tachado, cuando hay oferta */}
                      {promo.oferta && !agotado && (
                        <span className="mb-1 text-base font-semibold text-[var(--promo)] line-through">
                          ${promo.oferta.anterior.toLocaleString("es-AR")}
                        </span>
                      )}
                      <span className="mb-0.5 text-sm text-[var(--mut)]">
                        {tieneOpciones ? "por unidad" : "por pack"}
                      </span>
                    </div>
                    {promo.oferta && !agotado && (
                      <span className="mt-2 inline-flex rounded-[8px] bg-[rgba(63,184,196,0.14)] px-3 py-1.5 text-[13px] font-bold text-[var(--promo)]">
                        Ahorrás ${promo.oferta.ahorro.toLocaleString("es-AR")} ({promo.oferta.porcentaje}%)
                      </span>
                    )}
                  </div>
                )}

                {/* Info de envío */}
                <div className="flex items-center gap-2 text-sm text-[var(--mut)]">
                  <Truck className="h-4 w-4 text-[var(--blue-l)]" />
                  Envíos a todo el país
                </div>

                {/* Selectores de opciones.
                    Solo los grupos que DEFINEN stock muestran disponibilidad:
                    si un producto llevara stock sólo por Modelo, sería ese
                    grupo y no Color. */}
                {tieneOpciones && grupos.map((grupo) => {
                  const esStock = esGrupoDeStock(product!, grupo.label);
                  /* Para saber el stock de un valor candidato, los demás grupos
                     que definen stock ya tienen que estar elegidos. */
                  const otrosListos = gruposDeStock(product!).every(
                    (g) => g === grupo.label || !!opciones[g]
                  );
                  return (
                    <div key={grupo.label}>
                      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                        <Star className="h-4 w-4 text-[var(--blue-l)]" />
                        {grupo.label}
                        <span className="text-xs text-red-400">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {grupo.values.map((v) => {
                          const seleccionado = opciones[grupo.label] === v;
                          const stockV =
                            esStock && otrosListos
                              ? stockDeOpciones(product!, { ...opciones, [grupo.label]: v })
                              : null;
                          const agotadoV = stockV === 0;
                          return (
                            <button
                              key={v}
                              onClick={() => {
                                if (!agotadoV) setOpciones((prev) => ({ ...prev, [grupo.label]: v }));
                              }}
                              disabled={agotadoV}
                              className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                                agotadoV
                                  ? "cursor-not-allowed border-[var(--line)] bg-white/[0.03] opacity-50"
                                  : seleccionado
                                  ? "scale-105 border-[var(--blue-l)] bg-[var(--blue)] text-[#1c1c1e] shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
                                  : "cursor-pointer border-[var(--line)] text-[var(--ink)] hover:border-[var(--blue-l)] hover:bg-white/[0.04]"
                              }`}
                            >
                              {agotadoV && (
                                <Ban className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-[var(--navy)] text-red-400" />
                              )}
                              <span className={agotadoV ? "text-[var(--mut)] line-through" : ""}>{v}</span>
                              {esStock && (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    seleccionado
                                      ? "text-white/80"
                                      : agotadoV
                                      ? "text-red-400"
                                      : "text-[var(--mut)]"
                                  }`}
                                >
                                  {agotadoV ? "Agotado" : stockV === null ? "…" : `Stock: ${stockV}`}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Selector de cantidad */}
                <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Package className="h-4 w-4 text-[var(--blue-l)]" />
                    {esPromoPack
                      ? `Cantidad de ${sustantivoPack[1]}`
                      : `Cantidad de ${tieneOpciones ? "unidades" : "packs"}`}
                  </label>
                  <div className={`flex items-center gap-4${!puedeAgregar ? " pointer-events-none opacity-40" : ""}`}>
                    <div className="flex items-center">
                      <button
                        onClick={restar}
                        aria-label="Restar"
                        className="flex h-11 w-11 cursor-pointer select-none items-center justify-center rounded-l-xl border border-[var(--line)] bg-white/[0.04] text-xl font-bold text-[var(--ink)] transition-colors hover:bg-white/10 active:scale-95"
                      >
                        −
                      </button>
                      <div className="flex h-11 min-w-[64px] items-center justify-center border-y border-[var(--line)] bg-white/[0.02] px-4">
                        <span className="text-xl font-extrabold tabular-nums text-white">{cantidad}</span>
                      </div>
                      <button
                        onClick={sumar}
                        aria-label="Sumar"
                        className="flex h-11 w-11 cursor-pointer select-none items-center justify-center rounded-r-xl bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] text-xl font-bold text-[#1c1c1e] transition hover:brightness-110 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-[var(--mut)]">
                        {esPromoPack ? "Precio del pack" : "Subtotal"}
                      </p>
                      <p className="text-2xl font-black text-white">${subtotal.toLocaleString("es-AR")}</p>
                    </div>
                  </div>

                  {/* Tope de la promo: no se arma un pack más grande, se
                      deriva a WhatsApp para arreglar precio. */}
                  {avisoTope && (
                    <div
                      role="alert"
                      className="mt-3 rounded-2xl border border-[var(--gold)]/50 bg-[rgba(184,179,171,0.12)] p-4"
                    >
                      <p className="flex items-start gap-2 text-sm font-bold text-[var(--gold-l)]">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Sobrepasaste la promo
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--mut)]">
                        La promo llega hasta {topePack} {sustantivoPack[1]} por pack. Si querés hacer
                        precio con más, consultanos por WhatsApp. También podés agregar
                        este pack y armar otro.
                      </p>
                      <button
                        onClick={consultarPorMas}
                        className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#25a35a] text-sm font-bold text-white transition hover:-translate-y-px hover:brightness-110"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Consultar por más de {topePack}
                      </button>
                    </div>
                  )}
                </div>

                {/* Descripción completa */}
                <div className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-4">
                  <h3 className="mb-1 text-sm font-bold text-white">Descripción</h3>
                  <p className="text-sm leading-relaxed text-[var(--mut)]">{product.description}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
