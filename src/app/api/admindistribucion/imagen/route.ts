import { NextResponse } from "next/server";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { requerirSesion } from "@/lib/auth";
import { products } from "@/lib/products";
import { fijarImagen } from "@/lib/contenido-db";

/* ══════════════════════════════════════════════════════════════
   POST /api/admindistribucion/imagen — subir la foto de un producto

   ⚠️ RUTA PRIVADA. Misma doble barrera que el resto del panel: el
   middleware bloquea todo /api/admindistribucion/*, y este handler
   revalida la sesión por su cuenta.

   Qué hace, en orden:
     1. valida sesión, producto, tipo y tamaño;
     2. re-procesa la imagen con sharp a 800x800 WebP — SIEMPRE, sin
        importar lo que haya mandado el navegador;
     3. la sube a Vercel Blob con un nombre único;
     4. guarda la URL como override en `contenido_overrides`.

   ⚠️ Del cliente NO nos fiamos. El panel achica la foto antes de subirla
   (para no chocar con el límite de ~4,5 MB de body de las funciones y
   para que suba rápido con datos móviles), pero eso es comodidad: lo que
   define el resultado es este re-procesado.

   ⚠️ NUNCA se borra el blob anterior. Los carritos que la gente tenga
   abiertos guardan la URL de la foto en localStorage; si borráramos la
   vieja, esos carritos mostrarían una imagen rota. Cada foto pesa ~40 KB:
   acumularlas sale más barato que el problema que evita.
   ══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIN_SESION = NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

/** Lado del cuadrado final. Mismo criterio que las fotos hechas a mano. */
const LADO = 800;

/** Tope del archivo que llega al servidor. El panel manda ~200-400 KB
 *  después de achicar; 4 MB es el techo por si alguien sube directo a la
 *  API. Queda debajo del límite de body de las funciones de Vercel. */
const MAX_BYTES = 4 * 1024 * 1024;

/** Lo que sabe decodificar sharp y el navegador puede producir.
 *  El HEIC de los iPhone no está: el achicado del panel lo convierte a
 *  WebP antes de subirlo, así que acá nunca llega. */
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

const error = (mensaje: string, status = 400) =>
  NextResponse.json({ ok: false, error: mensaje }, { status });

export async function POST(request: Request) {
  const email = await requerirSesion();
  if (!email) return SIN_SESION;

  /* ─── 1. Leer el formulario ─── */
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("No se pudo leer el archivo. Probá de nuevo.");
  }

  const productId = String(form.get("productId") ?? "");
  const archivo = form.get("archivo");

  const producto = products.find((p) => p.id === productId);
  if (!producto) {
    console.warn(`[admin/imagen] producto inexistente "${productId}" por ${email}`);
    return error(`El producto "${productId}" no existe en el catálogo.`);
  }

  if (!(archivo instanceof File)) {
    return error("No llegó ninguna imagen. Elegí un archivo y volvé a intentar.");
  }

  /* ─── 2. Validar tipo y tamaño, con mensajes que se puedan accionar ─── */
  if (!TIPOS.includes(archivo.type)) {
    return error(
      `Ese archivo es ${archivo.type || "de un tipo desconocido"}. Subí una imagen JPG, PNG o WebP.`
    );
  }

  if (archivo.size > MAX_BYTES) {
    const mb = (archivo.size / 1024 / 1024).toFixed(1);
    return error(
      `Esa imagen pesa ${mb} MB y el máximo son ${MAX_BYTES / 1024 / 1024} MB. ` +
        `Probá con una foto más chica.`
    );
  }

  if (archivo.size === 0) return error("El archivo está vacío.");

  /* ─── 3. Re-procesar: la foto ENTERA en un cuadrado ───
     Las fotos de celular vienen verticales y las cards son cuadradas con
     object-cover: un recorte al centro cortaría el producto. Entra entera
     y lo que sobra a los costados se rellena con la misma foto ampliada y
     desenfocada, que es el criterio con el que se procesaron a mano las
     fotos de las fundas. Una foto ya cuadrada queda igual que siempre. */
  let webp: Buffer;
  try {
    const entrada = Buffer.from(await archivo.arrayBuffer());

    /* `rotate()` sin argumentos aplica la orientación EXIF: sin esto, una
       foto sacada de costado se sube acostada. */
    const base = sharp(entrada).rotate();
    const meta = await base.metadata();
    if (!meta.width || !meta.height) {
      return error("No se pudo leer esa imagen. ¿Seguro que es una foto?");
    }

    const fondo = await base
      .clone()
      .resize(LADO, LADO, { fit: "cover", position: "center" })
      .blur(26)
      .modulate({ brightness: 1.02, saturation: 0.9 })
      .toBuffer();

    const frente = await base.clone().resize(LADO, LADO, { fit: "inside" }).toBuffer();

    /* El fondo ya mide 800x800 y sólo se compone encima: sharp corre el
       resize ANTES del composite sin importar el orden de las llamadas,
       así que encadenarlos en una sola pasada falla. */
    webp = await sharp(fondo)
      .composite([{ input: frente, gravity: "center" }])
      .webp({ quality: 82 })
      .toBuffer();
  } catch (err) {
    console.error("[admin/imagen] error procesando:", err);
    return error("No se pudo procesar esa imagen. Probá con otra foto.", 422);
  }

  /* ─── 4. Subir al Blob con nombre único ───
     El timestamp evita pisar la foto anterior: se conserva a propósito
     (ver la cabecera). */
  let url: string;
  try {
    const subido = await put(`productos/${productId}-${Date.now()}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
    });
    url = subido.url;
  } catch (err) {
    console.error("[admin/imagen] error subiendo al Blob:", err);
    return error(
      "No se pudo guardar la imagen. Si el problema sigue, avisale a quien administra el sitio.",
      503
    );
  }

  /* ─── 5. Recién ahora se guarda la referencia ───
     Si esto fallara, el blob queda huérfano pero el producto conserva su
     foto anterior: nunca queda apuntando a algo que no existe. */
  try {
    await fijarImagen(productId, url, email);
  } catch (err) {
    console.error("[admin/imagen] error guardando la referencia:", err);
    return error("La imagen se subió pero no se pudo guardar. Probá de nuevo.", 503);
  }

  console.info(
    `[admin/imagen] ${productId} -> ${url} (${Math.round(webp.length / 1024)} KB) por ${email}`
  );
  return NextResponse.json({ ok: true, imagen: url, bytes: webp.length });
}
