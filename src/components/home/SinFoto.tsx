import { ImageOff } from "lucide-react";

/* ═══════════════════════════════════════════════
   SIN FOTO — placeholder de los productos que todavía no tienen imagen

   Ocupa exactamente el mismo hueco que la foto (`absolute inset-0`), así
   que las cuatro superficies que muestran productos —card, modal, panel
   del carrito y /carrito— no cambian de layout cuando falta la foto.

   Usa el mismo degradé violeta que el fondo de los contenedores de
   imagen, más un borde punteado para que se lea como "acá va a ir una
   foto" y no como un error de carga.

   Cuando llegue la foto real, alcanza con poner `image` en products.ts:
   este componente deja de renderizarse solo.
   ═══════════════════════════════════════════════ */

const TAMANIOS = {
  /* Miniaturas del carrito (64px y 96px): solo el ícono */
  sm: { icono: "h-5 w-5", texto: null, borde: "rounded-lg" },
  /* Card de producto (262px) */
  md: { icono: "h-8 w-8", texto: "text-[11px]", borde: "" },
  /* Cabecera del modal (h-64 / h-72) */
  lg: { icono: "h-11 w-11", texto: "text-[13px]", borde: "" },
} as const;

export default function SinFoto({
  size = "md",
  className = "",
}: {
  size?: keyof typeof TAMANIOS;
  className?: string;
}) {
  const t = TAMANIOS[size];
  return (
    <div
      /* aria-hidden: no aporta nada al lector de pantalla — el nombre del
         producto ya está al lado, en texto. */
      aria-hidden="true"
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--navy-3)] to-[#242427] ${t.borde} ${className}`}
    >
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] ${
          size === "sm" ? "h-full w-full" : "px-5 py-4"
        }`}
      >
        {/* El ícono puede quedar atenuado (es decorativo); el rótulo NO:
            al 70% daba 3.25:1 sobre la superficie y no pasa AA. */}
        <ImageOff className={`${t.icono} text-[var(--mut)]/70`} />
        {t.texto && (
          <span className={`${t.texto} font-semibold text-[var(--mut)]`}>Sin foto</span>
        )}
      </div>
    </div>
  );
}
