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
| `src/lib/products.ts` | **Catálogo** (array `products` + interface `Product`), `Categoria`, `categoriasDe()`, **`imagenDeOpciones()`** (la foto según la variante elegida, ver sección 3), `CATEGORIAS` (chips), `navSections` (anclas del navbar), `contactConfig`, `storeName`. **Se edita a mano.** Campos opcionales del producto: `image` (la PRINCIPAL; si falta, va el placeholder), **`imagenesPorOpcion`** (una foto por valor de opción), `categoriasExtra` (multi-categoría), `packPrecios` (promo por cantidad), `sustantivoPack`, `cartName`, `sinStock`, `badges`, `precioAnterior`. |
| `src/lib/promos.ts` | **Lógica pura de badges y ofertas**: `resolverPromo()`, la cadena de prioridad, el cálculo del ahorro, `UMBRAL_URGENCIA` y `admitePromocion()` (la regla que excluye a los vapers). Ver sección 6. |
| `src/hooks/use-promocion.ts` | **De dónde salen** los datos promocionales. Hoy, del catálogo. **Es la única costura a cambiar** para editarlos desde el panel. |
| `src/lib/filtros.ts` | **Lógica pura de los filtros**, sin React ni base: `Filtros`, `FILTROS_VACIOS`, `ORDENES`, `aplicarFiltros`, `coincideBusqueda`, `hayFiltrosActivos`, `rangoDePrecios`, `diagnosticarVacio`, la **agrupación por categoría** (`correspondeAgrupar` / `agruparPorCategoria`), el ida y vuelta con la URL (`serializarFiltros` / `parsearFiltros`) y el **interruptor `CATEGORIAS_PROXIMAMENTE`** (ver sección 5). **Es el punto de extensión para filtros nuevos.** |
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
| `src/lib/contenido.ts` | **Lógica pura del contenido editable**: precedencia (override de la base > `products.ts`) y validación de `packPrecios`. Sin React ni base. ⚠️ **FALLA ABIERTO**, al revés que el stock. Ver sección 6. |
| `src/lib/contenido-db.ts` | Tabla `contenido_overrides` y sus lecturas/escrituras. **Solo servidor**. |
| `src/lib/contenido-context.tsx` | `ContenidoProvider`: expone el **catálogo efectivo** (`productos`) ya resuelto. Lo consumen `filtros-context` y `page.tsx`. |
| `src/lib/auth-session.ts` | JWT + cookie. **Compatible con Edge** (sin bcrypt): lo usa el middleware. |
| `src/lib/auth.ts` | Parseo de `ADMIN_USERS`, bcrypt, `requerirSesion()`. Runtime Node. |
| `src/lib/rate-limit.ts` | Límite de intentos de login **contra la base** (tabla `login_attempts`). |
| `src/lib/site.ts` | **URL de producción del sitio** (`SITE_URL`). Única fuente de verdad: la usan `metadataBase` y el sitemap. |
| `src/middleware.ts` | Primera barrera del panel (matcher acotado a `/admindistribucion` y `/api/admindistribucion`). |
| `src/app/api/stock/route.ts` | **Endpoint público, SOLO LECTURA** del stock. |
| `src/app/api/contenido/route.ts` | **Endpoint público, SOLO LECTURA** de los overrides de contenido. |
| `src/app/api/stock/seed/route.ts` | Carga inicial/sincronización, protegida por `SEED_TOKEN`. Idempotente. |
| `src/app/api/admindistribucion/` | Rutas privadas: `login`, `logout`, `stock`, `contenido` e `imagen` (subida de fotos al Blob). |
| `src/app/admindistribucion/` | **Panel privado**: `login/page.tsx`, `page.tsx`, `PanelStock.tsx`, `PanelContenido.tsx`, `BotonSalir.tsx`. |
| `scripts/hash-password.mjs` | Genera el hash bcrypt de una contraseña (entrada oculta). |
| `src/app/opengraph-image.tsx` | Genera la **imagen de la tarjeta al compartir** (PNG 1200x630) con el theme del sitio. |
| `src/app/twitter-image.tsx` | Reexporta la de arriba para Twitter/X. |
| `src/app/sitemap.ts` | Genera `/sitemap.xml`. **Sólo la home**. |

**`src/components/home/`**

| Componente | Para qué sirve |
|---|---|
| `Navbar` | Logo, buscador (lee del contexto de filtros), links **Inicio** y **Contacto**, y el carrito. **Sin categorías**, a propósito. |
| `Hero` | Título "KOI tu tienda de confianza", pill del rubro, CTA a `#catalogo`. |
| `Catalogo` | **Sección única del catálogo**: barra de filtros + grilla (agrupada o plana) + estado vacío. Acá vive el arreglo del "tirón" y del salto en mobile (ver sección 4). |
| `BarraFiltros` | Chips de categoría, rango de precio, orden y contador. **Sticky** abajo del navbar. En mobile, precio y orden se pliegan detrás de "Filtros". |
| `CatalogoVacio` | **Único** estado vacío: se diagnostica solo (texto / precio / categoría / combinación) y ofrece un atajo puntual + "Limpiar filtros". |
| `EncabezadoGrupo` | Título de cada bloque de categoría en "Ver todo" (ícono + nombre + contador + hairline). Reusa el encabezado de sección que tenía el catálogo antes de los filtros. |
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

- **Theme "Grafito"**: gris cálido monocromo, aplicado a todo el sitio **y al panel
  de admin**. Es el tercer theme: nació como "Estadio Nocturno", pasó por "Violeta
  Profundo" y hoy es Grafito. El camino está recorrido — el mapeo de abajo sirve de
  guía si algún día hay un cuarto.
