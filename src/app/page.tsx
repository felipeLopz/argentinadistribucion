"use client";

import { useState } from "react";
import { type Product } from "@/lib/products";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import ProductGrid from "@/components/home/ProductGrid";
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--navy)]">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartToggle={() => setCartOpen(true)}
      />

      <main className="flex-1">
        <Hero />

        <ProductGrid sectionId="paquetes" category="paquetes" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="albumes" category="albumes" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="indumentaria" category="indumentaria" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="accesorios" category="accesorios" searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        <ProductGrid sectionId="accesorios-apple" category="accesorios-apple" searchQuery={searchQuery} onProductClick={setSelectedProduct} />

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
