#!/usr/bin/env node
// Genera el hash bcrypt de una contraseña para la variable ADMIN_USERS.
//
// Uso:  node scripts/hash-password.mjs
//
// La contraseña se pide por entrada OCULTA a propósito. Si se pasara como
// argumento (node -e "...hashSync('miclave')") quedaría guardada en el
// historial de la terminal y visible en la lista de procesos del sistema.
//
// El script NO guarda nada en disco ni envía nada a ningún lado: imprime
// el hash en pantalla y termina.

import bcrypt from "bcryptjs";

const COSTO = 12; // debe coincidir con el costo del hash señuelo en src/lib/auth.ts

// Teclas por código, para no depender de caracteres invisibles en el archivo
const ENTER_CR = String.fromCharCode(13);
const ENTER_LF = String.fromCharCode(10);
const EOT = String.fromCharCode(4); // Ctrl+D
const ETX = String.fromCharCode(3); // Ctrl+C
const DEL = String.fromCharCode(127); // borrar
const BS = String.fromCharCode(8); // backspace

function preguntarOculto(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;

    if (!stdin.isTTY) {
      reject(new Error("Ejecutalo en una terminal interactiva."));
      return;
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let valor = "";
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === ENTER_CR || ch === ENTER_LF || ch === EOT) {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(valor);
          return;
        }
        if (ch === ETX) {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(1);
        }
        if (ch === DEL || ch === BS) {
          valor = valor.slice(0, -1);
        } else {
          valor += ch;
        }
      }
    };
    stdin.on("data", onData);
  });
}

const pw = await preguntarOculto("Contraseña (no se muestra): ");
const pw2 = await preguntarOculto("Repetir contraseña: ");

if (pw !== pw2) {
  console.error("\nLas contraseñas no coinciden. No se generó ningún hash.");
  process.exit(1);
}
if (pw.length < 12) {
  console.error("\nUsá al menos 12 caracteres (se recomiendan 20+).");
  process.exit(1);
}

const hash = bcrypt.hashSync(pw, COSTO);

console.log("\nHash generado. Pegalo en Vercel, en la variable ADMIN_USERS,");
console.log("con el formato  tuemail@ejemplo.com:EL_HASH  (sin espacios):\n");
console.log(hash);
console.log("\nGuardá la contraseña SOLO en tu gestor. No la compartas por chat.\n");
