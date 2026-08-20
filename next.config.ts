import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ⚠️ El build NO valida tipos por esta opción: `npm run build` pasa
     aunque haya errores de TypeScript. El chequeo real es
     `npx tsc --noEmit`, y hay que correrlo antes de commitear. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  images: {
    /* Fotos subidas desde el panel: viven en Vercel Blob, no en /public.
       `next/image` RECHAZA cualquier host que no esté acá, así que sin
       este patrón las fotos subidas no cargarían — y el error recién se
       vería en producción, con la foto ya subida.

       El subdominio es el id del store, distinto por proyecto, por eso va
       con comodín. Las fotos que siguen en /public no pasan por acá: las
       rutas relativas no necesitan patrón. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
