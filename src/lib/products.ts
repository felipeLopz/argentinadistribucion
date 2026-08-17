import type { BadgeManualId } from "./promos";

/* Grupo de opciones obligatorias de un producto (ej. Color, Modelo).
   Es una lista de valores a elegir; el stock de cada valor lo resuelve
   stock-config.ts, que puede llevarlo con menos detalle que las opciones. */
export interface ProductOption {
  label: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Ruta de la foto. **Opcional**: los productos que todavía no tienen
   *  foto se muestran con el placeholder `SinFoto`. Cuando llegue la real,
   *  alcanza con agregar acá la ruta. */
  image?: string;
  price?: number;
  options?: ProductOption[];
  category: "accesorios" | "vapers" | "termos" | "accesorios-apple";
  status?: "consultar" | "proximamente";

  /* ─── Promo por cantidad (pack) ───
     Precio TOTAL del pack según cuántas unidades lleva:
     packPrecios[0] = 1 unidad … packPrecios[n-1] = n unidades.
     El tope del pack es packPrecios.length; pasado ese tope se deriva la
     consulta a WhatsApp.

     El carrito NO entiende de promos: el modal resuelve el precio y manda
     el pack ya armado como un ítem de cantidad 1. */
  packPrecios?: number[];

  /** Nombre corto con el que el ítem entra al carrito y al mensaje de
   *  WhatsApp, cuando el del catálogo es demasiado largo para esa línea.
   *  Si no está, se usa `name`. */
  cartName?: string;

  /** true = siempre disponible: no lleva stock en la base. Ni la web lo
   *  consulta, ni el seed le crea filas, ni el panel lo lista. */
  sinStock?: boolean;

  /* ─── Promoción (ver src/lib/promos.ts) ───
     Se marcan a mano por ahora; están pensados para migrar al panel de
     admin sin tocar componentes. El badge "ÚLTIMOS N" NO se marca acá:
     sale solo del stock.

     ⚠️ Los productos de categorías reguladas (hoy `vapers`) IGNORAN estos
     dos campos: es una regla del sistema, no algo que haya que recordar. */

  /** Badges manuales. Si hay más de uno, se muestra el de mayor prioridad. */
  badges?: BadgeManualId[];

  /** Precio tachado. Se ignora si no es mayor al precio actual. */
  precioAnterior?: number;
}

/* Opciones reutilizables para los protectores de iPhone */
const MODELOS_IPHONE_11_16 = ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16"];

/* ──────────────────────────────────────────────
   Imágenes del catálogo.
   Los vapers y los termos todavía no tienen foto: se omite `image` y la
   card/modal muestran el placeholder.
   ────────────────────────────────────────────── */
const IMG_CARGADOR = "/images/cargador.webp";
const IMG_FUNDA_IPHONE = "/images/funda-iphone.webp";
const IMG_AIRPODS = "/images/airpods.webp";
const IMG_SILICONE_CASE = "/images/silicone-case.webp";
const IMG_AIRPODS_PRO_2 = "/images/airpods-pro-2.webp";
const IMG_CABLE_CABEZAL = "/images/cable-cabezal-usbc.webp";

