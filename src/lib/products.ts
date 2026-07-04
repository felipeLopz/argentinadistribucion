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
}

/* Opciones reutilizables para las fundas/protectores de iPhone */
const COLORES_FUNDA = [
  "Negro Mate",
  "Blanco Translúcido / Transparente",
  "Gris Espacial / Grafito",
  "Azul Marino / Azul Medianoche",
  "Verde Pino / Verde Militar",
  "Gris Lavanda",
  "Rosa Arena / Rosa Pastel",
  "Azul Cielo / Azul Sierra",
  "Verde Menta / Matcha",
  "Rojo Coral",
  "Amarillo Canario",
];
const MODELOS_IPHONE_11_16 = ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16"];

/* ──────────────────────────────────────────────
   Datos de productos organizados por sección.
   Sin precios — solo nombre, imagen y botón de acción.
   ────────────────────────────────────────────── */

/* Imagen real de los paquetes de figuritas (misma para todos los packs) */
export const IMG_PACKS = "/images/figuritas-paquete.png";
const IMG_ALBUM_BLANDA = "/images/tapa-blanca.png";
const IMG_ALBUM_DURA = "/images/tapa-dura.png";
const IMG_CAMISETA = "/images/camiseta.png";
const IMG_CARGADOR = "/images/cargador.png";
const IMG_FUNDA_IPHONE = "/images/funda-iphone.png";
const IMG_AIRPODS = "/images/airpods.png";

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
    talleStock: { XS: 3, S: 8, M: 12, L: 10, XL: 5, XXL: 2 },
    category: "indumentaria",
  },

  // ═══ PROMOS ═══
  {
    id: "promo-1",
    name: "Promo Cargador + Cabezal",
    description: "Cargador de alta calidad con cabezal magnético incluido. Diseño oficial de la Selección Argentina. Cargá tu celu y usá el GPS al mismo tiempo.",
    image: IMG_CARGADOR,
    price: 18500,
    category: "accesorios",
  },
  {
    id: "promo-2",
    name: "Promo Funda + Protector",
    description: "Funda protectora para iPhone con diseño de la Selección Argentina más protector de pantalla templado incluido. Protección completa.",
    image: IMG_FUNDA_IPHONE,
    price: 10500,
    category: "accesorios",
  },
  {
    id: "promo-3",
    name: "Promo Funda + AirPods",
    description: "Funda para iPhone más AirPods personalizados con colores de la Selección Argentina. El combo ideal para fans de Argentina.",
    image: IMG_AIRPODS,
    price: 56000,
    category: "accesorios",
  },

  // ═══ ACCESORIOS APPLE ═══
  {
    id: "apl-1",
    name: "Fundas de iPhone 11 al 16 de silicona",
    description: "Fundas de silicona para iPhone 11 al 16. Elegí color y modelo.",
    image: IMG_FUNDA_IPHONE,
    price: 7900,
    options: [
      { label: "Color", values: COLORES_FUNDA },
      { label: "Modelo", values: MODELOS_IPHONE_11_16 },
    ],
    category: "accesorios-apple",
  },
  {
    id: "apl-4",
    name: "Funda de iPhone 17 silicona",
    description: "Funda de silicona para iPhone 17. Elegí el color.",
    image: IMG_FUNDA_IPHONE,
    price: 7900,
    options: [{ label: "Color", values: COLORES_FUNDA }],
    category: "accesorios-apple",
  },
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
   Categorías con sus datos de sección
   ────────────────────────────────────────────── */
export const categories = [
  { id: "paquetes", label: "Paquetes de Figuritas", icon: "Package" },
  { id: "albumes", label: "Álbumes", icon: "BookOpen" },
  { id: "indumentaria", label: "Indumentaria", icon: "Shirt" },
  { id: "accesorios", label: "Promos", icon: "Watch" },
  { id: "accesorios-apple", label: "Accesorios Apple", icon: "Smartphone" },
] as const;

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
  whatsapp: "2613900039",
  whatsappLink: "https://wa.me/5492613900039",
  email: "Gmaildeprueba@gmail.com",
  emailLink: "mailto:Gmaildeprueba@gmail.com",
  shippingNote: "Realizamos envíos a toda Argentina.",
  location: "Buenos Aires, Argentina",
  instagram: "https://instagram.com/argentina.distributor",
  twitter: "https://twitter.com/argentina_dist",
  facebook: "https://facebook.com/argentina.distributor",
  tiktok: "https://tiktok.com/@argentina.distributor",
};

/* ──────────────────────────────────────────────
   Nombre de la tienda (centralizado)
   ────────────────────────────────────────────── */
export const storeName = "Argentina Distributor";
export const storeTagline = "Figuritas & Merchandising";