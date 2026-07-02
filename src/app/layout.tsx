import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart-context";
import CartIcon from "@/components/CartIcon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Argentina Distributor | Figuritas del Mundial & Merchandising",
  description:
    "Tienda online de figuritas del Mundial y merchandising oficial de Argentina. Figuritas Panini, camisetas, accesorios y coleccionables. Envios a todo el pais.",
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
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <CartProvider>
          {children}
          <CartIcon />
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}