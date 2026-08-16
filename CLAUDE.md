# CLAUDE.md — Estado del proyecto (Argentina Distributor)

> Archivo de memoria entre sesiones. Leelo al retomar el proyecto para saber
> todo lo necesario sin re-explicar. **Actualizalo al terminar cada sesión con
> cambios relevantes** (ver sección 8).

---

## 1. Qué es el proyecto

Tienda web **"Argentina Distributor"**: venta de **figuritas del Mundial, álbumes,
indumentaria y accesorios Apple**.

- **Modelo de venta**: la venta **NO se procesa en la web**. El usuario arma un
  carrito y al finalizar se genera un **link de WhatsApp con el pedido** (productos,
  cantidades, total y datos del cliente) para cerrar la venta por chat.
- **Modelo de negocio (importante para decisiones)**: la página se **vende una sola
  vez** a un cliente; las actualizaciones posteriores de productos son un **servicio
  aparte que se cobra**. Por eso **NO se quiere un CMS ni autogestión**: el catálogo
  se edita **a mano en el código** (`src/lib/products.ts`).

## 2. Stack y estructura

**Stack** (ver `package.json`): Next.js `^16.1.1` (App Router) · React `^19` ·
Tailwind CSS `^4` (via `@tailwindcss/postcss`) · framer-motion `^12` ·
lucide-react (iconos) · tipografías con `next/font` (Archivo) · TypeScript `^5`.

**Base de datos**: **Neon Postgres** (`@neondatabase/serverless`), conectada desde
Vercel. **Guarda SOLO el stock** — el catálogo (nombres, precios, imágenes,
opciones) sigue viviendo a mano en `products.ts`. Auth del panel con `bcryptjs`
(hash de contraseña) + `jose` (JWT de sesión).

**Mapa de archivos clave**

| Ruta | Para qué sirve |
|---|---|
| `src/lib/products.ts` | **Catálogo** (array `products` + interface `Product`), `categories`, `navSections`, `contactConfig` (WhatsApp/email/redes), `storeName`. **Se edita a mano** para catálogo, precios y contacto. |
| `src/lib/cart-context.tsx` | Lógica del **carrito**: React Context + localStorage (clave `argentina-distributor-cart`). `addItem/removeItem/updateQuantity/clearCart` + totales. |
| `src/lib/utils.ts` | Helper `cn()` (clases). |
| `src/app/layout.tsx` | Layout raíz: fuentes (Geist + **Archivo**), metadata SEO, `CartProvider`, `Toaster`. |
| `src/app/page.tsx` | **Home**: compone los componentes de `home/` y maneja estado (`searchQuery`, `cartOpen`, `selectedProduct`). |
| `src/app/carrito/page.tsx` | **Checkout**: formulario del cliente + validación + **genera el mensaje de WhatsApp** (`window.open(wa.me?text=...)`) + pantalla "pedido enviado". |
| `src/app/globals.css` | Tailwind + **tokens del theme** + utilidades (`.font-archivo`, `.text-gold-gradient`, `.hero-glow`, etc.). |
| `src/components/home/` | Componentes de la landing (ver abajo). |
| `src/components/ui/` | Solo `toast.tsx` + `toaster.tsx` (sistema de toasts montado en layout, hoy no se dispara). |
| `src/hooks/use-toast.ts` | Hook del toast. |
| `public/images/` | Imágenes de productos referenciadas por `products.ts`. |
| `src/lib/stock-config.ts` | **Fuente de verdad de la granularidad del stock** (`STOCK_GROUPS`) y derivación de claves. Puro (sin base): lo usan el navegador, la web pública y el panel. |
| `src/lib/db.ts` | Cliente de Neon. **Solo servidor**, conexión perezosa. |
| `src/lib/stock.ts` | Lectura/escritura del stock en la base. **Solo servidor**. |
| `src/lib/stock-context.tsx` | `StockProvider`: la web pública lee `/api/stock` desde el navegador (mismo patrón que el carrito). |
| `src/lib/auth-session.ts` | JWT + cookie. **Compatible con Edge** (sin bcrypt): lo usa el middleware. |
| `src/lib/auth.ts` | Parseo de `ADMIN_USERS`, bcrypt, `requerirSesion()`. Runtime Node. |
| `src/lib/rate-limit.ts` | Límite de intentos de login **contra la base** (tabla `login_attempts`). |
| `src/middleware.ts` | Primera barrera del panel (matcher acotado a `/admindistribucion` y `/api/admindistribucion`). |
| `src/app/api/stock/route.ts` | **Endpoint público, SOLO LECTURA** del stock. |
| `src/app/api/stock/seed/route.ts` | Carga inicial/sincronización, protegida por `SEED_TOKEN`. Idempotente. |
| `src/app/api/admindistribucion/` | Rutas privadas: `login`, `logout`, `stock` (lectura + escrituras). |
| `src/app/admindistribucion/` | **Panel privado**: `login/page.tsx`, `page.tsx`, `PanelStock.tsx`, `BotonSalir.tsx`. |
| `scripts/hash-password.mjs` | Genera el hash bcrypt de una contraseña (entrada oculta). |
| `src/lib/site.ts` | **URL de producción del sitio** (`SITE_URL`). Única fuente de verdad: la usan `metadataBase` y el sitemap. |
| `src/app/opengraph-image.tsx` | Genera la **imagen de la tarjeta al compartir** (PNG 1200x630) con el theme del sitio. |
| `src/app/twitter-image.tsx` | Reexporta la de arriba para Twitter/X (misma imagen, sin duplicar el diseño). |
| `src/app/sitemap.ts` | Genera `/sitemap.xml`. **Sólo la home**; deja fuera `/carrito` y las rutas privadas. |
| `src/hooks/use-dialogo-accesible.ts` | Foco, Escape y focus trap de los diálogos. Lo comparten `ProductModal` y `CartPanel`. |
| `src/components/home/SearchEmptyState.tsx` | Estado vacío cuando la búsqueda no encuentra nada en ninguna categoría. |

