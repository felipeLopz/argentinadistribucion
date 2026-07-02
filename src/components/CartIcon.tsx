"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link href="/carrito" className="fixed bottom-6 right-6 z-[90] group">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0033A0] text-white shadow-xl shadow-[#0033A0]/30 transition-shadow group-hover:shadow-2xl group-hover:shadow-[#0033A0]/40"
      >
        <ShoppingCart className="h-6 w-6" />
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#D4AF37] text-[11px] font-extrabold text-white px-1.5 shadow-md"
            >
              {totalItems > 99 ? "99+" : totalItems}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}