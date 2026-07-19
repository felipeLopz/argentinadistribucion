import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sincronizarConCatalogo } from "@/lib/stock";

/* ══════════════════════════════════════════════════════════════
   POST /api/stock/seed — carga inicial / sincronización con el catálogo

   Crea la tabla si no existe e inserta las filas que falten según
   products.ts. Es IDEMPOTENTE y NO PISA valores existentes: se puede
   correr de nuevo cada vez que se agregan productos al catálogo.

   Protegida por SEED_TOKEN (variable de entorno de servidor). Es una
   operación de mantenimiento, no forma parte del sitio público.
   ══════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

/** Comparación en tiempo constante para no filtrar el token por timing. */
function tokenValido(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const esperado = process.env.SEED_TOKEN;
  if (!esperado) {
    return NextResponse.json(
      { ok: false, error: "SEED_TOKEN no está configurado en el servidor" },
      { status: 500 }
    );
  }

  if (!tokenValido(request.headers.get("x-seed-token"), esperado)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const { creadas, totalCatalogo } = await sincronizarConCatalogo();
    return NextResponse.json({
      ok: true,
      creadas,
      totalCatalogo,
      mensaje:
        creadas === 0
          ? "La tabla ya estaba sincronizada; no se creó ninguna fila."
          : `Se crearon ${creadas} filas de stock.`,
    });
  } catch (err) {
    console.error("[/api/stock/seed] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo sincronizar el stock" },
      { status: 503 }
    );
  }
}