**`src/components/home/`**: `Navbar`, `Hero`, `ProductGrid` (sección genérica por
categoría), `ProductCard` (tarjeta normal **+** card especial `FiguritasEleccionCard`),
`ProductModal` (vista rápida), `CartPanel` (panel lateral del carrito),
`ContactSection`, `Footer`, `ScrollToTop`, `categories` (iconos/labels por categoría).

## 3. Diseño

- **Theme "Violeta Profundo"**: oscuro (fondo violeta) con **acentos lila y rosa**,
  aplicado a todo el sitio **y al panel de admin**.
  (Reemplazó al theme original "Estadio Nocturno", que era navy + dorado.)
- **Tokens de color**: en `src/app/globals.css`, bloque `:root`. Hay **dos familias
  de acento**, cada una con su rol:
  - **Fondos**: `--navy #140f26` (base), `--navy-2 #1c1436` (superficies).
  - **Acciones** (botones, pill de precio, estado seleccionado):
    `--blue #7c3aed`, `--blue-l #8b5cf6`. El gradiente va `--blue-l` → `--blue`.
  - **Realces** (subrayado del navbar, título del hero, íconos de sección, badges):
    `--gold #a78bfa` (lila), `--gold-l #f0abfc` (rosa).
  - **Texto y bordes**: `--ink #efeafe` (texto), `--mut #a396c9` (texto tenue),
    `--line rgba(167,139,250,.16)` (bordes).
  ⚠️ **Los nombres de los tokens quedaron del theme viejo a propósito** (`--navy`,
  `--blue`, `--gold`): renombrarlos obligaba a tocar ~328 usos en 13 componentes.
  Lo que cambió es el valor, no el nombre. Lo mismo con la clase
  `.text-gold-gradient`, que hoy hace un degradé lila → rosa.
- **Texto sobre los botones de acento**: `#140f26` (el propio fondo base). El lila y
  el rosa son colores claros, así que **el blanco NO pasa contraste** (1.76:1);
  `#140f26` da 6.85:1, que cumple WCAG AA.
- **Colores que NO siguen la paleta** (a propósito): el verde de WhatsApp
  (`#25a35a` / `#37c46f`), el rosa de Instagram (`#e46bb0`) y el rojo de
  error/agotado. Son colores de marca o de significado, no decorativos.
- **Tipografía**: **Archivo** (Google Fonts vía `next/font` en `layout.tsx`,
  variable `--font-archivo`); se aplica con la clase `.font-archivo`.
