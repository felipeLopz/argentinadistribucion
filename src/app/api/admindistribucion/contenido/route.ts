import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/auth";
import { products } from "@/lib/products";
import {
  validarNombre,
  validarDescripcion,
  validarPackPrecios,
  validarValorOpcion,
  normalizarValor,
  aplicarOverride,
  MAX_VALORES_POR_GRUPO,
} from "@/lib/contenido";
import {
  leerOverrides,
  leerOverridesDetallados,
  fijarNombre,
  fijarDescripcion,
  fijarPackPrecios,
  fijarOpcionesExtra,
  borrarOverride,
  type CampoContenido,
} from "@/lib/contenido-db";
import { clavesDeStock } from "@/lib/stock-config";
import { crearFilasSiFaltan } from "@/lib/stock";

/* ══════════════════════════════════════════════════════════════
   /api/admindistribucion/contenido — descripciones y precios por cantidad

   ⚠️ RUTA PRIVADA. Misma doble barrera que /api/admindistribucion/stock:
     1) el middleware bloquea todo /api/admindistribucion/*
     2) cada handler revalida la sesión por su cuenta, por si el matcher
        del middleware se rompiera en el futuro

   El endpoint público /api/contenido es SOLO LECTURA y no cambia.

   Toda la validación se hace acá con las MISMAS funciones puras que usa
   la web al resolver (contenido.ts). Así es imposible guardar algo que
   después la web tenga que descartar.
   ══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIN_SESION = NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

/** El producto tiene que existir en el catálogo: no se guardan overrides
 *  de ids fantasma, que quedarían para siempre sin que nadie los lea. */
function buscarProducto(productId: string) {
  return products.find((p) => p.id === productId) ?? null;
}

/* ─── GET: listado para el panel ─── */
export async function GET() {
  if (!(await requerirSesion())) return SIN_SESION;

  try {
    const filas = await leerOverridesDetallados();
    const porId = new Map(filas.map((f) => [f.product_id, f]));

    /* Se arma desde el CATÁLOGO, no desde la base: así aparecen también
       los productos que todavía no tienen ningún override, que son la
       mayoría. El panel necesita el valor del código como referencia. */
    const productos = products.map((p) => {
      const fila = porId.get(p.id);
      const extras = fila?.opciones_extra ?? null;
      return {
        /* Los grupos con sus valores del código y los agregados aparte,
           para que el panel pueda mostrar cuáles son fijos y cuáles no. */
        grupos: (p.options ?? []).map((g) => ({
          label: g.label,
          delCodigo: g.values,
          agregados: (extras?.[g.label] ?? []).filter(
            (v) => !g.values.some((c) => c.toLowerCase() === v.toLowerCase())
          ),
        })),
        id: p.id,
        /* Encabezado de la ficha en el panel: el título EFECTIVO, para que
           lo que se lee arriba coincida con lo que se ve en la web. */
        nombre: fila?.nombre ?? p.name,
        categoria: p.category,
        /* Valores del código, como referencia en el panel */
        nombreCodigo: p.name,
        imagenCodigo: p.image ?? null,
        descripcionCodigo: p.description,
        /* true en las fundas: tienen una foto por color. El panel lo avisa,
           porque subir una foto ahí cambia SÓLO la principal. */
        tieneFotosPorOpcion: !!p.imagenesPorOpcion,
        packPreciosCodigo: p.packPrecios ?? null,
        /* El nombre corto con el que el ítem entra al carrito y al mensaje
           de WhatsApp, si el producto lo define. El panel lo muestra como
           aviso: editar el título NO cambia ese nombre. */
        cartName: p.cartName ?? null,
        /* Overrides guardados. null = sin override (manda el código).
           packPreciosOverride: [] = "sin promo" explícito. */
        nombreOverride: fila?.nombre ?? null,
        imagenOverride: fila?.imagen ?? null,
        descripcionOverride: fila?.descripcion ?? null,
        packPreciosOverride: fila?.pack_precios ?? null,
        actualizado: fila?.updated_at ?? null,
        por: fila?.updated_by ?? null,
      };
    });

    return NextResponse.json(
      { ok: true, productos },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[admin/contenido] error leyendo:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer el contenido editado" },
      { status: 503 }
    );
  }
}

