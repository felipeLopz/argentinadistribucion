import { ImageResponse } from "next/og";

/* ══════════════════════════════════════════════════════════════
   IMAGEN OPEN GRAPH — la tarjeta que se ve al compartir el link
   (WhatsApp, Instagram, Twitter/X, Facebook…)

   Se genera como PNG 1200x630 en vez de reusar una foto del catálogo
   porque: (a) las del catálogo son WebP, y WhatsApp —el canal principal
   de esta tienda— no lo renderiza de forma confiable en las tarjetas;
   (b) son cuadradas 800x800 y OG pide 1200x630, así que quedarían
   recortadas o con franjas.

   Usa el theme "Estadio Nocturno" (navy + dorado) para que la tarjeta
   sea coherente con el sitio.
   ══════════════════════════════════════════════════════════════ */

export const alt = "Argentina Distributor — Figuritas del Mundial & Merchandising";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Tokens del theme "Violeta Profundo", replicados acá porque Satori no lee
   el CSS del sitio. Se conservan los nombres (NAVY/GOLD) para que se
   correspondan 1:1 con los tokens de globals.css; lo que cambia es el valor. */
const NAVY = "#140f26"; // fondo base
const NAVY_2 = "#1c1436"; // fondo secundario
const GOLD = "#a78bfa"; // acento principal (lila)
const GOLD_L = "#f0abfc"; // acento secundario (rosa)
const INK = "#efeafe"; // texto principal
const MUT = "#a396c9"; // texto atenuado

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: NAVY,
          backgroundImage: `radial-gradient(circle at 50% 15%, ${NAVY_2} 0%, ${NAVY} 65%)`,
          position: "relative",
        }}
      >
        {/* Franja dorada superior (como el hairline del sitio) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 8,
            backgroundImage: `linear-gradient(90deg, ${NAVY} 0%, ${GOLD} 50%, ${NAVY} 100%)`,
          }}
        />

        {/* Pill dorado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: `2px solid ${GOLD}`,
            borderRadius: 999,
            padding: "10px 30px",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: GOLD_L,
          }}
        >
          COPA DEL MUNDO
        </div>

        {/* Nombre de la tienda */}
        <div
          style={{
            display: "flex",
            marginTop: 38,
            fontSize: 86,
            fontWeight: 800,
            color: INK,
            letterSpacing: -2,
          }}
        >
          Argentina Distributor
        </div>

        {/* Tagline en dorado */}
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 44,
            fontWeight: 700,
            color: GOLD,
          }}
        >
          Figuritas del Mundial &amp; Merchandising
        </div>

        {/* Línea divisoria */}
        <div
          style={{
            marginTop: 40,
            width: 220,
            height: 3,
            backgroundColor: GOLD,
            opacity: 0.55,
          }}
        />

        {/* Nota de envíos */}
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 28,
            color: MUT,
          }}
        >
          Envíos a todo el país
        </div>

        {/* Franja dorada inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 8,
            backgroundImage: `linear-gradient(90deg, ${NAVY} 0%, ${GOLD} 50%, ${NAVY} 100%)`,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
