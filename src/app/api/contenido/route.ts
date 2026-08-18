import { NextResponse } from "next/server";
import { leerOverrides } from "@/lib/contenido-db";

/* ══════════════════════════════════════════════════════════════
   GET /api/contenido — lectura pública de los overrides (solo lectura)

   Devuelve únicamente lo EDITADO desde el panel (descripciones y precios
   por cantidad). El catálogo completo sigue viniendo de products.ts, que
   viaja en el bundle: acá no se expone el catálogo entero.

   No exporta POST/PUT/DELETE a propósito: Next responde 405, igual que
   /api/stock.

   ⚠️ FALLA ABIERTO. Si esto devuelve 503, el navegador se queda con los
   valores de products.ts y el sitio funciona igual. Es lo contrario a
   /api/stock, que falla CERRADO — ver la cabecera de contenido.ts.
   ══════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const overrides = await leerOverrides();
    return NextResponse.json(
      { ok: true, overrides },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    /* No es un error fatal: el front ya tiene los valores del código.
       Se loguea para poder enterarse, pero la web no se entera. */
    console.error("[/api/contenido] error leyendo overrides:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudieron leer los textos editados" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
