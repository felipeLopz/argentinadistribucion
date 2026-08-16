import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart-context";
import { StockProvider } from "@/lib/stock-context";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Tipografía del diseño "Estadio Nocturno" (variable font) */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

/* Título y descripción centralizados: los comparten el <title>, la tarjeta
   de Open Graph y la de Twitter, así no pueden quedar desalineados. */
const SITE_NAME = "Argentina Distributor";
const SITE_TITLE = "Argentina Distributor | Figuritas del Mundial & Merchandising";
const SITE_DESCRIPTION =
  "Tienda online de figuritas del Mundial y merchandising oficial de Argentina. Figuritas Panini, camisetas, accesorios y coleccionables. Envios a todo el pais.";

export const metadata: Metadata = {
  /* Necesaria para que las imágenes OG con rutas relativas
     (las genera opengraph-image.tsx) resuelvan a URL absoluta. */
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  /* Tarjeta al compartir el link (WhatsApp, Instagram, Facebook…).
     La imagen la inyecta Next automáticamente desde opengraph-image.tsx. */
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  /* Twitter/X — la imagen viene de twitter-image.tsx */
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  keywords: [
    "figuritas mundial",
    "argentina merchandising",
    "panini qatar 2022",
    "camiseta argentina",
    "seleccion argentina",
    "copa del mundo",
    "messi",
    "coleccionables futbol",
  ],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🇦🇷</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} antialiased bg-background text-foreground`}
      >
        <CartProvider>
          <StockProvider>
            {children}
            <Toaster />
          </StockProvider>
        </CartProvider>
      </body>
    </html>
  );
}