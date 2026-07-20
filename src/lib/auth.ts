import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { COOKIE_SESION, verificarToken } from "./auth-session";

/* ══════════════════════════════════════════════════════════════
   AUTENTICACIÓN — ⚠️ SOLO SERVIDOR, runtime Node (usa bcrypt)

   Los usuarios viven en la variable de entorno ADMIN_USERS, con el
   formato:  email:hashBcrypt,email:hashBcrypt
   Sumar un usuario nuevo es editar esa variable en Vercel; no hay que
   tocar código.

   Los hashes bcrypt usan el alfabeto ./A-Za-z0-9 más '$', así que nunca
   contienen ':' ni ',' — los separadores no se pueden romper.

   ⚠️ Nunca se guarda la contraseña en texto, ni acá ni en el repo.
   ══════════════════════════════════════════════════════════════ */

interface AdminUser {
  email: string;
  hash: string;
}

/**
 * Hash señuelo (de una cadena aleatoria descartada).
 * Se compara contra él cuando el email NO existe, para que el tiempo de
 * respuesta sea el mismo que con un email válido y no se pueda deducir
 * qué usuarios existen. Debe tener el MISMO costo (12) que los hashes
 * que genera scripts/hash-password.mjs.
 */
const HASH_SENUELO = "$2b$12$3GYTYgg8MUwfMD3PcYZySuiI7DyR.gvSyESkywOf35MDZ8arGeCAG";

function parsearUsuarios(): AdminUser[] {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  const usuarios: AdminUser[] = [];
  for (const par of raw.split(",")) {
    const limpio = par.trim();
    if (!limpio) continue;
    const i = limpio.indexOf(":"); // el email no puede tener ':'
    if (i <= 0) continue;
    const email = limpio.slice(0, i).trim().toLowerCase();
    const hash = limpio.slice(i + 1).trim();
    if (email && hash) usuarios.push({ email, hash });
  }
  return usuarios;
}

/** true si el servidor tiene la configuración mínima para autenticar. */
export function hayConfigDeAuth(): boolean {
  return parsearUsuarios().length > 0 && !!process.env.AUTH_SECRET;
}

/**
 * Verifica email + contraseña.
 * Devuelve el email normalizado si son correctos, o null si no.
 * Siempre corre un bcrypt.compare (contra el señuelo si el email no existe).
 */
export async function verificarCredenciales(
  email: string,
  password: string
): Promise<string | null> {
  const buscado = email.trim().toLowerCase();
  const usuario = parsearUsuarios().find((u) => u.email === buscado);
  const hash = usuario?.hash ?? HASH_SENUELO;

  const coincide = await bcrypt.compare(password, hash);
  return coincide && usuario ? usuario.email : null;
}

/**
 * Sesión activa leída de la cookie, o null.
 * Cada route handler la llama por su cuenta: el middleware es la primera
 * barrera, pero no la única (defensa en profundidad).
 */
export async function requerirSesion(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (!token) return null;
  return verificarToken(token);
}