export const products: Product[] = [
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
    /* EJEMPLO: con precio anterior, el badge OFERTA sale solo. */
    precioAnterior: 32000,
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

  // ═══ VAPERS ═══
  /* Descripciones deliberadamente técnicas: formato, batería, capacidad.
     Sin adjetivos promocionales ni nada que invite al consumo. */
  {
    id: "vap-1",
    name: "Vaper Recargable Pod - Negro",
    description: "Dispositivo recargable con cápsula reemplazable y carga por USB-C. Color negro.",
    price: 35000,
    /* EJEMPLO A PROPÓSITO: marcado con badge y precio anterior, pero la
       categoría `vapers` no admite promoción, así que NO se muestra
       ninguna de las dos cosas. Sirve para comprobar la regla. */
    badges: ["oferta"],
    precioAnterior: 42000,
    category: "vapers",
  },
  {
    id: "vap-2",
    name: "Vaper Recargable Pod - Azul",
    description: "Dispositivo recargable con cápsula reemplazable y carga por USB-C. Color azul.",
    price: 35000,
    category: "vapers",
  },
  {
    id: "vap-3",
    name: "Vaper Recargable Pod - Plata",
    description: "Dispositivo recargable con cápsula reemplazable y carga por USB-C. Color plata.",
    price: 35000,
    category: "vapers",
  },
  {
    id: "vap-4",
    name: "Vaper Recargable Pro - Negro",
    description:
      "Dispositivo recargable de mayor capacidad de batería, con cápsula reemplazable y carga por USB-C. Color negro.",
    price: 35000,
    category: "vapers",
  },
  {
    id: "vap-5",
    name: "Vaper Recargable Pro - Grafito",
    description:
      "Dispositivo recargable de mayor capacidad de batería, con cápsula reemplazable y carga por USB-C. Color grafito.",
    price: 35000,
    category: "vapers",
  },
  {
    id: "vap-6",
    name: "Liquido para Vaper - Tabaco 30ml",
    description: "Líquido para dispositivos recargables. Frasco de 30 ml. Perfil de sabor tabaco.",
    price: 35000,
    category: "vapers",
  },
  {
    id: "vap-7",
    name: "Liquido para Vaper - Mentol 30ml",
    description: "Líquido para dispositivos recargables. Frasco de 30 ml. Perfil de sabor mentol.",
    price: 35000,
    category: "vapers",
  },
  {
    id: "vap-8",
    name: "Kit Vaper Recargable + Liquido",
    description:
      "Incluye un dispositivo recargable con cápsula reemplazable, cable de carga USB-C y un frasco de líquido de 30 ml.",
    price: 35000,
    category: "vapers",
  },

  // ═══ TERMOS ═══
  {
    id: "ter-1",
    name: "Termo Stanley 750ml - Rosa",
    description: "Termo de acero inoxidable de 750 ml, con tapa a rosca y sorbete. Color rosa.",
    price: 45000,
    /* EJEMPLO */
    badges: ["mas-comprados"],
    category: "termos",
  },
  {
    id: "ter-2",
    name: "Termo Stanley 750ml - Azul",
    description: "Termo de acero inoxidable de 750 ml, con tapa a rosca y sorbete. Color azul.",
    price: 45000,
    /* EJEMPLO: ahorro de $7.000 (13%) */
    precioAnterior: 52000,
    category: "termos",
  },
  {
    id: "ter-3",
    name: "Termo Stanley 750ml - Blanco",
    description: "Termo de acero inoxidable de 750 ml, con tapa a rosca y sorbete. Color blanco.",
    price: 45000,
    /* EJEMPLO de prioridad: con dos badges marcados gana NUEVO INGRESO. */
    badges: ["mas-comprados", "nuevo"],
    category: "termos",
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
    /* EJEMPLO */
    badges: ["nuevo"],
    category: "accesorios-apple",
  },
  {
    id: "apl-2",
    name: "AirPods",
    description: "Auriculares inalámbricos con estuche de carga.",
    image: IMG_AIRPODS,
    price: 52300,
    category: "accesorios-apple",
  },
  {
    id: "apl-3",
    name: "Cargadores",
    description: "Cargadores para iPhone con cable y cabezal.",
    image: IMG_CARGADOR,
    price: 11400,
    category: "accesorios-apple",
  },
];

/* ──────────────────────────────────────────────
   Navegación del navbar.

   Son SOLO anclas de scroll. Las categorías NO van acá: viven en los
   chips de la barra de filtros del catálogo (ver CATEGORIAS abajo), que
   filtran en lugar de scrollear. Meterlas en los dos lados daría dos
   formas distintas de hacer lo mismo.
   ────────────────────────────────────────────── */
export const navSections = [
  { id: "inicio", label: "Inicio" },
  { id: "contacto", label: "Contacto" },
] as const;

/* ──────────────────────────────────────────────
   Categorías del catálogo — los chips de la barra de filtros.

   "todo" no es una categoría de producto: es el estado sin filtrar.
   Las etiquetas son cortas a propósito, porque en mobile los chips van
   en una fila que scrollea.
   ────────────────────────────────────────────── */
export const CATEGORIAS = [
  { id: "todo", label: "Ver todo" },
  { id: "accesorios", label: "Promos" },
  { id: "vapers", label: "Vapers" },
  { id: "termos", label: "Termos" },
  { id: "accesorios-apple", label: "Apple" },
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
export const storeName = "Distribuidor Argentino KOI";