- **Tokens de color**: en `src/app/globals.css`, bloque `:root`.
  - **Fondos**: `--navy #1c1c1e` (base), `--navy-2 #242427` (superficie),
    `--navy-3 #2c2c30` (superficie más clara: cards, ítems del carrito, bloques del
    panel). `--navy-3` va **además** como `--navy-3-rgb: 44, 44, 48`, porque los
    fondos translúcidos necesitan su propio alpha y `rgba()` no acepta un hex: se
    escriben `rgba(var(--navy-3-rgb), 0.5)`. Las dos formas apuntan al mismo color.
  - **Acciones** (botones, pill de precio, chip activo): `--blue #b8b3ab`,
    `--blue-l #c4bfb7`. El degradé va `--blue-l` → `--blue`.
  - **Realces** (subrayado del navbar, título del hero, íconos, bordes):
    `--gold #b8b3ab`, `--gold-l #d6d2cb`.
  - **Texto y bordes**: `--ink #eceae7`, `--mut #a09b93`,
    `--line rgba(184,179,171,.16)`.
  ⚠️ **Los nombres de los tokens quedaron del theme original a propósito** (`--navy`,
  `--blue`, `--gold`): renombrarlos obligaba a tocar **406 usos**. Lo que cambia es el
  valor, no el nombre. Lo mismo con `.text-gold-gradient`, que hoy es gris → gris claro.

- **Las dos familias de acento, en una paleta sin tonos.** Antes se separaban por
  color (lila vs violeta). En Grafito no hay tono que gastar, así que la jerarquía
  sale de la **forma** —pastilla rellena vs texto suelto vs borde— más un escalón de
  luminosidad. `--gold` se usa sobre todo en **primer plano** (37 veces como texto,
  23 como borde) y `--blue` sobre todo como **relleno** (50 veces). No las unifiques
  en un solo valor: el escalón es lo que sostiene la jerarquía.

### ⚠️ El acento es CLARO: el texto encima va OSCURO

Sobre cualquier relleno de acento el texto va **`#1c1c1e`**, nunca blanco.

| Combinación | Ratio | |
|---|---|---|
| `--ink` sobre el fondo base | **14.17:1** | AAA |
| `--ink` sobre superficies 2 y 3 | 12.89 / 11.58 | AAA |
| `--mut` sobre las tres superficies | 6.16 / 5.61 / **5.04** | AA |
| **`#1c1c1e` sobre el acento** | **8.16:1** | AAA ✅ |
| blanco sobre el acento | **2.08:1** | ❌ **FALLA** |
| **`#1c1c1e` sobre el cian de promos** | **7.18:1** | AAA ✅ |
| blanco sobre el cian | **2.37:1** | ❌ **FALLA** |

Medidos en el navegador sobre la página real, no calculados a mano.

> **Nota histórica**: la versión anterior de este archivo decía que el blanco sobre
> el lila daba **1.76:1**. El valor real era **2.72:1** (el 1.76 se parece al del
> `--gold-l`). La conclusión no cambiaba —el blanco fallaba igual— pero el número
> estaba mal.

⚠️ **Fueron 25 lugares, no 18.** Al migrar hubo que invertir a texto oscuro 25
puntos, y **un grep simple no los encuentra a todos**, porque:
  - en 7 casos el relleno está en el contenedor y el `text-white` en el **ícono hijo**
    (`<Fish>`, `<ShoppingCart>`, `<Lock>`), a veces a 5 líneas de distancia;
  - 1 caso usa un **relleno sólido** (el contador del carrito, con `bg-` y el token
    directo) y no un degradé, así que un grep que busque los degradés por su prefijo
    `from-` no lo encuentra.
  De los **77 `text-white`** del repo sólo esos 25 estaban sobre acento; los otros 52
  van sobre fondo oscuro y **tienen que quedar blancos** (ojo con el `<h1>` del login
  y el nombre de la tienda en el footer: están *al lado* de un contenedor de acento
  pero no encima). La forma confiable de chequearlo es **medir el contraste en el
  navegador** recorriendo el DOM, no leer el código.

### ⚠️ El cian `--promo` es SÓLO para promociones

`--promo #3fb8c4` con `--promo-ink #1c1c1e` es el **único color** de toda la paleta,
y se usa en **cuatro lugares y nada más**: los badges, el precio anterior tachado, el
ahorro y el renglón "¡Últimas N unidades!".

**No lo extiendas al resto de la interfaz.** Su fuerza viene de ser escaso: si el
cian aparece en botones y títulos, los badges dejan de destacar, que es exactamente
lo que se quiere evitar. Para cualquier otro acento está la gama gris.

Los **tres tonos de badge comparten el mismo cian** y se distinguen por **ícono y
texto**, no por color — si cada uno tuviera el suyo, el cian dejaría de leerse como
"esto es una promo".

- **Sombras y glows**: las sombras de profundidad van en **negro** (`rgba(0,0,0,…)`),
  porque un halo gris sobre fondo gris se ve como una mancha.
  ⚠️ **Dos excepciones, las dos a propósito**:
  - **`.hero-glow` va en gris tenue, NO en negro.** No es un halo alrededor de un
    elemento: es la **luz de fondo** que levanta la parte de arriba del hero. En negro
    lo oscurecería en vez de iluminarlo. Lo que evita la mancha ahí es la opacidad
    baja (el violeta llegaba a 0.55; en gris va a 0.10).
  - **Los indicadores de foco van en gris, NO en negro.** Un anillo negro sobre fondo
    oscuro es invisible, y quien navega con teclado pierde el rastro del foco. Se
    distinguen por la forma: `0_0_0_Npx` es un anillo de foco, `0_Ypx_Bpx` es
    profundidad.
- **Colores que NO siguen la paleta** (a propósito): verde de WhatsApp
  (`#25a35a` / `#37c46f`), rosa de Instagram (`#e46bb0`) y el rojo de error/agotado.
- **Tipografía**: **Archivo** (Google Fonts vía `next/font`, variable
  `--font-archivo`); se aplica con la clase `.font-archivo`.
- **Marca**: ícono **pez koi** (`Fish` de lucide) en navbar, footer y checkout;
  favicon 🐟. Es neutro respecto de los productos, que van a seguir cambiando.
