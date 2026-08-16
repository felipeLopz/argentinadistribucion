/* Twitter/X usa la MISMA imagen que Open Graph.
   Se reexporta el diseño de opengraph-image.tsx en vez de duplicarlo:
   así hay una sola fuente de verdad para la tarjeta.

   (Twitter cae por defecto en og:image si no hay twitter:image, pero
   declararla explícitamente evita depender de ese fallback.) */
export { default, size, contentType, alt } from "./opengraph-image";