- **Reglas de las cards** (`src/components/home/ProductCard.tsx`):
  - **Normales**: son **clickeables y abren el modal** de vista rápida (`ProductModal`).
    **No** tienen botón "Agregar" ni badge de categoría. El **precio** va en una
    **pill azul centrada** (constante `PRICE_PILL`).
  - **Excepción "Figuritas a Elección"**: conserva **selector de cantidad** (−/+) y
    sus **botones** "Agregar al carrito" (azul) + "Consultar" (verde).

## 4. Decisiones y convenciones ya tomadas

- **NO tocar sin cuidado** (es la conversión de la venta):
  - La lógica del carrito → `src/lib/cart-context.tsx`.
  - La **generación del mensaje de WhatsApp del checkout** → función `confirmar()` en
    `src/app/carrito/page.tsx`.
- **Eliminado a propósito (NO reintroducir)**:
  - La página de detalle `/producto/[id]` (los ítems del carrito **no** navegan a ella).
  - El **botón flotante del carrito** (`CartIcon`) y el **flotante de WhatsApp**.
  - Quedó como único flotante el **"Volver arriba"** (`ScrollToTop`, abajo-derecha).
- **Hero**: el botón secundario **"Consultar por promos"** tiene un mensaje **fijo**:
  `Hola! Quiero consultar por las promos activas.` (en `src/components/home/Hero.tsx`).
- **Catálogo a mano** (sin CMS): para cambiar productos/precios/contacto se edita
  `src/lib/products.ts`.
- **Flujo de trabajo**: el usuario prueba/visualiza él mismo en el navegador.

## 5. Estado actual y pendientes

**Terminado** ✅
- Rediseño **completo** en todo el sitio (navbar, hero, secciones de productos,
  cards, modal, panel del carrito, `/carrito`, contacto, footer). Se hizo primero
  con el theme "Estadio Nocturno" (navy + dorado) y después se **migró a
  "Violeta Profundo"** (ver más abajo); la estructura del rediseño no cambió.
- **Testeado** (flujo carrito → WhatsApp funciona de punta a punta) y con limpieza de
  código muerto.
- **Subido a GitHub** en 10 commits temáticos, **pusheado**. Repo:
  `github.com/felipeLopz/argentinadistribucion`, rama **`main`**, conectado a **Vercel**
  (push a `main` = deploy automático). Working tree limpio.
- **Scripts de `package.json` ordenados y portables** (commit `406b12d`, pusheado):
  `build` → `next build` (se eliminó el `cp -r`, que Vercel no necesita), `start` →
  `next start -p 3000` (en vez de `bun` + `tee` + `NODE_ENV`), y se **eliminaron los
  scripts `db:*` de Prisma** (sin uso). Sin dependencias nuevas. Verificado en local
  (`npm run dev` y `npm run build` OK) y **deploy en Vercel confirmado en verde**.
- **Datos de contacto reales cargados** en `contactConfig` (`products.ts`): WhatsApp
  **`2617085062`** (`wa.me/5492617085062`, único número — lo leen los 9 puntos de acción),
  email **`Lucianagargantini0@gmail.com`**, ubicación **Mendoza, Argentina**, y **dos
  cuentas de Instagram** (`instagrams: [Luli.gargantini, jere.alarcon11]`) que se muestran
  ambas en Contacto y en el Footer. Se **eliminaron las redes falsas del scaffolding**
  (Twitter/Facebook/TikTok con `argentina.distributor`) del footer y del config.
- **Sistema de stock real con base de datos** (Neon Postgres). Stock **por variante**
  con **granularidad mixta**, definida en `STOCK_GROUPS` de `stock-config.ts`:
  fundas 11-16 (`apl-1`) y protectores 11-16 (`apl-5`) **por modelo** (6 filas, no 66);
  funda 17 (`apl-4`) **por color** (11); camiseta (`ind-1`) **por talle** (6); el resto,
  una fila con clave `""`. Son **43 filas** en total.
  La web pública muestra **"Quedan N" / "Agotado"** (tachado, mismo trato que los talles
  agotados) y **bloquea agregar al carrito** lo agotado; mientras carga muestra
  "Verificando stock…". El endpoint público **`/api/stock` es de SOLO LECTURA**
  (POST/PUT/DELETE → 405). Comportamiento **"fallar cerrado"**: si la base no responde,
  todo se trata como agotado.