- **Reglas de las cards** (`ProductCard.tsx`):
  - Son **clickeables y abren el modal**. **No** tienen botón "Agregar" ni badge de
    categoría. El **precio** va en una **pill de acento centrada**, con texto oscuro
    encima (`PRICE_PILL`, en `CardPrecio.tsx`).
  - **Sin foto**: se renderiza `SinFoto` en el mismo hueco, así el layout no cambia.
  - **Badge de promoción**: arriba a la izquierda de la foto, uno solo (ver sección 6).
  - **Promo por cantidad ("Silicone Case")**: abajo del precio dice
    "Promo por cantidad · hasta 4" en vez de la disponibilidad. El resto pasa en el
    modal: **tabla de precios** visible al abrir, selector con **tope 4** y aviso con
    botón de WhatsApp si se lo intenta pasar.

### Imagen por variante: una foto por cada valor de opción

Las fundas cambian de foto según el color elegido. Lo resuelve el campo opcional
`imagenesPorOpcion` de `Product`, indexado por **label del grupo** y después por
**valor**: `{ "Color": { "Fucsia": "/images/funda-11-fucsia.webp" } }`.

Quien lo lee es la función pura **`imagenDeOpciones(product, opciones)`**
(`products.ts`), y **falla siempre hacia la foto principal**: si el producto no
declara el campo, si todavía no se eligió nada, o si ese valor puntual no tiene foto
propia, devuelve `product.image`. **Nunca deja una imagen rota.**

- **`image` sigue siendo la principal**: es la que muestra la card en la grilla, antes
  de que el visitante elija nada. En las fundas es **la NEGRA** de cada modelo.
- **Es aditivo**: los productos con una sola foto no declaran el campo y no cambiaron.
- **Dónde se muestra cada una** — de los cuatro lugares, sólo el modal necesitó tocarse:

  | Dónde | Qué foto | ¿Se tocó? |
  |---|---|---|
  | Card de la grilla | la principal | no, sigue leyendo `product.image` |
  | Modal | la del color elegido | **sí**, usa `imagenDeOpciones` |
  | Panel del carrito | la del color elegido | no, lee el ítem guardado |
  | `/carrito` | la del color elegido | no, ídem |

- ⚠️ **La foto del color elegido se resuelve en `ProductModal`, ANTES de llamar a
  `addItem`.** El carrito sigue guardando un `image: string` y sin saber que existen
  fotos por variante: no hubo que tocar `cart-context.tsx`. Si algún día parece que
  hay que tocarlo para esto, es señal de que algo se está resolviendo en el lugar
  equivocado.

### ⚠️ Fotos verticales: se rellenan, NO se recortan

Las fotos de las fundas vienen del cliente en **900×1600 (9:16)** y las cards son
**cuadradas con `object-cover`**: un recorte al centro le corta la funda arriba y
abajo (ocupa ~1200-1400px de alto sobre 900 de ancho).

Se procesan a **800×800 WebP** metiendo la foto **entera** (`fit: inside`) y
rellenando los costados con **la misma foto ampliada y desenfocada**. El relleno
queda con el color y la textura de la tela de esa foto, así que no se lee como una
banda pegada, y es **imposible que corte el producto**.

- Se probó detectar el recuadro de la funda por color y por bordes: **las dos
  fallaron**. La tela tiene textura y arrugas, así que la detección marcaba la imagen
  entera o daba cajas inconsistentes. El caso peor es la funda **blanca** sobre tela
  crema. No volver a intentarlo sin una forma de verificar las 21 a ojo.
- ⚠️ **`sharp` corre el `resize` ANTES del `composite`**, sin importar el orden en que
  se llamen los métodos. Encadenar `create → composite → resize` falla con
  *"Image to composite must have same dimensions or smaller"*: hay que armar el fondo
  en su propia llamada y recién después componer.

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
- **La grilla se AGRUPA por categoría en "Ver todo"**, con un bloque por categoría en
  el orden de los chips (`EncabezadoGrupo`). Con un chip puntual va **plana**, porque
  son todos de la misma categoría y no hay nada que separar. La regla vive en
  `correspondeAgrupar()` (`filtros.ts`) y es de una línea: agrupa si la categoría es
  `"todo"`. Ver sección 5.
- **Multi-categoría (`categoriasExtra`): existe pero HOY NO LO USA NADIE, a propósito.**
  Un producto puede pertenecer a varias categorías sin dejar de ser uno solo
  (`products` lo guarda una única vez, así que "Ver todo" lo muestra una vez y la
  deduplicación sale gratis).
  - Se usó un tiempo para que las promos salieran también en Accesorios Apple, y se
    revirtió: las dos categorías terminaban mostrando **casi lo mismo** (5 de 6
    productos repetidos). Hoy cada producto está en una sola categoría y **la suma de
    los contadores de los chips coincide con "Ver todo"** (19).
  - ⚠️ **NO borrar el campo ni `categoriasDe()`**: se va a volver a necesitar apenas
    un producto pertenezca de verdad a dos categorías.
  - Si se reactiva: `category` es la **principal** (la del badge del modal y la del
    bloque en "Ver todo"), `categoriasExtra` son las adicionales, y ahí sí la suma de
    los chips vuelve a quedar mayor que el total. Filtrar siempre con
    `categoriasDe()`, **nunca concatenando categorías** — eso sí duplicaría.
- **Las categorías NO van en el navbar.** Viven sólo en los chips. Tenerlas en los dos
  lados daría dos formas distintas de hacer lo mismo. `navSections` quedó con
  **Inicio** y **Contacto** nada más; el footer sí lista categorías, pero sus links
  **activan el chip**, no scrollean.
- **El salto al cambiar de categoría** (`Catalogo.tsx`) — dos problemas distintos que
  se arreglaron juntos, y las dos soluciones son frágiles si se tocan:
  1. **El "tirón"**: pasar de 18 cards a 3 acorta el documento y el navegador
     **clampea** el scroll. Se arregla con el **orden de las operaciones**: primero el
     scroll, después el cambio de filtro. Corregir *después* no sirve, porque las
     cards salen con animación y la altura colapsa un frame más tarde.
     ⚠️ **El scroll va INSTANTÁNEO, nunca suave**: una animación de scroll compitiendo
     con el cambio de altura es exactamente el tirón que se quiere evitar.
  2. **El espacio vacío en mobile**: al principio sólo se reposicionaba si el usuario
     estaba **por debajo** del inicio de la grilla. En mobile el **hero mide más que
     la pantalla** (865px contra 812), así que el chip se toca cuando recién asoma al
     pie — con el usuario **ARRIBA** del catálogo — y entonces no se scrolleaba nada:
     la primera card quedaba a 810px de un viewport de 812.
     ⚠️ **Reposiciona en las DOS direcciones.** No volver a la condición de una sola.
  - En desktop eso también cambió la conducta (antes, tocar un chip desde arriba no
    hacía nada). **Se dejó igual a propósito**: en los dos tamaños, tocar una
    categoría baja al catálogo.
