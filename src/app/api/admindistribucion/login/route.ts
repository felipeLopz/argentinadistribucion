import { NextResponse } from "next/server";
import { verificarCredenciales, hayConfigDeAuth } from "@/lib/auth";
import { COOKIE_SESION, crearToken, opcionesCookie } from "@/lib/auth-session";
import { estaBloqueado, registrarFallo, limpiarIntentos, ipDeRequest } from "@/lib/rate-limit";

/* ══════════════════════════════════════════════════════════════
   POST /api/admindistribucion/login

   Runtime Node explícito: bcrypt no corre en Edge.
   ══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mensaje único para credenciales inválidas: no revela si el email existe. */
const ERROR_GENERICO = "Email o contraseña incorrectos";

export async function POST(request: Request) {
  if (!hayConfigDeAuth()) {
    console.error("[login] Falta ADMIN_USERS y/o AUTH_SECRET en el servidor");
    return NextResponse.json(
      { ok: false, error: "El panel no está configurado" },
      { status: 500 }
    );
  }

  const ip = ipDeRequest(request);

  /* Límite de intentos. Si la base no responde, fallamos CERRADO: sin poder
     controlar el límite no se permite intentar. */
  try {
    const { bloqueado, segundosRestantes } = await estaBloqueado(ip);
    if (bloqueado) {
      const minutos = Math.ceil(segundosRestantes / 60);
      return NextResponse.json(
        { ok: false, error: `Demasiados intentos. Probá de nuevo en ${minutos} minuto(s).` },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("[login] no se pudo verificar el límite de intentos:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo procesar el login" },
      { status: 503 }
    );
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: ERROR_GENERICO }, { status: 400 });
  }

  if (!email || !password) {
    await registrarFallo(ip);
    return NextResponse.json({ ok: false, error: ERROR_GENERICO }, { status: 401 });
  }

  const emailValido = await verificarCredenciales(email, password);

  if (!emailValido) {
    await registrarFallo(ip);
    /* Se loguea el email intentado para poder auditar; NUNCA la contraseña. */
    console.warn(`[login] intento fallido ip=${ip} email=${email}`);
    return NextResponse.json({ ok: false, error: ERROR_GENERICO }, { status: 401 });
  }

  await limpiarIntentos(ip);

  const token = await crearToken(emailValido);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, token, opcionesCookie());
  return res;
}
