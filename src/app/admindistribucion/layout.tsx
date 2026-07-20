import type { Metadata } from "next";

/* Panel privado: nunca debe indexarse.
   A propósito NO se agrega un robots.txt con "Disallow: /admindistribucion":
   eso le anunciaría la ruta a cualquiera que lea el archivo. Al no estar
   enlazada desde ningún lado, el noindex alcanza. */
export const metadata: Metadata = {
  title: "Gestión de stock",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-archivo min-h-screen bg-[var(--navy)] text-[var(--ink)]">{children}</div>;
}
