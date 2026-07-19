import { NextResponse } from "next/server";
import { leerStock } from "@/lib/stock";

/* ══════════════════════════════════════════════════════════════
   GET /api/stock — lectura pública del stock (solo lectura)

   La consume el sitio público para mostrar "quedan N" / "Agotado".
   No expone precios ni datos del catálogo: solo cantidades.

   Nunca se cachea: el stock tiene que verse igual para todos y al
   instante después de que el panel lo modifique.
   ══════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stock = await leerStock();
    return NextResponse.json(
      { ok: true, stock },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    /* Fallamos CERRADO: si la base no responde, el front trata todo como
       agotado. Preferimos frenar una venta antes que prometer stock que
       no existe. */
    console.error("[/api/stock] error leyendo stock:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer el stock" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