- **El alto del navbar NO se hardcodea.** El `Navbar` se mide y publica su alto real
  en la variable CSS `--alto-navbar` (75px normal, **129px con el buscador mobile
  desplegado**). La usan el `sticky` de la barra de filtros y el salto al catálogo.
  Antes era un `74` hardcodeado que además quedaba corto al abrir el buscador.
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

**La agrupación por categoría**

En **"Ver todo" la grilla va SIEMPRE agrupada**: un bloque por categoría con su
encabezado, en el orden de los chips. Con un **chip puntual va plana**, porque son
todos de la misma categoría y no hay nada que separar.

`correspondeAgrupar()` es de una línea a propósito: **sólo mira la categoría**. Ni el
orden ni la búsqueda entran en la decisión.

- **El orden se aplica DENTRO de cada bloque.** "Precio de menor a mayor" ordena los
  vapers entre sí y los termos entre sí, no el catálogo entero. Es una consecuencia
  asumida y decidida: un catálogo mezclado sin separaciones es más difícil de recorrer
  que uno ordenado por bloques. No hace falta código extra — `aplicarFiltros` ordena
  la lista completa y `filter` respeta la posición relativa, así que cada bloque queda
  ordenado solo.
- **Con búsqueda activa también agrupa**, mostrando únicamente los bloques que tienen
  resultados (buscar "vaper" muestra sólo el bloque Vapers).
- ⚠️ **NO reintroducir un aplanado al ordenar o al buscar.** Estuvo implementado un
  rato —con el argumento de que agrupar y ordenar son incompatibles— y **se sacó a
  propósito**. Si aparece de nuevo esa condición en `correspondeAgrupar()`, es una
  regresión.

### ⚠️ TEMPORAL: Vapers y Termos están en modo "Próximamente"

Las dos categorías están **ocultas a propósito** porque no hay stock: mostrar 11
productos todos en "Agotado" es peor que no mostrarlos. **No es un bug.**

**El interruptor es una sola constante**, en `filtros.ts`:

```ts
export const CATEGORIAS_PROXIMAMENTE: readonly Categoria[] = ["vapers", "termos"];
```

**Para reactivar una categoría: sacarla de esa lista. Nada más.** No hay que tocar
componentes, ni descomentar nada, ni volver a agregar productos. Con la lista vacía
el sitio vuelve solo a su conducta normal y el cartel deja de existir.

Qué hace estar en la lista:

| | |
|---|---|
| El chip en la barra de filtros | **sigue visible** |
| Al tocar el chip | sale un cartel de **"Próximamente"** en vez de la grilla |
| El contador | dice **"Próximamente"** en vez de "0 productos" |
| Sus productos | **no aparecen en ninguna vista**: ni en su categoría, ni en "Ver todo", ni en el buscador, ni por rango de precio |
| `products.ts` | **intacto**: los productos siguen con sus datos, fotos y stock |
| El panel de admin | **los sigue listando**, para poder cargarles stock mientras están ocultos |

- **La compuerta vive dentro de `aplicarFiltros`**, antes que cualquier otro filtro.
  Está ahí y no en el contexto para que la cubra también `diagnosticarVacio`, que
  llama a la misma función: un solo lugar tapa la grilla, el buscador, la agrupación,
  el contador y el diagnóstico del estado vacío.
- **Con multi-categoría alcanza con que UNA de las categorías del producto esté
  oculta** para que no se muestre. Se falla del lado de ocultar, igual que
  `admitePromocion`.
- El cartel es el componente local `Proximamente` de `Catalogo.tsx` (mismo lugar que
  `Grilla`). Comparte la carcasa con `CatalogoVacio` y el ícono de reloj con el estado
  "Próximamente" por producto que ya usaban las cards.
  ⚠️ **Se chequea ANTES del estado vacío**: con la categoría oculta no queda ningún
  producto, así que si no, saldría `CatalogoVacio` diciendo "no hay resultados", que
  es otra cosa.
- El campo `status: "proximamente"` de `Product` es **otra cosa**: es por producto y
  hoy no lo usa nadie. Esto es por CATEGORÍA.

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
cartel de "Agotado" manda, y un "Ahorrás $7.000" en cian brillante al lado de "Agotado"
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

### Contenido editable desde el panel — HECHO

Desde `/admindistribucion` se edita **sin tocar código ni hacer deploy**:

| Qué | Columna | Notas |
|---|---|---|
| **Título** | `nombre` | ⚠️ NO pisa `cartName` (ver abajo) |
| **Foto principal** | `imagen` | Se sube al Blob y se reprocesa a 800×800 WebP |
| **Descripción** | `descripcion` | |
| **Precios por cantidad** | `pack_precios` | `[]` = promo apagada |
| **Valores de opción** | `opciones_extra` | ⚠️ **SÓLO se agregan, nunca se quitan** |

Todo vive en la misma tabla `contenido_overrides`, con la misma precedencia y el
mismo fallar-abierto. Las columnas se agregan solas con `ALTER TABLE ... ADD COLUMN
IF NOT EXISTS` al entrar al panel: **no hay que correr ninguna migración a mano**.

⚠️ `leerOverrides` trata el error `42703` (columna inexistente) igual que el de
tabla inexistente. Sin eso, entre que se deploya una columna nueva y alguien entra
al panel, **todos** los overrides quedarían desactivados.

