import { Package, BookOpen, Shirt, Gift, Smartphone } from "lucide-react";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════
   ICONOS Y TÍTULOS POR CATEGORÍA (compartidos)
   ═══════════════════════════════════════════════ */
export const categoryIcons: Record<string, ReactNode> = {
  paquetes: <Package className="h-6 w-6" />,
  albumes: <BookOpen className="h-6 w-6" />,
  indumentaria: <Shirt className="h-6 w-6" />,
  accesorios: <Gift className="h-6 w-6" />,
  "accesorios-apple": <Smartphone className="h-6 w-6" />,
};

export const categoryTitles: Record<string, string> = {
  paquetes: "Paquetes de Figuritas",
  albumes: "Álbumes",
  indumentaria: "Indumentaria",
  accesorios: "Promos",
  "accesorios-apple": "Accesorios Apple",
};
