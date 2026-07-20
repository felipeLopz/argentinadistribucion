import { getSql } from "./db";

/* ══════════════════════════════════════════════════════════════
   LÍMITE DE INTENTOS DE LOGIN — ⚠️ SOLO SERVIDOR

   Se lleva contra la BASE y no en memoria a propósito: en serverless las
   funciones son efímeras y pueden escalar a varias instancias, así que un
   contador en memoria se reinicia solo y es fácil de evadir.

   Regla: 5 fallos en 15 minutos → esa IP queda bloqueada 15 minutos.
   ══════════════════════════════════════════════════════════════ */

export const MAX_INTENTOS = 5;
export const VENTANA_MINUTOS = 15;

let tablaLista = false;

async function asegurarTabla(): Promise<void> {
  if (tablaLista) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip               text PRIMARY KEY,
      intentos         integer     NOT NULL DEFAULT 0,
      bloqueado_hasta  timestamptz,
      ultimo_intento   timestamptz NOT NULL DEFAULT now()
    )
  `;
  tablaLista = true;
}

/** IP del cliente según los headers que setea Vercel. */
export function ipDeRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const primera = fwd.split(",")[0]?.trim();
  return primera || req.headers.get("x-real-ip")?.trim() || "desconocida";
}

/**
 * ¿Esta IP está bloqueada?
 * Si la base falla, propaga el error: el login falla CERRADO, para que no
 * se pueda saltear el límite tumbando la base.
 */
export async function estaBloqueado(
  ip: string
): Promise<{ bloqueado: boolean; segundosRestantes: number }> {
  await asegurarTabla();
  const sql = getSql();
  const filas = (await sql`
    SELECT GREATEST(0, EXTRACT(EPOCH FROM (bloqueado_hasta - now())))::int AS restantes
      FROM login_attempts
     WHERE ip = ${ip} AND bloqueado_hasta IS NOT NULL AND bloqueado_hasta > now()
  `) as { restantes: number }[];

  if (filas.length === 0) return { bloqueado: false, segundosRestantes: 0 };
  return { bloqueado: true, segundosRestantes: filas[0].restantes };
}

/** Registra un intento fallido y bloquea si se pasó del máximo. */
export async function registrarFallo(ip: string): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  await sql`
    INSERT INTO login_attempts (ip, intentos, ultimo_intento)
    VALUES (${ip}, 1, now())
    ON CONFLICT (ip) DO UPDATE SET
      intentos = CASE
        WHEN login_attempts.ultimo_intento < now() - interval '15 minutes' THEN 1
        ELSE login_attempts.intentos + 1
      END,
      bloqueado_hasta = CASE
        WHEN (CASE
                WHEN login_attempts.ultimo_intento < now() - interval '15 minutes' THEN 1
                ELSE login_attempts.intentos + 1
              END) >= ${MAX_INTENTOS}
        THEN now() + interval '15 minutes'
        ELSE login_attempts.bloqueado_hasta
      END,
      ultimo_intento = now()
  `;
}

/** Login exitoso: se limpia el historial de esa IP. */
export async function limpiarIntentos(ip: string): Promise<void> {
  await asegurarTabla();
  const sql = getSql();
  await sql`DELETE FROM login_attempts WHERE ip = ${ip}`;
}
