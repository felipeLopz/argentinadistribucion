"use client";

import { useState } from "react";
import { FiltrosProvider } from "@/lib/filtros-context";
import { useContenido } from "@/lib/contenido-context";
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

  /* Del modal se guarda el ID, no el objeto: así el detalle se relee del
     catálogo efectivo y toma las descripciones o los precios por cantidad
     que se hayan editado desde el panel, aunque hayan llegado con el modal
     ya abierto. Guardar el objeto dejaría una copia congelada. */
  const [idAbierto, setIdAbierto] = useState<string | null>(null);
  const { productoPorId } = useContenido();
  const selectedProduct = idAbierto ? productoPorId(idAbierto) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--navy)]">
      <Navbar onCartToggle={() => setCartOpen(true)} />

      <main className="flex-1">
        <Hero />
        <Catalogo onProductClick={(p) => setIdAbierto(p.id)} />
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
        onClose={() => setIdAbierto(null)}
      />
      <ScrollToTop />
    </div>
  );
}
