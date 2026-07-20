import { SignJWT, jwtVerify } from "jose";

/* ══════════════════════════════════════════════════════════════
   SESIÓN — firma y verificación del token del panel

   ⚠️ Este archivo es COMPATIBLE CON EDGE a propósito: solo usa `jose`.
   No importa bcrypt ni next/headers, porque lo consume el middleware,
   que corre en Edge runtime (donde bcrypt no funciona).

   El bcrypt vive en auth.ts, que solo usan los route handlers de Node.
   ══════════════════════════════════════════════════════════════ */

/** Nombre neutro a propósito: no delata que es una sesión de administración. */
export const COOKIE_SESION = "ad_sesion";

/** Duración de la sesión: 7 días. */
export const DURACION_SESION_SEG = 7 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET no está configurada o es demasiado corta (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(s);
}

/** Opciones de la cookie de sesión. */
export function opcionesCookie() {
  return {
    httpOnly: true,                                  // el JS de la página no la puede leer
    secure: process.env.NODE_ENV === "production",   // solo por HTTPS en producción
    sameSite: "lax" as const,                        // corta el CSRF cross-site
    path: "/",
    maxAge: DURACION_SESION_SEG,
  };
}

/** Firma un token para el email dado. Nunca incluye la contraseña ni el hash. */
export async function crearToken(email: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEG}s`)
    .sign(getSecret());
}

/**
 * Verifica el token y devuelve el email, o null si es inválido/vencido.
 * Se fija el algoritmo explícitamente para evitar ataques de confusión de
 * algoritmo (por ejemplo un token con alg "none").
 */
export async function verificarToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