`products.ts` sigue siendo la **base**; la tabla `contenido_overrides` guarda
sólo lo editado. Es la misma costura que describe el apartado de arriba para los
badges, pero ya construida: **sirve de implementación de referencia**.

```
products.ts ──► contenido-db.ts ──► /api/contenido ──► ContenidoProvider ──► filtros-context ──► cards / modal / carrito
  (la base)      (los overrides)     (lectura pública)   (catálogo efectivo)     (y el buscador)
```

> ### ⚠️⚠️ ESTO FALLA ABIERTO — ES LO CONTRARIO AL STOCK
>
> Si la base no responde, se usan **los valores de `products.ts`** y la web
> funciona igual. El stock falla **cerrado** (sin datos → agotado) porque prometer
> stock inexistente cuesta una venta caída; acá el criterio es el opuesto, porque
> un producto **sin descripción o sin precio no se puede vender**.
>
> **NO "corregirlo" para que se parezca al stock.** Está anotado en
> `contenido.ts`, `contenido-db.ts` y `contenido-context.tsx` justamente porque
> parece una inconsistencia y no lo es.

**Decisiones a tener presentes**

- **Se filtra sobre el catálogo efectivo, no sobre `products`.** El buscador matchea
  por descripción, así que tiene que buscar por el texto que el visitante ve. Por eso
  `FiltrosProvider` consume `useContenido().productos`, y lo mismo hace
  `CatalogoVacio` para diagnosticar.
- **`aplicarOverrides` devuelve el MISMO array si no hay nada que pisar**, y el mismo
  objeto por producto sin cambios. Sin esa identidad, cada carga de overrides
  re-renderizaría la grilla entera. No romperlo.
- **Tres estados por campo**: `NULL` = sin override (manda el código) · valor = manda
  el override · `pack_precios = '[]'` = **promo apagada a propósito**, que es cómo se
  saca de la web una promo que el código sí define.
- **Un override inválido se descarta y queda el código.** Vale también para una fila
  corrupta o editada a mano en la base: `resolverContenido` no lanza nunca.
- **Validación de `packPrecios`**: enteros positivos, sin escalones vacíos,
  consecutivos desde 1 (la **posición es la cantidad**), y **ningún pack más caro que
  N veces el precio de 1** — si pasa eso, conviene comprar suelto y es un error de
  carga. Las mismas funciones puras corren en el navegador (aviso instantáneo) y en
  el servidor (que es el que manda).
- **`sustantivoPack`** (`products.ts`): cómo se nombra cada ítem del pack
  (`["funda", "fundas"]`). Por defecto **"unidad"/"unidades"**, que sirve para
  cualquier producto. Antes estaba **hardcodeado en "fundas"** en cuatro lugares del
  modal —incluida la `variante` que va al carrito y al mensaje de WhatsApp—, así que
  una promo cargada sobre un cable habría dicho "3 fundas" en el pedido.
  **No es editable desde el panel a propósito**: es redacción, va por código.

### ⚠️ El título NO cambia el nombre del carrito ni del WhatsApp

Los productos que declaran **`cartName`** (hoy sólo la Silicone Case) siguen entrando
al carrito y al mensaje de WhatsApp con ese nombre corto, aunque se les edite el
título desde el panel. `cartName` existe justamente para que esa línea del pedido no
se vaya de largo.

**No es un bug y el panel lo avisa** con un renglón en los productos que lo tienen.
Si algún día se quiere que el título mande también ahí, hay que decidirlo aparte:
toca la generación del pedido.

### Fotos subidas desde el panel (Vercel Blob)

- **Dónde**: un store de **Vercel Blob** en modo Public. La variable
  `BLOB_READ_WRITE_TOKEN` la inyecta Vercel sola al conectar el store al proyecto;
  **no se copia a mano ni aparece en el código**.
- ⚠️ **`next.config.ts` necesita `images.remotePatterns`** con
  `*.public.blob.vercel-storage.com`. Sin eso `next/image` rechaza las URLs subidas y
  **no se ve ninguna foto nueva** — y el error recién aparece en producción.
- **El navegador achica antes de subir** (canvas, lado mayor 1600px, WebP). No es
  cosmético: las funciones de Vercel cortan el body en ~4,5 MB y una foto de celular
  pesa 3-8 MB. De paso convierte el **HEIC** de los iPhone, que sharp no lee.
- **El servidor reprocesa igual** a 800×800 WebP con relleno desenfocado: del cliente
  no nos fiamos, y así el encuadre sale con el mismo criterio que las fotos hechas a
  mano (ver "Fotos verticales" arriba).
- ⚠️ **La foto anterior NUNCA se borra del Blob.** Los carritos abiertos guardan la
  URL en `localStorage`: si se borrara, mostrarían una imagen rota. Cada una pesa
  ~40 KB. Por lo mismo, "volver al código" sólo olvida la URL, no borra el blob.
- **En las fundas cambia sólo la principal**: `imagenesPorOpcion` no se toca, así que
  al elegir un color se sigue viendo la foto de ese color.

### ⚠️ Opciones nuevas: SÓLO se agregan, nunca se quitan

Desde el panel se pueden sumar valores a un grupo que ya exista (un color a una
funda, una ficha al cable). **No se pueden crear grupos nuevos ni borrar valores.**

**No es sólo que la interfaz no lo ofrezca: no existe la acción en la API.**
`CampoContenido` no incluye `opcionesExtra` y el handler de `borrar` la rechaza. Si
se pudiera quitar un valor quedaría **stock huérfano** y los carritos guardados con
esa variante apuntarían a algo inexistente.

- **La resolución es aditiva**: los valores del código van primero y en su orden; los
  agregados se apilan al final. Un duplicado se ignora, comparando **sin distinguir
  mayúsculas ni espacios sobrantes** ("negro" no entra al lado de "Negro").
- **Cada opción nueva crea su fila de stock en 0** (agotada hasta que le carguen
  cantidad), con `INSERT ... ON CONFLICT DO NOTHING`.
  ⚠️ **Nunca con `fijarStock`**, que hace UPSERT: si la clave ya tuviera stock
  cargado, lo pisaría a 0 y se perderían unidades reales.
