import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/auth-session";

/* ══════════════════════════════════════════════════════════════
   MIDDLEWARE — primera barrera del panel

   Corre en Edge runtime, así que solo verifica el JWT (nada de bcrypt).
   Es la PRIMERA barrera, no la única: cada route handler revalida la
   sesión por su cuenta (defensa en profundidad).

   El matcher está acotado a las rutas del panel: NO se ejecuta en "/",
   "/carrito" ni en /api/stock, así que el sitio público no se ve afectado.
   ══════════════════════════════════════════════════════════════ */

const RUTA_LOGIN = "/admindistribucion/login";
const API_LOGIN = "/api/admindistribucion/login";
const PREFIJO_API = "/api/admindistribucion";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* El login tiene que ser accesible sin sesión (si no, no se podría entrar) */
  if (pathname === RUTA_LOGIN || pathname === API_LOGIN) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_SESION)?.value;
  const email = token ? await verificarToken(token) : null;

  if (email) return NextResponse.next();

  /* Sin sesión: las APIs responden 401; las páginas van al login */
  if (pathname.startsWith(PREFIJO_API)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = RUTA_LOGIN;
  url.search = "";
  return NextResponse.redirect(url);
}

/* Las rutas del matcher deben ser literales para que Next las analice. */
export const config = {
  matcher: [
    "/admindistribucion",
    "/admindistribucion/:path*",
    "/api/admindistribucion/:path*",
  ],
};
