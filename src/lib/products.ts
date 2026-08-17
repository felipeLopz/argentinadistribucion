import type { BadgeManualId } from "./promos";

/* Grupo de opciones obligatorias de un producto (ej. Color, Modelo).
   Es una lista de valores a elegir; el stock de cada valor lo resuelve
   stock-config.ts, que puede llevarlo con menos detalle que las opciones. */
export interface ProductOption {
  label: string;
  values: string[];
}

/** Las categorías del catálogo. Las etiquetas de los chips salen de
 *  CATEGORIAS, más abajo. */
export type Categoria = "accesorios" | "vapers" | "termos" | "accesorios-apple";

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

  /** Categoría principal. Es la que muestra el badge del modal. */
  category: Categoria;

  /** Categorías ADICIONALES en las que también aparece. Un producto puede
   *  estar en varias secciones sin dejar de ser uno solo: `products` lo
   *  guarda una única vez, así que "Ver todo" lo muestra una vez y el
   *  contador de cada chip lo cuenta.
   *
   *  Ojo: por eso la suma de los contadores de los chips puede ser mayor
   *  que el total de "Ver todo". Es esperado, no un error de conteo. */
  categoriasExtra?: Categoria[];

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

/** Todas las categorías en las que aparece un producto: la principal más
 *  las adicionales. Es la función que tiene que usar cualquier filtro, en
 *  lugar de comparar contra `category` a secas. */
export function categoriasDe(product: Product): Categoria[] {
  return product.categoriasExtra?.length
    ? [product.category, ...product.categoriasExtra]
    : [product.category];
}

/* ──────────────────────────────────────────────
   Imágenes del catálogo.
   Los vapers y los termos todavía no tienen foto: se omite `image` y la
   card/modal muestran el placeholder.
   Hay fotos compartidas por más de un producto, a propósito.
   ────────────────────────────────────────────── */
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
    /* Aparece también en Accesorios Apple, siendo UN solo producto. */
    categoriasExtra: ["accesorios-apple"],
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
    name: "Cable y cabezal USB C - USB C",
    description:
      "Cable de 1 metro con USB C en los dos extremos, más cabezal de 20W para carga rápida. Los dos en su caja original.",
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

  /* ═══ ACCESORIOS APPLE ═══
     Ojo: la Silicone Case también sale acá, vía `categoriasExtra`. Está
     definida arriba, en Promos, y es UN solo producto. */
  {
    id: "apl-2",
    name: "AirPods",
    description: "Auriculares inalámbricos con estuche de carga.",
    image: IMG_AIRPODS_PRO_2,
    price: 52300,
    category: "accesorios-apple",
  },
  {
    id: "apl-3",
    name: "Cargadores USB C - USB C",
    description:
      "Cargadores con cable USB C en los dos extremos, más el cabezal para carga rápida.",
    image: IMG_CABLE_CABEZAL,
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
