"use client";

import { useState } from "react";
import { products, type Product } from "@/lib/products";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import ProductGrid, { coincideBusqueda } from "@/components/home/ProductGrid";
import SearchEmptyState from "@/components/home/SearchEmptyState";
import ContactSection from "@/components/home/ContactSection";
import Footer from "@/components/home/Footer";
import CartPanel from "@/components/home/CartPanel";
import ProductModal from "@/components/home/ProductModal";
import ScrollToTop from "@/components/home/ScrollToTop";

/* ═══════════════════════════════════════════════
   MAIN PAGE — Compone la landing a partir de los
   componentes de src/components/home/
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  /* Cada sección se oculta sola cuando no tiene coincidencias, así que si
     NINGUNA categoría matchea la página quedaría vacía entre el Hero y
     Contacto. En ese caso mostramos un estado vacío explícito. */
  const sinResultados =
    !!searchQuery && !products.some((p) => coincideBusqueda(p, searchQuery));

  return (
    <div className="min-h-screen flex flex-col bg-[var(--navy)]">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartToggle={() => setCartOpen(true)}
      />

      <main className="flex-1">
        <Hero />

        {/* El orden de estas secciones tiene que ir igual que `navSections`
            en products.ts, que es de donde sale el menú. */}
        <ProductGrid sectionId="accesorios" category="accesorios" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="vapers" category="vapers" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="termos" category="termos" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="accesorios-apple" category="accesorios-apple" searchQuery={searchQuery} onProductClick={setSelectedProduct} />

        {sinResultados && (
          <SearchEmptyState query={searchQuery} onClear={() => setSearchQuery("")} />
        )}

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
