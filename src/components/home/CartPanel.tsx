"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";

/* ═══════════════════════════════════════════════
   CART PANEL — Preview lateral (theme "Estadio Nocturno")
   ═══════════════════════════════════════════════ */
export default function CartPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, totalItems, totalPrice, removeItem } = useCart();
  const router = useRouter();

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

          {/* Panel lateral */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="font-archivo fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--navy)] text-[var(--ink)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)]">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                Mi Carrito ({totalItems})
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--mut)] transition-colors hover:bg-white/10 hover:text-[var(--gold)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/5">
                    <ShoppingCart className="h-8 w-8 text-[var(--mut)]" />
                  </div>
                  <p className="mt-4 font-medium text-[var(--mut)]">Tu carrito está vacío</p>
                  <p className="mt-1 text-sm text-[var(--mut)]/70">Agregá productos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.productId}-${item.variante}`}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="flex gap-3 rounded-xl border border-[var(--line)] bg-gradient-to-b from-[rgba(15,26,80,0.6)] to-[rgba(10,18,55,0.4)] p-3"
                      >
                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg bg-[#12225f] object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate text-sm font-semibold text-white">{item.name}</h4>
                          {item.variante && (
                            <span className="rounded-md border border-[var(--line)] bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-bold text-[var(--blue-l)]">{item.variante}</span>
                          )}
                          <p className="mt-1 text-xs text-[var(--mut)]">
                            ${item.price.toLocaleString("es-AR")} c/u · x{item.cantidad}
                          </p>
                          <p className="text-sm font-bold text-[var(--blue-l)]">
                            ${(item.price * item.cantidad).toLocaleString("es-AR")}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variante)}
                          className="flex h-8 w-8 items-center justify-center self-start rounded-full text-[var(--mut)] transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                          title="Eliminar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer del carrito */}
            {items.length > 0 && (
              <div className="space-y-3 border-t border-[var(--line)] p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--mut)]">Total</span>
                  <span className="text-xl font-black text-white">${totalPrice.toLocaleString("es-AR")}</span>
                </div>
                <button
                  onClick={() => { onClose(); router.push("/carrito"); }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] font-semibold text-white shadow-lg transition hover:-translate-y-px hover:brightness-110 cursor-pointer"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Finalizar compra
                </button>
                <button
                  onClick={onClose}
                  className="h-10 w-full rounded-full border border-[var(--line)] font-medium text-[var(--ink)] transition-colors hover:bg-white/[0.06] cursor-pointer"
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
