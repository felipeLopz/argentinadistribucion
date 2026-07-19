import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/* ══════════════════════════════════════════════════════════════
   CONEXIÓN A LA BASE (Neon Postgres)

   ⚠️ SOLO SERVIDOR. Este archivo nunca debe importarse desde un
   componente con "use client": expondría la cadena de conexión.

   La conexión se crea de forma perezosa (no al importar el módulo) para
   que `next build` funcione aunque DATABASE_URL todavía no esté cargada.
   ══════════════════════════════════════════════════════════════ */

let _sql: NeonQueryFunction<false, false> | null = null;

/** Cliente SQL. Lanza error si falta DATABASE_URL. */
export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. Cargala en Vercel (Storage → Neon) o en .env.local para desarrollo."
    );
  }
  if (!_sql) _sql = neon(url);
  return _sql;
}

/** true si hay cadena de conexión configurada (sin intentar conectarse). */
export function hayBaseConfigurada(): boolean {
  return !!process.env.DATABASE_URL;
}
