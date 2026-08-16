/* Grupo de opciones obligatorias de un producto (ej. Color, Modelo).
   Distinto de talleStock: NO maneja stock, solo una lista de valores a elegir.
   Un producto puede tener 0, 1 o varios grupos; se deben elegir TODOS para
   poder agregar al carrito. */
export interface ProductOption {
  label: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  talleStock?: Record<string, number>;
  options?: ProductOption[];
  category: "paquetes" | "albumes" | "indumentaria" | "accesorios" | "accesorios-apple";
  status?: "consultar" | "proximamente";

  /* ─── Promo por cantidad (pack) ───
     Precio TOTAL del pack según cuántas unidades lleva:
     packPrecios[0] = 1 unidad … packPrecios[n-1] = n unidades.
     El tope del pack es packPrecios.length; pasado ese tope se deriva la
     consulta a WhatsApp.

     El carrito NO entiende de promos: el modal resuelve el precio y manda
     el pack ya armado como un ítem de cantidad 1 (mismo criterio que
     "Figuritas a Elección"). */
  packPrecios?: number[];

  /** Nombre corto con el que el ítem entra al carrito y al mensaje de
   *  WhatsApp, cuando el del catálogo es demasiado largo para esa línea.
   *  Si no está, se usa `name`. */
  cartName?: string;

  /** true = siempre disponible: no lleva stock en la base. Ni la web lo
   *  consulta, ni el seed le crea filas, ni el panel lo lista. */
  sinStock?: boolean;
}

/* Opciones reutilizables para los protectores de iPhone */
const MODELOS_IPHONE_11_16 = ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16"];

/* ──────────────────────────────────────────────
   Datos de productos organizados por sección.
   Sin precios — solo nombre, imagen y botón de acción.
   ────────────────────────────────────────────── */

/* Imagen real de los paquetes de figuritas (misma para todos los packs) */
export const IMG_PACKS = "/images/figuritas-paquete.webp";
const IMG_ALBUM_BLANDA = "/images/tapa-blanca.webp";
const IMG_ALBUM_DURA = "/images/tapa-dura.webp";
const IMG_CAMISETA = "/images/camiseta.webp";
const IMG_CARGADOR = "/images/cargador.webp";
const IMG_FUNDA_IPHONE = "/images/funda-iphone.webp";
const IMG_AIRPODS = "/images/airpods.webp";
/* Promos nuevas */
const IMG_SILICONE_CASE = "/images/silicone-case.webp";
const IMG_AIRPODS_PRO_2 = "/images/airpods-pro-2.webp";
const IMG_CABLE_CABEZAL = "/images/cable-cabezal-usbc.webp";

