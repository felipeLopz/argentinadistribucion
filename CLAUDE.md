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

**`src/components/home/`**: `Navbar`, `Hero`, `ProductGrid` (sección genérica por
categoría), `ProductCard` (tarjeta normal **+** card especial `FiguritasEleccionCard`),
`ProductModal` (vista rápida), `CartPanel` (panel lateral del carrito),
`ContactSection`, `Footer`, `ScrollToTop`, `categories` (iconos/labels por categoría).

## 3. Diseño

- **Theme "Estadio Nocturno"**: oscuro (fondo navy) con **acentos azul y dorado**,
  aplicado a todo el sitio.
- **Tokens de color**: en `src/app/globals.css`, bloque `:root`:
  `--navy #050c2e`, `--navy-2 #0a1550`, `--blue #0b3ecc`, `--blue-l #2d6bff`,
  `--gold #e8b73a`, `--gold-l #f5d06b`, `--ink #e8ecff` (texto), `--mut #8b96c9`
  (texto tenue), `--line rgba(120,140,220,.16)` (bordes).
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
- Rediseño "Estadio Nocturno" **completo** en todo el sitio (navbar, hero, secciones
  de productos, cards, modal, panel del carrito, `/carrito`, contacto, footer).
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

**Pendiente** ⏳ (verificado en el código a la fecha de este archivo)
- [ ] **Reemplazar imágenes placeholder** de funda iPhone 17, protectores 11-16 y
  protector 17 por las reales cuando estén disponibles (hoy los 4 productos de fundas/
  protectores reusan `IMG_FUNDA_IPHONE` en `products.ts`).
- [ ] **Ajustar las cantidades de stock reales desde el panel**: la carga inicial dejó
  la camiseta con sus números del catálogo (3/8/12/10/5/2) pero **todo lo demás en 10
  de relleno** (`STOCK_INICIAL_POR_DEFECTO` en `stock.ts`).

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
