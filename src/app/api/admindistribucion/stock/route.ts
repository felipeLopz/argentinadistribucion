import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/auth";
import { products } from "@/lib/products";
import { clavesDeStock } from "@/lib/stock-config";
import { leerStockDetallado, fijarStock, descontarStock } from "@/lib/stock";

/* ══════════════════════════════════════════════════════════════
   /api/admindistribucion/stock — lectura y escritura del stock

   ⚠️ RUTA PRIVADA. Doble barrera:
     1) el middleware bloquea todo /api/admindistribucion/*
     2) cada handler revalida la sesión por su cuenta (por si el matcher
        del middleware se rompiera en el futuro)

   El endpoint público /api/stock sigue siendo SOLO LECTURA y no cambia.
   ══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIN_SESION = NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

/** Estructura del catálogo: qué variantes existen para cada producto.
 *  Sirve para armar el listado y para validar las escrituras: solo se puede
 *  escribir sobre pares (producto, variante) que existen en el catálogo. */
function catalogoDeStock() {
  return products.map((p) => ({
    id: p.id,
    nombre: p.name,
    categoria: p.category,
    claves: clavesDeStock(p).map((c) => c.key),
  }));
}

/**
 * Valida que el par (producto, variante) respete la granularidad definida
 * en stock-config.ts — la MISMA fuente de verdad que usa la web pública
 * para leer el stock.
 *
 * Esto hace imposible cargar un casillero "fantasma": por ejemplo, en las
 * fundas 11-16 el stock se lleva por MODELO, así que intentar guardar por
 * color ("Negro Mate") se rechaza, porque la web nunca leería esa clave.
 */
function validarPar(
  productId: string,
  stockKey: string
): { ok: true } | { ok: false; error: string } {
  const prod = catalogoDeStock().find((p) => p.id === productId);
  if (!prod) return { ok: false, error: `El producto "${productId}" no existe en el catálogo` };

  if (!prod.claves.includes(stockKey)) {
    const esperadas = prod.claves.map((c) => (c === "" ? "(sin variante)" : c)).join(", ");
    return {
      ok: false,
      error:
        `La variante "${stockKey || "(vacía)"}" no corresponde a "${prod.nombre}". ` +
        `Este producto lleva stock por: ${esperadas}.`,
    };
  }
  return { ok: true };
}

/* ─── GET: listado completo para el panel ─── */
export async function GET() {
  if (!(await requerirSesion())) return SIN_SESION;

  try {
    const filas = await leerStockDetallado();

    const porProducto = new Map<string, Map<string, (typeof filas)[number]>>();
    for (const f of filas) {
      if (!porProducto.has(f.product_id)) porProducto.set(f.product_id, new Map());
      porProducto.get(f.product_id)!.set(f.stock_key, f);
    }

    /* Se arma desde el CATÁLOGO para que aparezcan también las variantes
       que todavía no tienen fila en la base (se muestran sin cargar). */
    const productos = catalogoDeStock().map((p) => {
      const enBase = porProducto.get(p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        variantes: p.claves.map((key) => {
          const fila = enBase?.get(key);
          return {
            key,
            cantidad: fila ? fila.cantidad : null, // null = sin fila en la base
            actualizado: fila?.updated_at ?? null,
            por: fila?.updated_by ?? null,
          };
        }),
      };
    });

    return NextResponse.json(
      { ok: true, productos },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[admin/stock] error leyendo:", err);
    return NextResponse.json({ ok: false, error: "No se pudo leer el stock" }, { status: 503 });
  }
}

/* ─── POST: escrituras ─── */
export async function POST(request: Request) {
  const email = await requerirSesion();
  if (!email) return SIN_SESION;

  let productId = "";
  let stockKey = "";
  let accion = "";
  let cantidad: unknown = null;

  try {
    const body = await request.json();
    productId = typeof body?.productId === "string" ? body.productId : "";
    stockKey = typeof body?.stockKey === "string" ? body.stockKey : "";
    accion = typeof body?.accion === "string" ? body.accion : "";
    cantidad = body?.cantidad;
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  /* Granularidad: se rechaza cualquier clave que la web pública no leería */
  const valido = validarPar(productId, stockKey);
  if (!valido.ok) {
    console.warn(`[admin/stock] clave rechazada ${productId}/${stockKey} por ${email}`);
    return NextResponse.json({ ok: false, error: valido.error }, { status: 400 });
  }

  try {
    let nueva: number | null = null;

    if (accion === "fijar") {
      const n = Number(cantidad);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return NextResponse.json(
          { ok: false, error: "La cantidad tiene que ser un entero de 0 o más" },
          { status: 400 }
        );
      }
      if (n > 1_000_000) {
        return NextResponse.json({ ok: false, error: "Cantidad demasiado grande" }, { status: 400 });
      }
      await fijarStock(productId, stockKey, n, email);
      nueva = n;
    } else if (accion === "agotar") {
      await fijarStock(productId, stockKey, 0, email);
      nueva = 0;
    } else if (accion === "descontar") {
      nueva = await descontarStock(productId, stockKey, 1, email);
      if (nueva === null) {
        return NextResponse.json(
          { ok: false, error: "Esa variante todavía no tiene stock cargado. Guardá un número primero." },
          { status: 409 }
        );
      }
    } else {
      return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
    }

    console.info(`[admin/stock] ${accion} ${productId}/${stockKey || "(único)"} -> ${nueva} por ${email}`);
    return NextResponse.json({ ok: true, cantidad: nueva });
  } catch (err) {
    console.error("[admin/stock] error escribiendo:", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el cambio" }, { status: 503 });
  }
}
