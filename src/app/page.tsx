"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { FiltrosProvider } from "@/lib/filtros-context";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import Catalogo from "@/components/home/Catalogo";
import ContactSection from "@/components/home/ContactSection";
import Footer from "@/components/home/Footer";
import CartPanel from "@/components/home/CartPanel";
import ProductModal from "@/components/home/ProductModal";
import ScrollToTop from "@/components/home/ScrollToTop";

/* ═══════════════════════════════════════════════
   MAIN PAGE — Compone la landing a partir de los
   componentes de src/components/home/

   El provider va acá y no en el layout raíz porque los filtros son del
   catálogo: /carrito no los necesita.
   ═══════════════════════════════════════════════ */
export default function Home() {
  return (
    <FiltrosProvider>
      <HomeContenido />
    </FiltrosProvider>
  );
}

function HomeContenido() {
  /* El carrito y el modal siguen siendo estado local de la home; los
     filtros (incluida la búsqueda) viven en el contexto. */
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--navy)]">
      <Navbar onCartToggle={() => setCartOpen(true)} />

      <main className="flex-1">
        <Hero />
        <Catalogo onProductClick={setSelectedProduct} />
        <ContactSection />
      </main>

      <Footer />
      <CartPanel
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
      <ScrollToTop />
    </div>
  );
}
