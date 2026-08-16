import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Sitemap del sitio público.
   Sólo va la home: es la única página indexable con contenido.
   Se dejan FUERA a propósito:
     - /carrito  → es un paso del flujo de compra, no contenido a rastrear.
     - /admindistribucion y /api/* → privadas; además el panel ya tiene
       noindex y no está enlazado desde ningún lado. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