- **El caso multi-grupo está resuelto de forma genérica**: se comparan las claves de
  `clavesDeStock` antes y después, y se crea una fila por cada clave nueva. Hoy ningún
  producto tiene dos grupos, pero sumar un color a un producto con Color y Modelo
  generaría una fila por modelo. Ya funciona para cuando entren los celulares usados.
- **Un color nuevo sin foto propia** cae en la principal, gracias a
  `imagenDeOpciones`. No queda una imagen rota.

### ⚠️ La ruta de stock del panel usa el CATÁLOGO EFECTIVO

`/api/admindistribucion/stock` resuelve los overrides antes de armar los casilleros y
antes de validar. **Sin esto, una opción creada desde el panel no aparecería en el
panel de stock y `validarPar` la rechazaría** como clave fantasma.

- El catálogo se resuelve **una vez por request** y se le pasa al validador, para que
  el listado y el guard miren exactamente lo mismo.
- **El guard no se aflojó**: sigue exigiendo que la clave exista. Lo único que cambió
  es contra qué compara.
- **Falla ABIERTO**: si la base de overrides no responde, se sigue con el catálogo del
  código. Cargar stock es más urgente que ver un título editado.
- El endpoint público `/api/stock` **no cambió**: sigue siendo de sólo lectura y
  fallando cerrado.

## 7. Estado actual y pendientes

**Catálogo actual — 18 productos, 4 categorías** (en `products.ts`, en este orden).
⚠️ **De los 18, hoy se ven 7**: `vapers` y `termos` están en modo "Próximamente" y sus
11 productos están ocultos (ver sección 5). Siguen enteros en el archivo.

| Categoría (`category`) | Chip | # | Productos |
|---|---|---|---|
| `accesorios` | **Promos** | 5 | Silicone Case 11-17 ($5.000, promo por cantidad, sin stock) · **AirPods Pro 2 (sin cancelación de ruido)** $25.000 · **AirPods Pro 2 con cancelación de ruido + funda** $49.990 · Cable y cabezal $20.000 · **Promo templado + funda** $8.500 |
| `vapers` | **Vapers** | 8 | 5 dispositivos recargables + 2 líquidos 30ml + 1 kit — todos $35.000, **sin foto** |
| `termos` | **Termos** | 3 | Termo Stanley 750ml en rosa, azul y blanco — $45.000, **sin foto** |
| `accesorios-apple` | **Apple** | 2 | **Funda de silicona iPhone 11** $5.000 (7 colores) · **Funda de silicona iPhone 12 y 12 Pro** $5.000 (14 colores) |

La suma de los chips (5+8+3+2) **coincide** con "Ver todo" (18): ya no hay
multi-categoría (ver sección 4).

**Productos con selector de opciones** (el modal obliga a elegir antes de agregar, y
la opción viaja al carrito y al mensaje de WhatsApp):

| Producto | Grupo | Valores |
|---|---|---|
| Cable y cabezal (Promos) | `Ficha` | `C - C` · `C - Lightning` |
| Promo templado + funda | `Templado` | `9D` · `Anti espía` |
| **Funda iPhone 11** | `Color` | 7: Negro · Azul marino · Fucsia · Marrón · Naranja · Turquesa · Verde oliva |
| **Funda iPhone 12 y 12 Pro** | `Color` | 14: Negro · Azul marino · Blanco · Borravino · Lila oscuro · Marrón · Morado · Naranja · Rojo desgastado · Rosado · Rosado claro · Verde · Verde agua · Verde militar |

⚠️ **`apl-funda-12` es UN producto, no dos.** El packaging de la foto dice literal
**"12/12 PRO Case"**: es una sola funda que sirve para los dos modelos, un solo SKU y
**una sola pila de stock**. Separarlo en "iPhone 12" e "iPhone 12 Pro" contaría el
mismo stock físico dos veces. **No lo dividas.**

⚠️ **Las fundas por modelo conviven a propósito con la `Silicone Case` de Promos.**
Aquella es la promo **por cantidad** (packs de 2, 3 y 4, sin elegir modelo ni color);
estas son la **unidad suelta**, con modelo y color. Es el pendiente de "funda sola"
que estaba anotado desde hace tiempo, no una duplicación por error.

El **"Verde"** a secas del 12/12 Pro convive con "Verde agua" y "Verde militar":
viene así del cliente y **se dejó tal cual** a propósito.

⚠️ **Los dos AirPods y por qué la aclaración va en el NOMBRE.** Conviven un
**AirPods Pro 2 (sin cancelación de ruido)** a $25.000 y un **AirPods Pro 2 con
cancelación de ruido + funda** a $49.990. A esa diferencia de precio, el comprador
tiene que entender de una qué está pagando, y la descripción sola no alcanza porque en
la card se corta a dos líneas. **El cliente confirmó que el de $25.000 no la tiene**;
no es una suposición. **No sacar la aclaración del nombre.**

**"iPhone" en el nombre de la Silicone Case es a propósito.** El rubro se nombra
"accesorios **Apple**" en todos lados (hero, footer, metadata), pero ese producto dice
"(iPhone 11 al 17)" porque indica **qué modelos le entran**, no el rubro. Cambiarlo a
"Apple 11 al 17" no significaría nada.

**Accesorios Apple quedó con las dos fundas.** Se eliminó el producto **Cargadores**
(`apl-3`, $11.400): era el que estaba sin specs porque el cliente nunca aclaró qué lo
diferenciaba de la promo de $20.000. Se van a sumar los **productos sueltos** que
faltan (templado solo, cable solo) cuando lleguen los precios. No "arreglarlo"
volviendo a poner `categoriasExtra` en las promos: eso ya se probó y se revirtió.

⚠️ Al borrar `apl-3` **no se borró su imagen**: `cable-cabezal-usbc.webp` la
**comparte** con "Cable y cabezal" de Promos, que se queda. Lo mismo con la constante
`FICHAS_CABLE`, que ese producto sigue usando.

Las descripciones de los vapers son **deliberadamente técnicas** (formato, batería,
capacidad), sin adjetivos promocionales ni nada que invite al consumo. Es un producto
regulado: si se amplía, mantener ese tono.

