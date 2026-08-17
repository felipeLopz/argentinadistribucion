# CLAUDE.md — Estado del proyecto (Distribuidor Argentino KOI)

> Archivo de memoria entre sesiones. Leelo al retomar el proyecto para saber
> todo lo necesario sin re-explicar. **Actualizalo al terminar cada sesión con
> cambios relevantes** (ver sección 10).

---

## 0. ⚠️ Antes de tocar nada: NO editar archivos con PowerShell

**Nunca** uses `Get-Content` / `Set-Content` para modificar archivos del repo.
En Windows PowerShell 5.1, `Get-Content` **lee como ANSI**, así que un archivo
UTF-8 con acentos se corrompe, y `Set-Content -Encoding utf8` lo vuelve a
escribir **doble-encodeado** (`ó` → `Ã³`, `…` → `â€¦`).

Ya pasó una vez: rompió `ProductCard.tsx` y llegó a producción con
**"Verificando stockâ€¦"**, **"Promo por cantidad Â· hasta 4"** y
**"PrÃ³ximamente"** a la vista de los clientes.

- Para **editar**: usá las herramientas de edición de archivos (Edit / Write).
- Para **borrar**: `Remove-Item` es seguro (no reescribe contenido).
- Si sospechás que pasó, escaneá el repo buscando `Ã` seguido de otro carácter,
  `â€`, o el carácter de reemplazo U+FFFD.

---

## 1. Qué es el proyecto

Tienda web **"Distribuidor Argentino KOI"**: venta de **vapers, termos Stanley y
accesorios Apple**.

