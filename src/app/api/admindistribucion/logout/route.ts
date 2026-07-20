import { NextResponse } from "next/server";
import { COOKIE_SESION, opcionesCookie } from "@/lib/auth-session";

/* POST /api/admindistribucion/logout — borra la cookie de sesión.
   El middleware ya bloquea esta ruta sin sesión. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, "", { ...opcionesCookie(), maxAge: 0 });
  return res;
}