**Terminado** ✅

- **Sistema de stock real** (Neon Postgres). **19 filas** en total: la mayoría lleva
  una fila con clave `""`, y los **3 productos con selector** llevan **una por opción**
  (`C - C` / `C - Lightning`, `9D` / `Anti espía`). Los marcados `sinStock` **no llevan
  ninguna**. La web muestra **"Quedan N" / "Agotado"** y **bloquea agregar** lo
  agotado; mientras carga dice "Verificando stock…". `/api/stock` es **SOLO LECTURA**
  (POST/PUT/DELETE → 405). **Fallar cerrado**: si la base no responde, todo se trata
  como agotado — la **única** excepción es `sinStock`.
  ⚠️ **`STOCK_GROUPS` sigue VACÍO**: las opciones de hoy llevan stock por cada valor,
  que es el comportamiento por defecto. `STOCK_GROUPS` sólo hace falta para llevar el
  stock con MENOS detalle que las opciones (ej. ofrecer 11 colores × 6 modelos pero
  contar sólo por modelo). Se conserva para los celulares usados que vienen.
- **Panel privado** en **`/admindistribucion`**, no enlazado y con `noindex`. Login con
  email + bcrypt, sesión **JWT en cookie `HttpOnly` + `Secure` + `SameSite=Lax`** de 7
  días. Permite **ver, editar, descontar (−1) y agotar**, con buscador. Los casilleros
  se **derivan de `stock-config.ts`** y las escrituras **rechazan claves fuera de esa
  granularidad**. Doble barrera (middleware + revalidación por handler) y **5 intentos
  de login / 15 min**.
- **Variables de entorno en Vercel** (Production + Preview), **ninguna con
  `NEXT_PUBLIC_`**: `DATABASE_URL`, `SEED_TOKEN`, `ADMIN_USERS` (`email:hash`, varios
  separados por coma), `AUTH_SECRET` y **`BLOB_READ_WRITE_TOKEN`** (la inyecta Vercel
  sola al conectar el Blob store; no se copia a mano).
  ⚠️ **`vercel env pull` trae los valores sensibles REDACTADOS** como `[SENSITIVE]`:
  el `.env.local` que genera sirve para saber qué variables existen, **no** para
  correr con base ni con Blob en local. Para eso hay que poner los valores a mano.
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
- **Actualización de accesorios Apple**: fuera los protectores `apl-5`/`apl-6` y
  fotos reasignadas.
- **Catálogo con los datos del cliente** (última tanda):
  - **Nuevos**: `promo-templado-funda` (Promo templado + funda, $8.500, selector de
    templado) y `promo-airpods-anc` (AirPods Pro 2 con cancelación de ruido + funda,
    $49.990).
  - **Eliminados**: los protectores `apl-5`/`apl-6`, y el `apl-2` "AirPods" de $52.300
    — era el más caro, el más vago y compartía foto con el de $25.000.
  - **Selectores de opciones** en cable, cargadores y templado (ver tabla arriba).
  - **Se sacó el `precioAnterior: 32000`** del AirPods de $25.000: era un ejemplo de
    prueba que quedó publicado anunciando un descuento **que nunca existió**.
  - **Fotos nuevas**: silicone case (las 4 fundas en tonos neutros), templado (render
    del antiespía) y AirPods con cancelación de ruido.
- **Agrupación por categoría en "Ver todo"** y arreglo del espacio vacío en mobile al
  cambiar de chip (ver secciones 4 y 5).
- **Fundas de silicona por modelo, con imagen según el color** (ver sección 3):
  `apl-funda-11` (7 colores) y `apl-funda-12` (14), a $5.000, con selector de **Color**
  obligatorio y **stock por color**. Trajeron el sistema de `imagenesPorOpcion`: la
  card muestra la **negra** y el modal cambia de foto al elegir. Las 21 fotos pasaron
  de 2,6 MB de JPEG vertical a **734 KB** de WebP cuadrado.
- **Migración de paleta a "Grafito"** (ver sección 3): los 9 tokens + `--navy-3` +
  `--promo`/`--promo-ink`, los fondos translúcidos, las sombras en negro, el cian de
  promociones y la imagen OG. **25 lugares** pasaron de texto blanco a oscuro sobre
  el acento. Verificado midiendo el contraste de los **86 textos** de la home en el
  navegador: **cero** por debajo de AA. De paso se arregló el rótulo "Sin foto", que
  ya venía fallando en violeta (3.62:1) y ahora da 5.04:1.
- **Panel de autogestión completo** (ver sección 6): además de descripciones y
  precios por cantidad, ahora se editan el **título**, la **foto principal**
  (subida a Vercel Blob, achicada en el navegador y reprocesada a 800×800 WebP) y se
  pueden **agregar valores de opción** (un color a una funda), que crean su fila de
  stock en 0. La ruta de stock del panel pasó a usar el **catálogo efectivo**.
  ⚠️ Falta probar la creación de opciones **contra la base**: se verificó la lógica,
  no la escritura real.
- **Contenido editable desde el panel** (descripciones y `packPrecios`, ver sección 6):
  lógica pura + tabla `contenido_overrides` + endpoint público de solo lectura +
  rutas privadas + sección nueva en `/admindistribucion`. **Falla ABIERTO.**
  `/` sigue `○ Static`. La tabla **se crea sola** la primera vez que entrás al panel.

**Pendiente** ⏳

- [ ] **Reactivar Vapers y Termos** cuando haya stock: sacarlas de
  `CATEGORIAS_PROXIMAMENTE` en `filtros.ts` (ver sección 5). Es sacar dos strings de
  una lista; no hay nada más que revertir.
