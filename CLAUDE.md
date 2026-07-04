# CLAUDE.md — Estado del proyecto (Argentina Distributor)

> Archivo de memoria entre sesiones. Leelo al retomar el proyecto para saber
> todo lo necesario sin re-explicar. **Actualizalo al terminar cada sesión con
> cambios relevantes** (ver sección 7).

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
**Sin base de datos** (los `db:*`/Prisma del `package.json` son restos muertos).

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

**Pendiente** ⏳ (verificado en el código a la fecha de este archivo)
- [ ] **Datos de contacto reales** en `products.ts` → `contactConfig`. Hoy hay
  **email de prueba `Gmaildeprueba@gmail.com`** y **redes de ejemplo**
  (`instagram/twitter/facebook` con `argentina.distributor`). Validar también el
  WhatsApp `2613900039` (`wa.me/5492613900039`).

## 6. Cómo correr el proyecto

- **Local (Windows)**:
  ```
  npm install
  npm run dev
  ```
  Abrir **http://localhost:3000**. (Si `node` no está en el PATH del shell, abrir una
  terminal nueva; Node se instaló vía winget.)
- **Deploy**: `git push origin main` dispara el **deploy automático en Vercel**.
  Revisar el estado del build en el dashboard de Vercel.

## 7. Mantenimiento de este archivo

**Actualizá este `CLAUDE.md` al terminar cada sesión con cambios relevantes**
(marcá pendientes como hechos, agregá decisiones nuevas), para que sirva de contexto
en la sesión siguiente.