- **Panel de administración privado** en **`/admindistribucion`**, no enlazado desde
  ningún lado del sitio y con `noindex`. Login con **email + contraseña hasheada con
  bcrypt**, sesión **JWT firmado en cookie `HttpOnly` + `Secure` + `SameSite=Lax` de
  7 días**. Permite **ver, editar, descontar (−1) y agotar** el stock, con buscador.
  Los casilleros editables se **derivan de `stock-config.ts`** (la misma fuente que lee
  la web), y las escrituras **rechazan claves fuera de esa granularidad**. Rutas de
  escritura bajo **`/api/admindistribucion`**, con doble barrera (middleware +
  revalidación de sesión en cada handler) y **límite de 5 intentos de login / 15 min**
  contra la base.
- **Variables de entorno en Vercel** (Production + Preview), **ninguna con
  `NEXT_PUBLIC_`**: `DATABASE_URL` (Neon, la inyecta la integración), `SEED_TOKEN`
  (carga inicial), `ADMIN_USERS` (`email:hash`, admite varios separados por coma) y
  `AUTH_SECRET` (firma de la sesión).
- **Auditoría técnica aplicada** (commits `e9ed6ca` y `8a913cc`, pusheados), en 7 bloques:
  - **Imágenes**: las 7 del catálogo eran **JPEG con extensión `.png`** a 1024px.
    Se convirtieron a **WebP real** a 800px y se migraron a **`next/image`** (con `sizes`
    por contexto y lazy loading). En disco pasaron de **644 KB a 349 KB**, y la home
    **transfiere ~111 KB** porque `next/image` sirve la variante justa (una miniatura
    del carrito baja 64px en vez de 800px). **−83% de transferencia.**
  - **SEO**: **Open Graph + Twitter cards**, con **imagen OG generada** (PNG 1200x630,
    con el theme del sitio) en vez de reusar una foto del catálogo — las del catálogo
    son WebP, que **WhatsApp no renderiza bien** en las tarjetas, y son cuadradas.
    Más `metadataBase` y **sitemap**.
  - **Accesibilidad**: `ProductModal` y `CartPanel` pasaron a ser **diálogos accesibles**
    (`role="dialog"`, `aria-modal`, `aria-labelledby`, cierre con **Escape**, foco que
    entra al abrir, **focus trap** y foco devuelto al cerrar) vía el hook
    `use-dialogo-accesible.ts`. Además `aria-label` en los +/− del modal y
    **`fieldset`/`legend`** en los grupos del checkout (con los estilos por defecto
    reseteados: se verificó que el diseño no se movió).
  - **UX**: **estado vacío de búsqueda** — antes, si nada coincidía, la página quedaba
    en blanco entre el Hero y Contacto. Ahora muestra el término buscado y un botón
    para limpiar.
  - **Seguridad**: **`noopener,noreferrer`** en los 4 `window.open` de WhatsApp
    (reverse tabnabbing). Se verificó que ninguno usa el valor de retorno, que con
    `noopener` pasa a ser `null`.
  - **Prolijidad**: `name` del `package.json` ya no es el genérico del scaffolding.
- **Cambio de paleta a "Violeta Profundo"** (ver sección 3), aplicado en 6 partes
  verificables: tokens y utilidades de `globals.css` → superficies → sombras y glows
  → texto sobre acentos → panel de admin → imagen OG. **Solo valores de color**: no
  se tocó lógica, estructura ni la autenticación del panel. Barrido final confirmado:
  **cero rastros** de los colores del theme anterior en todo el proyecto.

**Pendiente** ⏳ (verificado en el código a la fecha de este archivo)
- [ ] **Reemplazar imágenes placeholder** de funda iPhone 17, protectores 11-16 y
  protector 17 por las reales cuando estén disponibles (hoy los 4 productos de fundas/
  protectores reusan `IMG_FUNDA_IPHONE` en `products.ts`).
- [ ] **Ajustar las cantidades de stock reales desde el panel**: la carga inicial dejó
  la camiseta con sus números del catálogo (3/8/12/10/5/2) pero **todo lo demás en 10
  de relleno** (`STOCK_INICIAL_POR_DEFECTO` en `stock.ts`).
