import { ImageResponse } from "next/og";

/* ══════════════════════════════════════════════════════════════
   IMAGEN OPEN GRAPH — la tarjeta que se ve al compartir el link
   (WhatsApp, Instagram, Twitter/X, Facebook…)

   Se genera como PNG 1200x630 en vez de reusar una foto del catálogo
   porque: (a) las del catálogo son WebP, y WhatsApp —el canal principal
   de esta tienda— no lo renderiza de forma confiable en las tarjetas;
   (b) son cuadradas 800x800 y OG pide 1200x630, así que quedarían
   recortadas o con franjas.

   Usa la paleta "Grafito" del sitio para que la tarjeta sea coherente
   con él.
   ══════════════════════════════════════════════════════════════ */

export const alt = "Distribuidor Argentino KOI — Vapers, Termos y Accesorios Apple";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Tokens del theme "Grafito", replicados acá porque Satori no lee el CSS
   del sitio. Se conservan los nombres (NAVY/GOLD) para que se correspondan
   1:1 con los tokens de globals.css; lo que cambia es el valor.

   El cian de promociones (--promo) NO se replica: la tarjeta al compartir
   no muestra badges ni ofertas. */
const NAVY = "#1c1c1e"; // fondo base
const NAVY_2 = "#242427"; // fondo secundario
const GOLD = "#b8b3ab"; // acento (gris cálido)
const GOLD_L = "#d6d2cb"; // acento claro
const INK = "#eceae7"; // texto principal
const MUT = "#a09b93"; // texto atenuado

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

        {/* Pill de acento */}
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
          VAPERS · TERMOS · APPLE
        </div>

        {/* Nombre de la tienda. Va en dos líneas y con "KOI" destacado: en una
            sola línea, 26 caracteres a 86px se pasarían de los 1200px de ancho. */}
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 52,
            fontWeight: 700,
            color: MUT,
            letterSpacing: -1,
          }}
        >
          Distribuidor Argentino
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 4,
            fontSize: 120,
            fontWeight: 800,
            color: INK,
            letterSpacing: 2,
          }}
        >
          KOI
        </div>

        {/* Tagline en lila */}
        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 40,
            fontWeight: 700,
            color: GOLD,
          }}
        >
          Tu tienda de confianza
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