- [ ] **Cargar el stock desde el panel.** Es el pendiente **más viejo y el más
  urgente**: hasta que no se carguen, esos productos se ven **"Agotado"** en
  producción. Aparecen con el badge **"SIN CARGAR"**; se cargan escribiendo el número
  y dando Guardar. ⚠️ **No correr el seed**: les pondría 10 de relleno (ver sección 8).

  | Producto | Claves a cargar |
  |---|---|
  | `vap-1`…`vap-8`, `ter-1`…`ter-3` | `""` (11 filas) |
  | `promo-airpods-pro-2` | `""` |
  | `promo-airpods-anc` | `""` |
  | `promo-cable-cabezal` | `C - C` · `C - Lightning` |
  | `promo-templado-funda` | `9D` · `Anti espía` |
  | **`apl-funda-11`** | **7 filas**, una por color: `Negro` · `Azul marino` · `Fucsia` · `Marrón` · `Naranja` · `Turquesa` · `Verde oliva` |
  | **`apl-funda-12`** | **14 filas**, una por color: `Negro` · `Azul marino` · `Blanco` · `Borravino` · `Lila oscuro` · `Marrón` · `Morado` · `Naranja` · `Rojo desgastado` · `Rosado` · `Rosado claro` · `Verde` · `Verde agua` · `Verde militar` |

  Son **38 filas** en total: las 21 de las fundas más las 17 que ya venían. (Eran 40
  antes de eliminar `apl-3`, que aportaba 2.)

- [ ] **Fotos reales** de los 8 vapers y los 3 termos (hoy muestran `SinFoto`). Alcanza
  con agregar `image:` en `products.ts` — el placeholder deja de renderizarse solo.
- [ ] **Foto del templado que muestre el combo completo.** Pasaron dos y ninguna sirve
  del todo: la primera eran 5 fundas **sin templado**, la actual es un render del
  **templado sin funda**. El producto es "funda + templado".
- [ ] **Terminar los productos sueltos de Accesorios Apple**: ya entraron las **fundas
  por modelo**; faltan el **templado solo** y el **cable solo**, esperando precio del
  cliente.
- [ ] **Fundas de los modelos 13 en adelante.** Hoy sólo hay 11 y 12/12 Pro, porque son
  los únicos con fotos. Cuando lleguen las del 13, 14, 15, 16 o 17, cada modelo se suma
  como un producto más con el mismo patrón: fotos procesadas con relleno desenfocado,
  la **negra como principal**, `options` con sus colores e `imagenesPorOpcion`. No hace
  falta tocar ningún componente.
- [ ] **Limpiar las filas huérfanas de la base** (ver abajo).
- [ ] **Panel para los badges**: editarlos desde `/admindistribucion` en vez de a mano.
  Ya está preparado — ver "Cómo migrar los badges al panel" en la sección 6.
- [ ] **Celulares usados** (cuando entren al catálogo). Traen dos cosas nuevas:
  - **Filtro de atributos** ("Nuevos / Usados"): la arquitectura ya lo contempla, es un
    campo en `Filtros` + su condición en `aplicarFiltros` (ver sección 5).
  - **Fichas técnicas y comparador**: hoy `Product` no tiene dónde guardar specs
    (memoria, batería, estado). Habría que sumar un campo estructurado y una vista de
    comparación. **No hay nada hecho de esto.**

**Limpieza de la base**: quedaron filas huérfanas de productos borrados y de productos
que **cambiaron de clave** al sumarles un selector (antes tenían una fila `""`, ahora
una por opción). No molestan —nadie las lee, todo se arma desde el catálogo— pero si
se quiere dejar prolijo:

```sql
-- Productos eliminados
--   apl-5 (6 filas, una por modelo) y apl-6: protectores
--   apl-2: el AirPods de $52.300
--   apl-3: Cargadores ($11.400). TODAS sus filas quedan huérfanas: la de
--          clave "" que tuvo antes del selector, y las de C - C y
--          C - Lightning, si se le llegó a cargar stock.
DELETE FROM stock WHERE product_id IN ('apl-5','apl-6','apl-2','apl-3');

-- Cambiaron de clave "" a una fila por ficha (C - C / C - Lightning)
DELETE FROM stock WHERE product_id = 'promo-cable-cabezal' AND stock_key = '';

-- Y las de las tandas del rubro viejo, si nunca se corrieron
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
- **Editar descripciones y precios por cantidad**: en el mismo panel, sección
  **"Descripciones y precios por cantidad"**. Cada campo dice si está **DEL CÓDIGO** o
  **EDITADO**, muestra el valor de `products.ts` como referencia cuando lo pisaste, y
  tiene **"Volver al código"** para borrar el override. Los escalones se agregan y se
  quitan de a uno; **la posición es la cantidad**, así que quitar el del medio
  renumera los de abajo. Guardar con la lista vacía **apaga** la promo (queda como
  "PROMO APAGADA"). Ver sección 6.
  ⚠️ **La tabla `contenido_overrides` se crea sola** al entrar al panel; no hay que
  correr ningún seed.
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
  En cambio `/api/contenido` también devuelve 503 sin base, pero **no se nota**: por
  el "fallar abierto" la web muestra los textos y precios de `products.ts`. Los 503 de
  la consola en local son esperados.
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

### ⚠️ Tailwind LEE este archivo: no escribas clases de ejemplo con relleno

Tailwind 4 escanea **todos los archivos del repo que no estén en `.gitignore`**, y
este `CLAUDE.md` es uno de ellos. Cualquier cosa con forma de clase de valor
arbitrario que aparezca acá —aunque sea prosa explicando código— la toma como clase
real y genera CSS con ella.

Ya rompió el sitio una vez: documentando la migración de paleta quedó escrito el
patrón de un degradé con `var` y tres puntos de relleno adentro de los corchetes.
Tailwind generó `--tw-gradient-from:` con ese relleno textual y el CSS dejó de
parsear, con la home en **500**.

- **Peor todavía**: `npm run build` **NO falla**, sólo `npm run dev`. Se puede
  commitear y deployar sin enterarse.
- **La regla**: al documentar, nombrá el prefijo suelto (`from-`, `bg-`) o citá una
  clase **completa y válida**. Nunca una con puntos suspensivos o un placeholder
  adentro de los corchetes.
- **Cómo chequearlo**: después de tocar este archivo, levantá `npm run dev` de verdad
  —no alcanza con el build— y confirmá que la home responde 200.