> Historia: el sitio nació como tienda de figuritas del Mundial ("Argentina
> Distributor") y se le hizo un rebrand completo de rubro en 3 fases. No queda
> nada del rubro viejo. Si ves referencias a figuritas, álbumes o indumentaria en
> algún lado, es un resto y hay que sacarlo.

- **Modelo de venta**: la venta **NO se procesa en la web**. El usuario arma un
  carrito y al finalizar se genera un **link de WhatsApp con el pedido** (productos,
  cantidades, total y datos del cliente) para cerrar la venta por chat.
- **Modelo de negocio (importante para decisiones)**: la página se **vende una sola
  vez** a un cliente; las actualizaciones posteriores de productos son un **servicio
  aparte que se cobra**. Por eso **NO se quiere un CMS ni autogestión**: el catálogo
  se edita **a mano en el código** (`src/lib/products.ts`).

## 2. Stack y estructura

**Stack** (ver `package.json`): Next.js `^16` (App Router) · React `^19` ·
Tailwind CSS `^4` (via `@tailwindcss/postcss`) · framer-motion `^12` ·
lucide-react (iconos) · tipografías con `next/font` (Archivo) · TypeScript `^5`.

**Base de datos**: **Neon Postgres** (`@neondatabase/serverless`), conectada desde
Vercel. **Guarda SOLO el stock** — el catálogo (nombres, precios, imágenes,
opciones) sigue viviendo a mano en `products.ts`. Auth del panel con `bcryptjs`
(hash de contraseña) + `jose` (JWT de sesión).

**Mapa de archivos clave**

| Ruta | Para qué sirve |
|---|---|
| `src/lib/products.ts` | **Catálogo** (array `products` + interface `Product`), `Categoria`, `categoriasDe()`, `CATEGORIAS` (chips), `navSections` (anclas del navbar), `contactConfig`, `storeName`. **Se edita a mano.** Campos opcionales del producto: `image` (si falta, va el placeholder), `categoriasExtra` (multi-categoría), `packPrecios` (promo por cantidad), `cartName`, `sinStock`, `badges`, `precioAnterior`. |
| `src/lib/promos.ts` | **Lógica pura de badges y ofertas**: `resolverPromo()`, la cadena de prioridad, el cálculo del ahorro, `UMBRAL_URGENCIA` y `admitePromocion()` (la regla que excluye a los vapers). Ver sección 6. |
| `src/hooks/use-promocion.ts` | **De dónde salen** los datos promocionales. Hoy, del catálogo. **Es la única costura a cambiar** para editarlos desde el panel. |
| `src/lib/filtros.ts` | **Lógica pura de los filtros**, sin React ni base: `Filtros`, `FILTROS_VACIOS`, `ORDENES`, `aplicarFiltros`, `coincideBusqueda`, `hayFiltrosActivos`, `rangoDePrecios`, `diagnosticarVacio`, y el ida y vuelta con la URL (`serializarFiltros` / `parsearFiltros`). **Es el punto de extensión para filtros nuevos.** |
| `src/lib/filtros-context.tsx` | Estado de los filtros (reducer + contexto) y **sincronización con la URL** (History API). Mismo patrón que `CartProvider`/`StockProvider`. |
| `src/lib/cart-context.tsx` | Lógica del **carrito**: React Context + localStorage (clave `argentina-distributor-cart`). `addItem/removeItem/updateQuantity/clearCart` + totales. |
| `src/lib/utils.ts` | Helper `cn()` (clases). |
| `src/app/layout.tsx` | Layout raíz: fuentes, metadata SEO, favicon (🐟), `CartProvider`, `StockProvider`, `Toaster`. |
| `src/app/page.tsx` | **Home**: `FiltrosProvider` + Navbar / Hero / **Catalogo** / Contacto / Footer. El carrito y el modal son estado local. |
| `src/app/carrito/page.tsx` | **Checkout**: formulario + validación + **genera el mensaje de WhatsApp** (`window.open(wa.me?text=...)`) + pantalla "pedido enviado". |
| `src/app/globals.css` | Tailwind + **tokens del theme** + utilidades (`.font-archivo`, `.text-gold-gradient`, `.hero-glow`, etc.). |
| `src/components/home/` | Componentes de la landing (ver abajo). |
| `src/components/ui/` | Solo `toast.tsx` + `toaster.tsx` (montado en layout, hoy no se dispara). |
| `src/hooks/use-toast.ts` | Hook del toast. |
| `src/hooks/use-dialogo-accesible.ts` | Foco, Escape y focus trap de los diálogos. Lo comparten `ProductModal` y `CartPanel`. |
| `public/images/` | Imágenes de productos referenciadas por `products.ts`. |
| `src/lib/stock-config.ts` | **Granularidad del stock** (`STOCK_GROUPS`), derivación de claves y `llevaStock` (qué productos NO llevan stock). Puro: lo usan el navegador, la web pública y el panel. |
| `src/lib/db.ts` | Cliente de Neon. **Solo servidor**, conexión perezosa. |
| `src/lib/stock.ts` | Lectura/escritura del stock en la base. **Solo servidor**. |
| `src/lib/stock-context.tsx` | `StockProvider`: la web pública lee `/api/stock` desde el navegador. |
| `src/lib/auth-session.ts` | JWT + cookie. **Compatible con Edge** (sin bcrypt): lo usa el middleware. |
| `src/lib/auth.ts` | Parseo de `ADMIN_USERS`, bcrypt, `requerirSesion()`. Runtime Node. |
| `src/lib/rate-limit.ts` | Límite de intentos de login **contra la base** (tabla `login_attempts`). |
| `src/lib/site.ts` | **URL de producción del sitio** (`SITE_URL`). Única fuente de verdad: la usan `metadataBase` y el sitemap. |
| `src/middleware.ts` | Primera barrera del panel (matcher acotado a `/admindistribucion` y `/api/admindistribucion`). |
| `src/app/api/stock/route.ts` | **Endpoint público, SOLO LECTURA** del stock. |
| `src/app/api/stock/seed/route.ts` | Carga inicial/sincronización, protegida por `SEED_TOKEN`. Idempotente. |
| `src/app/api/admindistribucion/` | Rutas privadas: `login`, `logout`, `stock` (lectura + escrituras). |
| `src/app/admindistribucion/` | **Panel privado**: `login/page.tsx`, `page.tsx`, `PanelStock.tsx`, `BotonSalir.tsx`. |
| `scripts/hash-password.mjs` | Genera el hash bcrypt de una contraseña (entrada oculta). |
| `src/app/opengraph-image.tsx` | Genera la **imagen de la tarjeta al compartir** (PNG 1200x630) con el theme del sitio. |
| `src/app/twitter-image.tsx` | Reexporta la de arriba para Twitter/X. |
| `src/app/sitemap.ts` | Genera `/sitemap.xml`. **Sólo la home**. |

**`src/components/home/`**

| Componente | Para qué sirve |
|---|---|
| `Navbar` | Logo, buscador (lee del contexto de filtros), links **Inicio** y **Contacto**, y el carrito. **Sin categorías**, a propósito. |
| `Hero` | Título "KOI tu tienda de confianza", pill del rubro, CTA a `#catalogo`. |
| `Catalogo` | **Sección única del catálogo**: barra de filtros + grilla plana + estado vacío. Acá vive el arreglo del "tirón" (ver sección 4). |
| `BarraFiltros` | Chips de categoría, rango de precio, orden y contador. **Sticky** abajo del navbar. En mobile, precio y orden se pliegan detrás de "Filtros". |
| `CatalogoVacio` | **Único** estado vacío: se diagnostica solo (texto / precio / categoría / combinación) y ofrece un atajo puntual + "Limpiar filtros". |
| `ProductCard` | Tarjeta. Clickeable, abre el modal. Cuelga el badge sobre la foto. |
| `CardPrecio` | Bloque de **precio + disponibilidad**: precio anterior tachado, ahorro, y el renglón "Quedan N" / "¡Últimas N unidades!". |
| `BadgeProducto` | La **pastilla de promoción**, sin posicionamiento: la ubica quien la usa (la card, absoluta sobre la foto; el modal, en flujo al lado de la categoría). |
| `SinFoto` | **Placeholder** de los productos sin imagen. 3 tamaños (`sm`/`md`/`lg`) para carrito, card y modal. |
| `ProductModal` | Vista rápida: opciones, stock, cantidad, promo por cantidad. |
| `CartPanel` | Panel lateral del carrito. |
| `ContactSection`, `Footer`, `ScrollToTop`, `categories` | Contacto, pie (con links de categoría que activan el chip), botón "volver arriba", e iconos/títulos por categoría. |

**Eliminados** (no reintroducir): `ProductGrid.tsx` (una sección por categoría) y
`SearchEmptyState.tsx` (estado vacío sólo de búsqueda). Los reemplazan `Catalogo`
y `CatalogoVacio`.

## 3. Diseño

- **Theme "Violeta Profundo"**: oscuro (fondo violeta) con **acentos lila y rosa**,
  aplicado a todo el sitio **y al panel de admin**.
- **Tokens de color**: en `src/app/globals.css`, bloque `:root`.
  - **Fondos**: `--navy #140f26` (base), `--navy-2 #1c1436` (superficies).
  - **Acciones** (botones, pill de precio, chip activo): `--blue #7c3aed`,
    `--blue-l #8b5cf6`. El gradiente va `--blue-l` → `--blue`.
  - **Realces** (subrayado del navbar, título del hero, íconos): `--gold #a78bfa`
    (lila), `--gold-l #f0abfc` (rosa).
  - **Texto y bordes**: `--ink #efeafe`, `--mut #a396c9`,
    `--line rgba(167,139,250,.16)`.
  ⚠️ **Los nombres de los tokens quedaron del theme viejo a propósito** (`--navy`,
  `--blue`, `--gold`): renombrarlos obligaba a tocar ~328 usos. Lo que cambió es el
  valor, no el nombre. Lo mismo con `.text-gold-gradient`, que hoy es lila → rosa.
- **Texto sobre los botones de acento**: `#140f26`. El lila y el rosa son claros, así
  que **el blanco NO pasa contraste** (1.76:1); `#140f26` da 6.85:1 (WCAG AA).
- **Colores que NO siguen la paleta** (a propósito): verde de WhatsApp
  (`#25a35a` / `#37c46f`), rosa de Instagram (`#e46bb0`) y el rojo de error/agotado.
- **Tipografía**: **Archivo** (Google Fonts vía `next/font`, variable
  `--font-archivo`); se aplica con la clase `.font-archivo`.
- **Marca**: ícono **pez koi** (`Fish` de lucide) en navbar, footer y checkout;
  favicon 🐟. Es neutro respecto de los productos, que van a seguir cambiando.
- **Reglas de las cards** (`ProductCard.tsx`):
  - Son **clickeables y abren el modal**. **No** tienen botón "Agregar" ni badge de
    categoría. El **precio** va en una **pill azul centrada** (`PRICE_PILL`, en
    `CardPrecio.tsx`).
  - **Sin foto**: se renderiza `SinFoto` en el mismo hueco, así el layout no cambia.
  - **Badge de promoción**: arriba a la izquierda de la foto, uno solo (ver sección 6).
  - **Promo por cantidad ("Silicone Case")**: abajo del precio dice
    "Promo por cantidad · hasta 4" en vez de la disponibilidad. El resto pasa en el
    modal: **tabla de precios** visible al abrir, selector con **tope 4** y aviso con
    botón de WhatsApp si se lo intenta pasar.

## 4. Decisiones y convenciones ya tomadas

- **NO tocar sin cuidado** (es la conversión de la venta):
  - La lógica del carrito → `src/lib/cart-context.tsx`.
  - La **generación del mensaje de WhatsApp del checkout** → función `confirmar()` en
    `src/app/carrito/page.tsx`.
- **Patrón para promos con precio raro** (escalonado, combos, etc.): **el carrito NO
  entiende de promos**; solo hace `precio × cantidad`. El precio se resuelve *antes*
  y el ítem entra ya armado. Es lo que hace la Silicone Case: el pack entra con
  `price` = precio del pack y `cantidad: 1`, y la `variante` ("3 fundas") es lo que le
  da **identidad propia** — por eso dos packs de distinto tamaño quedan como dos ítems
  separados. Si aparece otra promo rara, seguir este camino en vez de tocar
  `cart-context.tsx`.
- **El catálogo es una sola sección filtrable** (`#catalogo`), no secciones apiladas.
  La **grilla es plana** a propósito: si estuviera agrupada por categoría, ordenar por
  precio sólo ordenaría dentro de cada grupo. La categoría la comunica el chip activo.
- **Un producto puede estar en VARIAS categorías** (`categoriasExtra`). Hoy la Silicone
  Case sale en **Promos** y en **Accesorios Apple**, siendo **un solo producto**.
  - `products` lo guarda **una única vez**, así que "Ver todo" lo muestra una vez: la
    deduplicación sale gratis, porque filtrar una lista nunca repite elementos.
    ⚠️ Si algún día se arma la grilla concatenando categorías, ahí sí aparecería
    duplicado. No hacerlo: filtrar con `categoriasDe()`, nunca concatenar.
  - ⚠️ **La suma de los contadores de los chips es mayor que "Ver todo"** (hoy 17
    contra 16). Es **esperado**: la Silicone Case cuenta en sus dos categorías.
  - `category` sigue siendo la **principal** (es la que muestra el badge del modal);
    `categoriasExtra` son las adicionales.
- **Las categorías NO van en el navbar.** Viven sólo en los chips. Tenerlas en los dos
  lados daría dos formas distintas de hacer lo mismo. `navSections` quedó con
  **Inicio** y **Contacto** nada más; el footer sí lista categorías, pero sus links
  **activan el chip**, no scrollean.
- **El "tirón" al cambiar de filtro** (`Catalogo.tsx`): pasar de 18 cards a 3 acorta el
  documento y el navegador **clampea** el scroll. Se arregla con el **orden de las
  operaciones**: primero el scroll (instantáneo, y sólo si el usuario está por debajo
  del inicio de la grilla), después el cambio de filtro. Corregir *después* no sirve:
  las cards salen con animación, así que la altura colapsa un frame más tarde.
  ⚠️ **No volver a poner scroll suave acá**: compite con el cambio de altura.
- **Eliminado a propósito (NO reintroducir)**:
  - La página de detalle `/producto/[id]`.
  - El **botón flotante del carrito** (`CartIcon`) y el **flotante de WhatsApp**.
  - El **sistema de talles** (`talleStock`, `stockKeyDeTalle`, `stockDeTalle` y el
    selector de talles del modal). Se fue con la camiseta; no hay producto con talles.
  - Quedó como único flotante el **"Volver arriba"** (`ScrollToTop`).
- **Hero**: el botón secundario **"Consultar por promos"** tiene un mensaje **fijo**:
  `Hola! Quiero consultar por las promos activas.`
- **Flujo de trabajo**: el usuario prueba/visualiza él mismo en el navegador.

## 5. El sistema de filtros

**Cómo funciona**

- **Chips de categoría**: `Ver todo | Promos | Vapers | Termos | Apple`, definidos en
  `CATEGORIAS` (`products.ts`). `"todo"` no es una categoría de producto: es el estado
  sin filtrar.
- **Buscador**: el del navbar. **No hay dos mecanismos**: escribe en el mismo estado
  que lee la grilla. Matchea por nombre **o** descripción, sin distinguir mayúsculas.
- **Precio**: rango desde/hasta. ⚠️ Con un tope activo, los productos **sin precio**
  quedan afuera (hoy no aplica: los 18 tienen precio).
- **Orden**: por defecto (el de `products.ts`), precio asc, precio desc, alfabético.
  El default es el orden del archivo **a propósito**: se controla a mano qué va primero.
- **Contador**: cuántos productos hay en la vista actual.
- **Estado vacío**: `CatalogoVacio` **se diagnostica solo** con `diagnosticarVacio()`,
  que afloja un filtro por vez y ve cuál devuelve resultados. Prioridad
  **precio → categoría → búsqueda**: lo que el usuario escribió es lo que más quiere
  conservar, así que se sugiere aflojar los controles antes de abandonar la búsqueda.

**Dónde vive el estado**

- `filtros.ts` — **puro**. Toda la semántica de "qué se muestra y en qué orden".
  Para sumar un filtro nuevo (ej. "Nuevos / Usados" cuando entren los celulares
  usados): un campo en `Filtros`, su default en `FILTROS_VACIOS`, su condición en
  `aplicarFiltros`, y un control. **Ningún componente cambia.**
- `filtros-context.tsx` — el estado de React (reducer) + la URL. Expone `filtros`,
  `resultados`, `total`, `hayFiltros`, `tocado` y los setters. El provider va en
  `page.tsx`, **no** en el layout raíz: `/carrito` no necesita filtros.
- `tocado` = el usuario ya movió algún filtro. Lo usa la grilla para **escalonar la
  entrada de las cards sólo en la carga inicial**.

**La URL — por qué History API nativa**

Los filtros se reflejan en `?cat=&q=&min=&max=&orden=` (sólo lo distinto del default),
con `history.replaceState`, debounce de 300 ms y `popstate` para atrás/adelante.

⚠️ **No migrar a `useSearchParams`.** Ese hook obliga a envolver el catálogo en
`<Suspense>`, y eso **saca la grilla del HTML prerenderizado**, perdiendo el SEO que
ya está hecho. Con la API nativa, `/` sigue siendo `○ Static`.

La URL se lee en un **efecto** y no en el estado inicial, también a propósito: la home
se prerenderiza con los filtros vacíos, así que arrancar distinto en el cliente
rompería la hidratación. El costo es un frame con el catálogo sin filtrar.

## 6. Badges, ofertas y urgencia

**Qué se muestra**

- **Badges manuales**, marcados en `products.ts` (`badges: [...]`): **OFERTA**,
  **NUEVO INGRESO** y **MÁS COMPRADO**. Van arriba a la izquierda de la foto, y
  también en el modal al lado del badge de categoría.
- **Precio anterior tachado** (`precioAnterior`), con el ahorro en pesos y porcentaje
  ("Ahorrás $7.000 (22%)"). Se muestra en la card y en el modal.
  Un dato mal cargado (anterior **igual o menor** al actual) **se ignora**, en vez de
  mostrar un ahorro negativo o 0%.
- **"¡Últimas N unidades!"**: variante urgente del renglón "Quedan N", cuando el stock
  total es **≤ 3** (`UMBRAL_URGENCIA`). Sale **solo del stock**, no se marca a mano.

**Se muestra UN SOLO badge**, por prioridad:

> **OFERTA → NUEVO INGRESO → MÁS COMPRADO**

Tres pastillas apiladas sobre una foto de 262px tapan el producto y se anulan entre sí.
El orden va de lo más accionable a lo más informativo.

⚠️ **La urgencia NO compite por el badge.** Vive en el renglón de disponibilidad, así
que un producto con poco stock **y** oferta muestra **las dos cosas**: badge OFERTA
arriba, "¡Últimas 2 unidades!" abajo. (Hubo un badge "ÚLTIMOS N" en la primera versión;
se quitó porque duplicaba el mensaje del renglón.)

**Agotado apaga la promoción**: sin stock no se muestra ni el badge ni la oferta. El
cartel de "Agotado" manda, y un "Ahorrás $7.000" en lila brillante al lado de "Agotado"
se contradice.

**La oferta pone su badge sola**: con sólo cargar `precioAnterior` aparece OFERTA, sin
marcar nada más.

### ⚠️ Regla del sistema: los vapers NO llevan promoción

`CATEGORIAS_SIN_PROMOCION` en `promos.ts` excluye a `vapers` de **todo**: sin badges,
sin precio tachado y sin urgencia. Sí muestran el renglón neutro "Quedan N".

**El motivo es legal, no estético**: son productos con nicotina y su publicidad está
regulada. **No quitar esta regla.**

Es una **regla del sistema y no una convención**: `resolverPromo` la aplica *antes* de
mirar los datos, así que un vaper marcado a mano igual no muestra nada. De hecho
`vap-1` está marcado a propósito con `badges: ["oferta"]` y `precioAnterior: 42000`
**para poder comprobarlo** — si alguna vez le aparece un badge, la regla se rompió.

Con multi-categoría alcanza con que **una** de las categorías del producto esté
restringida para que no lleve promoción: se falla del lado seguro.

### Cómo migrar los badges al panel de admin

Está preparado para que sea **agregar la fuente de datos, no rehacer componentes**.
Ningún componente lee `product.badges` ni `product.precioAnterior`: consumen el objeto
`PromoResuelta` que devuelve `resolverPromo`.

```
products.ts ──► use-promocion.ts ──► promos.ts ──► BadgeProducto / CardPrecio / ProductModal
 (la fuente)     (LA COSTURA)        (las reglas)          (sólo dibujan)
```

**`src/hooks/use-promocion.ts` es el único archivo a cambiar.** Los pasos, con el mismo
patrón que ya usa el stock:

1. tabla `promos` (`product_id`, `badges`, `precio_anterior`) y su endpoint público de
   solo lectura, igual que `/api/stock`;
2. un `PromoProvider` que la lea desde el navegador, calcado de `StockProvider`;
3. en `use-promocion.ts`, reemplazar `datosDelCatalogo(product)` por
   `usePromoContext().datosDe(product.id)`.

`promos.ts` y los tres componentes **no se tocan**. Los campos de `products.ts` pueden
quedar como fallback o eliminarse; se decide en ese momento.

## 7. Estado actual y pendientes

**Catálogo actual — 16 productos, 4 categorías** (en `products.ts`, en este orden):

| Categoría (`category`) | Chip | Productos |
|---|---|---|
| `accesorios` | **Promos** | Silicone Case 11-17 (promo por cantidad, sin stock), AirPods Pro 2, Cable y cabezal USB C - USB C |
| `vapers` | **Vapers** | 5 dispositivos recargables + 2 líquidos 30ml + 1 kit — todos $35.000, **sin foto** |
| `termos` | **Termos** | Termo Stanley 750ml en rosa, azul y blanco — $45.000, **sin foto** |
| `accesorios-apple` | **Apple** | **Silicone Case** (vía `categoriasExtra`), AirPods, Cargadores USB C - USB C |

⚠️ Los contadores dan **3 · 8 · 3 · 3 = 17** contra **16** de "Ver todo": la Silicone
Case cuenta en dos categorías. Es esperado.

**"iPhone" en el nombre de la Silicone Case es a propósito.** El rubro se nombra
"accesorios **Apple**" en todos lados (hero, footer, metadata), pero ese producto dice
"(iPhone 11 al 17)" porque indica **qué modelos le entran**, no el rubro. Cambiarlo a
"Apple 11 al 17" no significaría nada.

Las descripciones de los vapers son **deliberadamente técnicas** (formato, batería,
capacidad), sin adjetivos promocionales ni nada que invite al consumo. Es un producto
regulado: si se amplía, mantener ese tono.

**Terminado** ✅

- **Sistema de stock real** (Neon Postgres). Hoy cada producto lleva **una fila** con
  clave `""`; los marcados `sinStock` **no llevan ninguna**. Son **15 filas** en total.
  La web muestra **"Quedan N" / "Agotado"** y **bloquea agregar** lo agotado; mientras
  carga dice "Verificando stock…". `/api/stock` es **SOLO LECTURA** (POST/PUT/DELETE
  → 405). **Fallar cerrado**: si la base no responde, todo se trata como agotado — la
  **única** excepción es `sinStock`.
  ⚠️ **`STOCK_GROUPS` quedó VACÍO** al salir los protectores: ningún producto tiene
  `options`. La maquinaria de variantes **se conservó a propósito** — los celulares
  usados que vienen van a necesitarla (color, capacidad). No borrarla.
- **Panel privado** en **`/admindistribucion`**, no enlazado y con `noindex`. Login con
  email + bcrypt, sesión **JWT en cookie `HttpOnly` + `Secure` + `SameSite=Lax`** de 7
  días. Permite **ver, editar, descontar (−1) y agotar**, con buscador. Los casilleros
  se **derivan de `stock-config.ts`** y las escrituras **rechazan claves fuera de esa
  granularidad**. Doble barrera (middleware + revalidación por handler) y **5 intentos
  de login / 15 min**.
- **Variables de entorno en Vercel** (Production + Preview), **ninguna con
  `NEXT_PUBLIC_`**: `DATABASE_URL`, `SEED_TOKEN`, `ADMIN_USERS` (`email:hash`, varios
  separados por coma) y `AUTH_SECRET`.
- **Auditoría técnica**: imágenes WebP + `next/image` (−83% de transferencia), Open
  Graph + Twitter cards con **imagen OG generada**, `metadataBase`, sitemap, diálogos
  accesibles (`role="dialog"`, Escape, focus trap), y `noopener,noreferrer` en todos
  los `window.open`.
- **Rebrand a "Distribuidor Argentino KOI"** (Fase 1): nombre, metadata, imagen OG,
  favicon 🐟 e ícono de marca. Cero rastros del rubro viejo.
- **Reestructura del catálogo** (Fase 2): fuera figuritas, álbumes e indumentaria;
  entran 8 vapers y 3 termos; placeholder `SinFoto` para los productos sin imagen.
- **Catálogo filtrable** (Fase 3): chips, precio, orden, contador, estado vacío único,
  URL con History API, arreglo del tirón, y `CardPrecio` extraído.
- **Badges y ofertas** (Fase 4, ver sección 6): badges manuales, precio anterior
  tachado con el ahorro, "¡Últimas N unidades!" con umbral 3, la regla que excluye a
  los vapers, y la resolución aislada para migrarla al panel.
- **Actualización de accesorios Apple**: fuera los protectores `apl-5`/`apl-6`; fotos
  reasignadas (AirPods → `airpods-pro-2.webp`, Cargadores → `cable-cabezal-usbc.webp`);
  los dos productos de cable pasaron a **USB C - USB C**; y la Silicone Case ahora sale
  también en Apple vía `categoriasExtra`.

**Pendiente** ⏳

- [ ] **Cargar el stock de los productos nuevos desde el panel.** Los 11 de vapers y
  termos (`vap-1`…`vap-8`, `ter-1`…`ter-3`) **no tienen fila**: aparecen con el badge
  **"SIN CARGAR"**. Se cargan escribiendo el número y dando Guardar.
  ⚠️ **No correr el seed** para esto: les pondría 10 de relleno (ver sección 8).
  Es el pendiente **más viejo y el más urgente**: hasta que no se carguen, esos
  productos se ven **"Agotado"** en producción.
- [ ] **Fotos reales** de los 8 vapers y los 3 termos (hoy muestran `SinFoto`). Alcanza
  con agregar `image:` en `products.ts` — el placeholder deja de renderizarse solo.
- [ ] **Borrar las 7 filas huérfanas de los protectores** (ver abajo).
- [ ] **Panel para los badges**: editarlos desde `/admindistribucion` en vez de a mano.
  Ya está preparado — ver "Cómo migrar los badges al panel" en la sección 6.
- [ ] **Celulares usados** (cuando entren al catálogo). Traen dos cosas nuevas:
  - **Filtro de atributos** ("Nuevos / Usados"): la arquitectura ya lo contempla, es un
    campo en `Filtros` + su condición en `aplicarFiltros` (ver sección 5).
  - **Fichas técnicas y comparador**: hoy `Product` no tiene dónde guardar specs
    (memoria, batería, estado). Habría que sumar un campo estructurado y una vista de
    comparación. **No hay nada hecho de esto.**

**Limpieza de la base**: quedaron filas huérfanas de los productos borrados. No
molestan (nadie las lee, todo se arma desde el catálogo), pero si se quiere dejar
prolijo:

```sql
-- 7 filas de los protectores (apl-5 llevaba 6, una por modelo)
DELETE FROM stock WHERE product_id IN ('apl-5','apl-6');

-- y las de las tandas anteriores, si nunca se corrieron
DELETE FROM stock WHERE product_id IN ('paq-1','paq-2','paq-3','paq-4','paq-5','paq-6','alb-1','alb-2','ind-1','apl-1','apl-4','promo-1','promo-2','promo-3');
```

## 8. Notas / cómo operar el stock

- **Entrar al panel**: `https://<dominio>/admindistribucion` (en local,
  `http://localhost:3000/admindistribucion`). **No hay ningún link al panel** en la web:
  se entra escribiendo la URL a mano, a propósito.
- **Credenciales**: email + contraseña. **La contraseña está guardada aparte (gestor de
  contraseñas), NO está en el repo ni en este archivo.** En Vercel solo vive el **hash
  bcrypt**, dentro de `ADMIN_USERS`. Para cambiarla o sumar un usuario:
  `node scripts/hash-password.mjs` → pegar `email:hash` en `ADMIN_USERS` → redeploy.
  **No hace falta tocar código.** Si se sospecha una filtración: cambiar `AUTH_SECRET`
  invalida todas las sesiones.
- **El stock se cambia SOLO desde el panel.** No baja solo cuando alguien consulta por
  WhatsApp: la venta se cierra por chat, así que al confirmarla hay que entrar al panel
  y usar **"−1"** (o "Agotar" / editar el número).
- **El cliente todavía NO tiene acceso al panel** (decisión de negocio: las
  actualizaciones las hago yo y se cobran aparte). Ni siquiera sabe que existe.
- **Si algún día se le da el panel al cliente**: conviene antes revisar los textos y la
  usabilidad pensando en alguien **no técnico** (hoy dice cosas como "variante" o
  "Sin variantes", y los errores de la API son bastante técnicos). También habría que
  crearle su propio usuario en `ADMIN_USERS` en vez de compartir el mío.
- **La URL del sitio vive en `src/lib/site.ts`** (`SITE_URL`). Es el **único lugar** a
  cambiar si algún día se pasa a un dominio propio: de ahí salen el `metadataBase` y el
  `sitemap.xml`. Si no se actualiza, las tarjetas al compartir apuntarían al dominio
  viejo.
- **Si se agregan productos nuevos al catálogo**: **normalmente no hay que hacer nada**.
  El panel arma su listado desde el **catálogo**, no desde la base, así que el producto
  nuevo aparece solo con el badge **"SIN CARGAR"**; al escribir la cantidad y dar
  Guardar se crea la fila. Ese es el camino recomendado.
  El seed queda como atajo para **cargas masivas** (es idempotente y **no pisa** los
  valores existentes), pero ojo: **rellena con 10** las filas que crea, así que promete
  stock que nadie contó.
  ```
  curl -X POST https://<dominio>/api/stock/seed -H "x-seed-token: <SEED_TOKEN>"
  ```
- **Los productos con `sinStock` no aparecen en el panel** (no tienen casilleros) y las
  escrituras sobre ellos se rechazan. Es a propósito: están siempre disponibles.

## 9. Cómo correr el proyecto

- **Local (Windows)**:
  ```
  npm install
  npm run dev
  ```
  Abrir **http://localhost:3000**. (Si `node` no está en el PATH del shell, abrir una
  terminal nueva; Node se instaló vía winget.)
  ⚠️ **Sin `.env.local` el stock no funciona en local**: `/api/stock` devuelve 503 y,
  por el "fallar cerrado", **todo se ve agotado**. Para probar con stock hay que crear
  un `.env.local` (ya cubierto por `.gitignore`) con `DATABASE_URL`, y sumar
  `ADMIN_USERS` + `AUTH_SECRET` si además se quiere entrar al panel.
- **Chequeos antes de commitear**: `npx tsc --noEmit` y `npm run build`.
  `npm run lint` reporta **4 errores preexistentes** de `react-hooks/set-state-in-effect`
  en `ProductModal.tsx`, `cart-context.tsx` y `stock-context.tsx`. Es la línea base: si
  aparecen más, son nuevos.
- **Deploy**: `git push origin main` dispara el **deploy automático en Vercel**.
  Repo: `github.com/felipeLopz/argentinadistribucion`, rama `main`.

## 10. Mantenimiento de este archivo

**Actualizá este `CLAUDE.md` al terminar cada sesión con cambios relevantes**
(marcá pendientes como hechos, agregá decisiones nuevas), para que sirva de contexto
en la sesión siguiente. Editalo con las herramientas de edición, **nunca con
PowerShell** (ver sección 0).
