import { Gift, Zap, CupSoda, Smartphone } from "lucide-react";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════
   ICONOS Y TÍTULOS POR CATEGORÍA (compartidos)
   Las claves tienen que coincidir con el campo `category` de products.ts.
   ═══════════════════════════════════════════════ */
export const categoryIcons: Record<string, ReactNode> = {
  accesorios: <Gift className="h-6 w-6" />,
  vapers: <Zap className="h-6 w-6" />,
  termos: <CupSoda className="h-6 w-6" />,
  "accesorios-apple": <Smartphone className="h-6 w-6" />,
};

export const categoryTitles: Record<string, string> = {
  accesorios: "Promos",
  vapers: "Vapers",
  termos: "Termos",
  "accesorios-apple": "Accesorios Apple",
};
