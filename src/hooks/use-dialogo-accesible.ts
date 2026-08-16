"use client";

import { useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   DIÁLOGO ACCESIBLE — comportamiento de teclado y foco

   Lo comparten ProductModal y CartPanel para no duplicar la lógica.
   Se encarga de:
     1. Mover el foco al diálogo al abrirse.
     2. Cerrar con Escape.
     3. Atrapar el Tab dentro del diálogo (no se escapa al fondo).
     4. Devolver el foco al elemento que lo abrió, al cerrarse.

   NO controla si el diálogo está abierto: eso lo siguen manejando los
   estados que ya existían. Este hook sólo agrega accesibilidad encima.
   ══════════════════════════════════════════════════════════════ */

const SELECTOR_ENFOCABLES = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Enfocables visibles dentro del diálogo.
 *  Se usa getClientRects() y no offsetParent porque este último es null
 *  en elementos position:fixed, que es justo el caso de estos paneles. */
function enfocablesDe(contenedor: HTMLElement): HTMLElement[] {
  return Array.from(
    contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)
  ).filter((el) => el.getClientRects().length > 0);
}

export function useDialogoAccesible<T extends HTMLElement>(
  abierto: boolean,
  onClose: () => void
) {
  const contenedorRef = useRef<T | null>(null);
  const anteriorRef = useRef<HTMLElement | null>(null);

  /* onClose suele venir como arrow inline (cambia de identidad en cada
     render). Se guarda en un ref para que el efecto dependa SÓLO de
     `abierto` y no se reinicie en cada render, lo que reenfocaría el
     diálogo una y otra vez. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!abierto) return;

    /* Quién tenía el foco antes de abrir, para devolvérselo al cerrar */
    const anterior = document.activeElement;
    anteriorRef.current =
      anterior instanceof HTMLElement && anterior !== document.body ? anterior : null;

    /* El foco entra al diálogo. Se enfoca el contenedor (tabIndex={-1})
       para que el lector de pantalla anuncie el diálogo y su título.
       preventScroll evita que el fondo pegue un salto. */
    contenedorRef.current?.focus({ preventScroll: true });

    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const contenedor = contenedorRef.current;
      if (!contenedor) return;

      const enfocables = enfocablesDe(contenedor);
      if (enfocables.length === 0) {
        /* Sin nada que enfocar, el Tab no debe salir al fondo */
        e.preventDefault();
        contenedor.focus({ preventScroll: true });
        return;
      }

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;
      const dentro = activo instanceof Node && contenedor.contains(activo);

      /* Ciclo: del último vuelve al primero y viceversa. Si el foco se
         fue afuera (o está en el contenedor), se lo trae de vuelta. */
      if (e.shiftKey) {
        if (!dentro || activo === primero || activo === contenedor) {
          e.preventDefault();
          ultimo.focus();
        }
      } else if (!dentro || activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPresionarTecla);

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      /* Devolver el foco a quien lo tenía, si sigue en el documento */
      const previo = anteriorRef.current;
      if (previo && document.contains(previo)) previo.focus();
      anteriorRef.current = null;
    };
  }, [abierto]);

  return contenedorRef;
}