- [ ] **Actualizar promos** (plan ya aprobado, falta aplicar):
  - **Eliminar las 2 fundas de silicona viejas** (`apl-1` "Fundas 11 al 16 de silicona"
    y `apl-4` "Funda 17 silicona") y sus filas de stock.
    ⚠️ **NO tocar los protectores `apl-5` / `apl-6`.**
  - **Eliminar las 3 promos viejas**: `promo-1` (Cargador + Cabezal), `promo-2`
    (Funda + Protector), `promo-3` (Funda + AirPods).
  - **Agregar 3 promos nuevas.** Las fotos **ya están procesadas** a WebP 800px en
    `public/images/` (ver tabla abajo):
    1. **Silicone Case iPhone 11-17** — precio **escalonado por cantidad**
       (1=$5000, 2=$8500, 3=$12500, 4=$16500), **tope en 4**; con 5+ mostrar aviso
       "consultá por WhatsApp". **Tabla de precios visible en el modal.**
       Patrón tipo **"Figuritas a Elección"**: el precio se pre-calcula y se manda ya
       resuelto al carrito, **sin tocar la lógica del carrito**. **SIN control de stock.**
    2. **AirPods Pro 2** — $25000, precio simple, **CON stock**.
    3. **Cable y cabezal iPhone USB-C** — $20000, precio simple, **CON stock**.
  - **Aplicar con ultracode (Opus 4.8 xhigh)** porque la silicone case toca el carrito.
    Verificar bien: **carrito**, **mensaje de WhatsApp**, y que el **aviso de 5+** funcione.
  - **Fotos ya procesadas** (origen: `C:\Users\Pc\OneDrive\Escritorio\Fotos luchi para web\`):

    | Original | En `public/images/` | Medidas | Peso |
    |---|---|---|---|
    | `fundas 11 17.jpeg` | `silicone-case.webp` | 600x800 | 52.6 KB |
    | `promo auriculares.jpeg` | `airpods-pro-2.webp` | 662x800 | 145.7 KB |
    | `promo cable y cabezal.jpeg` | `cable-cabezal-usbc.webp` | 600x800 | 15.5 KB |

    ⚠️ Son **verticales**, mientras que las 7 del catálogo son **cuadradas (800x800)**.
    Las cards usan `aspect-square` + `object-cover`, así que se **recortan arriba y
    abajo**. Revisar el encuadre al aplicarlas; si queda mal, recortarlas a cuadrado.

## 6. Notas / cómo operar el stock

- **Entrar al panel**: `https://<dominio>/admindistribucion` (en local,
  `http://localhost:3000/admindistribucion`). **No hay ningún link al panel** en la web:
  se entra escribiendo la URL a mano, a propósito.
- **Credenciales**: email + contraseña. **La contraseña está guardada aparte (gestor de
  contraseñas), NO está en el repo ni en este archivo.** En Vercel solo vive el **hash
  bcrypt**, dentro de `ADMIN_USERS`. Para cambiarla o sumar un usuario:
  `node scripts/hash-password.mjs` → pegar `email:hash` en `ADMIN_USERS` (varios usuarios
  van separados por coma) → redeploy. **No hace falta tocar código.**
  Si se sospecha una filtración: cambiar `AUTH_SECRET` invalida todas las sesiones.
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
  cambiar si algún día se pasa a un dominio propio: de ahí salen el `metadataBase`
  (que arma las URLs absolutas de las tarjetas de Open Graph) y el `sitemap.xml`.
  Si no se actualiza, las tarjetas al compartir apuntarían al dominio viejo.
- **Si se agregan productos nuevos al catálogo**: después de deployar, correr una vez
  la sincronización para que aparezcan sus filas de stock (es idempotente y **no pisa**
  los valores existentes):
  ```
  curl -X POST https://<dominio>/api/stock/seed -H "x-seed-token: <SEED_TOKEN>"
  ```

## 7. Cómo correr el proyecto

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
- **Deploy**: `git push origin main` dispara el **deploy automático en Vercel**.
  Revisar el estado del build en el dashboard de Vercel.

## 8. Mantenimiento de este archivo

**Actualizá este `CLAUDE.md` al terminar cada sesión con cambios relevantes**
(marcá pendientes como hechos, agregá decisiones nuevas), para que sirva de contexto
en la sesión siguiente.