/* ─── POST: escrituras ─── */
export async function POST(request: Request) {
  const email = await requerirSesion();
  if (!email) return SIN_SESION;

  let productId = "";
  let accion = "";
  let cuerpo: Record<string, unknown> = {};

  try {
    const body = await request.json();
    cuerpo = (body ?? {}) as Record<string, unknown>;
    productId = typeof cuerpo.productId === "string" ? cuerpo.productId : "";
    accion = typeof cuerpo.accion === "string" ? cuerpo.accion : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  const producto = buscarProducto(productId);
  if (!producto) {
    console.warn(`[admin/contenido] producto inexistente "${productId}" por ${email}`);
    return NextResponse.json(
      { ok: false, error: `El producto "${productId}" no existe en el catálogo.` },
      { status: 400 }
    );
  }

  try {
    if (accion === "fijar-nombre") {
      const v = validarNombre(cuerpo.nombre);
      if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

      await fijarNombre(productId, v.valor, email);
      console.info(`[admin/contenido] título de ${productId} por ${email}`);
      return NextResponse.json({ ok: true, nombre: v.valor });
    }

    if (accion === "fijar-descripcion") {
      const v = validarDescripcion(cuerpo.descripcion);
      if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

      await fijarDescripcion(productId, v.valor, email);
      console.info(`[admin/contenido] descripción de ${productId} por ${email}`);
      return NextResponse.json({ ok: true, descripcion: v.valor });
    }

    if (accion === "fijar-pack") {
      const v = validarPackPrecios(cuerpo.packPrecios);
      if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

      await fijarPackPrecios(productId, v.valor, email);
      console.info(
        `[admin/contenido] packPrecios de ${productId} -> [${v.valor.join(", ")}] por ${email}`
      );
      return NextResponse.json({ ok: true, packPrecios: v.valor });
    }

    /* ─── Agregar un valor de opción ───
       Sólo AGREGA. No hay acción para quitar, y es a propósito: sacar un
       valor dejaría stock huérfano y carritos guardados apuntando a una
       variante inexistente. */
    if (accion === "agregar-opcion") {
      const grupo = typeof cuerpo.grupo === "string" ? cuerpo.grupo : "";

      const v = validarValorOpcion(cuerpo.valor);
      if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

      /* El grupo tiene que existir en el CÓDIGO: desde el panel se agregan
         valores, nunca grupos nuevos. */
      const grupoDelCodigo = producto.options?.find((g) => g.label === grupo);
      if (!grupoDelCodigo) {
        const hay = (producto.options ?? []).map((g) => g.label).join(", ");
        return NextResponse.json(
          {
            ok: false,
            error: hay
              ? `"${producto.name}" no tiene un grupo de opciones llamado "${grupo}". Tiene: ${hay}.`
              : `"${producto.name}" no tiene opciones para agregar.`,
          },
          { status: 400 }
        );
      }

      /* Se trabaja sobre el producto EFECTIVO: los valores ya agregados
         antes también cuentan para detectar duplicados y para calcular las
         claves de stock. */
      const overrides = await leerOverrides();
      const previo = overrides[productId] ?? {};
      const antes = aplicarOverride(producto, previo);
      const valoresActuales =
        antes.options?.find((g) => g.label === grupo)?.values ?? grupoDelCodigo.values;

      const clave = normalizarValor(v.valor);
      const yaEsta = valoresActuales.find((x) => normalizarValor(x) === clave);
      if (yaEsta) {
        return NextResponse.json(
          {
            ok: false,
            error: `"${yaEsta}" ya existe en ${grupo}. No hace falta agregarlo de nuevo.`,
          },
          { status: 409 }
        );
      }

      if (valoresActuales.length >= MAX_VALORES_POR_GRUPO) {
        return NextResponse.json(
          { ok: false, error: `${grupo} ya tiene ${MAX_VALORES_POR_GRUPO} valores, que es el máximo.` },
          { status: 400 }
        );
      }

      /* Qué claves de stock hacen falta: se comparan las de ANTES con las
         de DESPUÉS. Escrito así y no "una clave por valor" para que
         funcione también con dos grupos, donde sumar un color genera una
         fila por cada modelo. Hoy ningún producto tiene dos, pero cuando
         entren los celulares usados esto ya está resuelto. */
      const mapaNuevo: Record<string, string[]> = {
        ...(previo.opcionesExtra ?? {}),
        [grupo]: [...(previo.opcionesExtra?.[grupo] ?? []), v.valor],
      };
      const despues = aplicarOverride(producto, { ...previo, opcionesExtra: mapaNuevo });

      const clavesAntes = new Set(clavesDeStock(antes).map((c) => c.key));
      const clavesNuevas = clavesDeStock(despues)
        .map((c) => c.key)
        .filter((k) => !clavesAntes.has(k));

      /* Primero las filas de stock y después el override: si fallara el
         segundo paso, quedan filas en 0 que nadie lee (invisibles), en vez
         de una opción visible sin su casillero. */
      let creadas = 0;
      try {
        creadas = await crearFilasSiFaltan(
          clavesNuevas.map((k) => ({ productId, stockKey: k })),
          email
        );
      } catch (err) {
        console.error("[admin/contenido] error creando filas de stock:", err);
        return NextResponse.json(
          { ok: false, error: "No se pudo preparar el stock de la opción nueva. Probá de nuevo." },
          { status: 503 }
        );
      }

      await fijarOpcionesExtra(productId, mapaNuevo, email);

      console.info(
        `[admin/contenido] opción "${v.valor}" en ${productId}/${grupo} ` +
          `(+${creadas} filas de stock) por ${email}`
      );
      return NextResponse.json({
        ok: true,
        grupo,
        valor: v.valor,
        valores: despues.options?.find((g) => g.label === grupo)?.values ?? [],
        filasCreadas: creadas,
      });
    }

    if (accion === "borrar") {
      const campo = cuerpo.campo;
      if (
        campo !== "nombre" &&
        campo !== "imagen" &&
        campo !== "descripcion" &&
        campo !== "packPrecios"
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Sólo se puede volver al código en «nombre», «imagen», «descripcion» o «packPrecios».",
          },
          { status: 400 }
        );
      }
      await borrarOverride(productId, campo as CampoContenido, email);
      console.info(`[admin/contenido] ${productId} vuelve al código en ${campo} por ${email}`);
      return NextResponse.json({ ok: true, campo });
    }

    return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("[admin/contenido] error escribiendo:", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el cambio" }, { status: 503 });
  }
}