export const products: Product[] = [
  // ═══ PAQUETES DE FIGURITAS ═══
  {
    id: "paq-1",
    name: "Pack de 10 Figuritas",
    description: "Pack de 10 figuritas sueltas al azar. Ideal para empezar a completar tu álbum.",
    image: IMG_PACKS,
    price: 2350,
    category: "paquetes",
  },
  {
    id: "paq-2",
    name: "Pack de 15 Figuritas",
    description: "Pack de 15 figuritas sueltas al azar. Variedad de selecciones y jugadores.",
    image: IMG_PACKS,
    price: 3200,
    category: "paquetes",
  },
  {
    id: "paq-3",
    name: "Pack de 50 Figuritas",
    description: "Pack de 50 figuritas sueltas. Gran variedad para avanzar en tu colección.",
    image: IMG_PACKS,
    price: 8750,
    category: "paquetes",
  },
  {
    id: "paq-4",
    name: "Pack de 100 Figuritas",
    description: "Pack de 100 figuritas sueltas. La opción ideal para coleccionistas.",
    image: IMG_PACKS,
    price: 14200,
    category: "paquetes",
  },
  {
    id: "paq-5",
    name: "Pack de 200 Figuritas",
    description: "Pack de 200 figuritas sueltas. Gran cantidad para completar tu álbum.",
    image: IMG_PACKS,
    price: 24800,
    category: "paquetes",
  },
  {
    id: "paq-6",
    name: "Pack de 1000 Figuritas",
    description: "Pack de 1000 figuritas sueltas. Para los más apasionados coleccionistas.",
    image: IMG_PACKS,
    price: 89500,
    category: "paquetes",
  },

  // ═══ ÁLBUMES ═══
  {
    id: "alb-1",
    name: "Álbum Tapa Blanda",
    description: "Álbum oficial con tapa blanda. Ligero y fácil de transportar.",
    image: IMG_ALBUM_BLANDA,
    price: 9800,
    category: "albumes",
  },
  {
    id: "alb-2",
    name: "Álbum Tapa Dura",
    description: "Álbum oficial con tapa dura. Mayor protección y durabilidad.",
    image: IMG_ALBUM_DURA,
    price: 15600,
    category: "albumes",
  },

  // ═══ INDUMENTARIA ═══
  {
    id: "ind-1",
    name: "Camisetas",
    description: "Camisetas oficiales de la Selección Argentina. Diversas tallas disponibles.",
    image: IMG_CAMISETA,
    price: 32400,
    /* Las CLAVES definen qué talles se ofrecen (las lee el modal).
       Los VALORES ya no son el stock en runtime (eso vive en la base) —
       solo se usan como cantidad inicial la primera vez que /api/stock/seed
       crea las filas en un entorno nuevo. No son dato muerto. */
    talleStock: { XS: 3, S: 8, M: 12, L: 10, XL: 5, XXL: 2 },
    category: "indumentaria",
  },

  // ═══ PROMOS ═══
  {
    id: "promo-silicone",
    name: "Silicone Case (iPhone 11 al 17)",
    /* Entra al carrito como "Silicone Case" a secas: la línea del pedido
       ya lleva la cantidad y el precio del pack al lado. */
    cartName: "Silicone Case",
    description:
      "Fundas de silicona para iPhone 11 al 17, en todos los colores. Promo por cantidad: cuantas más llevás, mejor el precio.",
    image: IMG_SILICONE_CASE,
    /* Precio de UNA unidad: es el que muestra la card. El precio real del
       pack sale de packPrecios y lo resuelve el modal. */
    price: 5000,
    packPrecios: [5000, 8500, 12500, 16500],
    sinStock: true,
    category: "accesorios",
  },
  {
    id: "promo-airpods-pro-2",
    name: "AirPods Pro 2",
    description:
      "AirPods Pro 2 con estuche de carga, cable USB-C y almohadillas de repuesto en todos los talles.",
    image: IMG_AIRPODS_PRO_2,
    price: 25000,
    category: "accesorios",
  },
  {
    id: "promo-cable-cabezal",
    name: "Cable y cabezal iPhone USB-C",
    description:
      "Cable USB-C de 1 metro más cabezal de 20W para carga rápida. Los dos en su caja original.",
    image: IMG_CABLE_CABEZAL,
    price: 20000,
    category: "accesorios",
  },

  // ═══ ACCESORIOS APPLE ═══
  {
    id: "apl-5",
    name: "Protectores de iPhone del 11 al 16",
    description: "Protectores de pantalla para iPhone 11 al 16. Elegí el modelo.",
    image: IMG_FUNDA_IPHONE,
    price: 7900,
    options: [{ label: "Modelo", values: MODELOS_IPHONE_11_16 }],
    category: "accesorios-apple",
  },
  {
    id: "apl-6",
    name: "Protector de iPhone 17",
    description: "Protector de pantalla para iPhone 17.",
    image: IMG_FUNDA_IPHONE,
    price: 7900,
    category: "accesorios-apple",
  },
  {
    id: "apl-2",
    name: "AirPods",
    description: "AirPods personalizados con colores de la Selección Argentina.",
    image: IMG_AIRPODS,
    price: 52300,
    category: "accesorios-apple",
  },
  {
    id: "apl-3",
    name: "Cargadores",
    description: "Cargadores de alta calidad con diseño oficial de Argentina.",
    image: IMG_CARGADOR,
    price: 11400,
    category: "accesorios-apple",
  },
];

/* ──────────────────────────────────────────────
   Navegación por secciones de la tienda
   ────────────────────────────────────────────── */
export const navSections = [
  { id: "inicio", label: "Inicio" },
  { id: "paquetes", label: "Paquetes de Figuritas" },
  { id: "albumes", label: "Álbumes" },
  { id: "indumentaria", label: "Indumentaria" },
  { id: "accesorios", label: "Promos" },
  { id: "accesorios-apple", label: "Accesorios Apple" },
  { id: "contacto", label: "Contacto" },
] as const;

/* ──────────────────────────────────────────────
   Configuración de contacto
   ────────────────────────────────────────────── */
export const contactConfig = {
  whatsapp: "2617085062",
  whatsappLink: "https://wa.me/5492617085062",
  email: "Lucianagargantini0@gmail.com",
  emailLink: "mailto:Lucianagargantini0@gmail.com",
  shippingNote: "Realizamos envíos a toda Argentina.",
  location: "Mendoza, Argentina",
  /* Dos cuentas de Instagram — se muestran ambas en Contacto y en el Footer */
  instagrams: [
    { user: "Luli.gargantini", url: "https://instagram.com/Luli.gargantini" },
    { user: "jere.alarcon11", url: "https://instagram.com/jere.alarcon11" },
  ],
};

/* ──────────────────────────────────────────────
   Nombre de la tienda (centralizado)
   ────────────────────────────────────────────── */
export const storeName = "Argentina Distributor";