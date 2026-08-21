"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Save,
  Plus,
  X,
  Undo2,
  Check,
  AlertCircle,
  FileText,
  Tag,
  Type,
  Upload,
  Image as ImageIcon,
  ListPlus,
  DollarSign,
} from "lucide-react";
import {
  validarNombre,
  validarDescripcion,
  validarPrecio,
  validarPackPrecios,
  validarValorOpcion,
  LARGO_MAX_NOMBRE,
  LARGO_MAX_DESCRIPCION,
} from "@/lib/contenido";

/* ═══════════════════════════════════════════════
   PANEL DE CONTENIDO — foto, título, descripción, precio, precios por
   cantidad y valores de opción

   Edita lo que en products.ts es la BASE. Cada campo tiene dos estados
   visibles: "usa el valor del código" o "editado desde el panel", y
   siempre se puede volver al código con un botón.

   Se valida con las MISMAS funciones puras que usa el servidor
   (contenido.ts), así el error se ve al instante y con el mismo texto.
   Igual el servidor revalida todo: esto es comodidad, no seguridad.
   ═══════════════════════════════════════════════ */

interface GrupoOpciones {
  label: string;
  /** Fijos: vienen de products.ts y NO se pueden quitar. */
  delCodigo: string[];
  /** Agregados desde el panel. Tampoco se pueden quitar. */
  agregados: string[];
}

interface ProductoContenido {
  id: string;
  grupos: GrupoOpciones[];
  /** Título efectivo: el editado si existe, si no el del código. */
  nombre: string;
  categoria: string;
  nombreCodigo: string;
  imagenCodigo: string | null;
  descripcionCodigo: string;
  precioCodigo: number | null;
  packPreciosCodigo: number[] | null;
  /** true en las fundas: tienen una foto por color, que no se toca. */
  tieneFotosPorOpcion: boolean;
  /** Nombre corto con el que el ítem entra al carrito y al WhatsApp.
   *  Si el producto lo tiene, editar el título NO lo cambia. */
  cartName: string | null;
  nombreOverride: string | null;
  imagenOverride: string | null;
  descripcionOverride: string | null;
  precioOverride: number | null;
  /** [] = promo apagada a propósito; null = sin override. */
  packPreciosOverride: number[] | null;
  actualizado: string | null;
  por: string | null;
}

type Estado = "cargando" | "listo" | "error";
type Aviso = { tipo: "ok" | "error"; texto: string };

const API = "/api/admindistribucion/contenido";

const pesos = (n: number) => `$${n.toLocaleString("es-AR")}`;
const unidades = (n: number) => `${n} ${n === 1 ? "unidad" : "unidades"}`;

/* ─── Achicado en el navegador, antes de subir ───
   Una foto de celular pesa 3-8 MB y las funciones de Vercel cortan el body
   en ~4,5 MB: sin esto, subir del teléfono fallaría casi siempre. Además
   sube mucho más rápido con datos móviles.

   No define la calidad final: el servidor re-procesa igual a 800x800 WebP.
   Esto es sólo para que el archivo entre y viaje liviano.

   De paso resuelve el HEIC de los iPhone: el navegador lo decodifica y acá
   sale como WebP, así que al servidor nunca le llega un formato que sharp
   no sepa leer. */
const LADO_SUBIDA = 1600;
const MAX_ORIGINAL_MB = 25;

async function achicar(archivo: File): Promise<File> {
  /* `imageOrientation` aplica la rotación EXIF al decodificar: sin esto una
     foto sacada de costado se sube acostada. */
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });

  const escala = Math.min(1, LADO_SUBIDA / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, "image/webp", 0.9));
  if (!blob) throw new Error("El navegador no pudo convertir la imagen.");
  return new File([blob], "foto.webp", { type: "image/webp" });
}

export default function PanelContenido() {
  const [productos, setProductos] = useState<ProductoContenido[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [busqueda, setBusqueda] = useState("");

  /* Borradores: lo que hay escrito en pantalla, todavía sin guardar */
  const [titulo, setTitulo] = useState<Record<string, string>>({});
  const [nuevaOpcion, setNuevaOpcion] = useState<Record<string, string>>({});
  const [desc, setDesc] = useState<Record<string, string>>({});
  const [precio, setPrecio] = useState<Record<string, string>>({});
  const [pack, setPack] = useState<Record<string, string[]>>({});

  const [ocupado, setOcupado] = useState<Record<string, boolean>>({});
  const [aviso, setAviso] = useState<Record<string, Aviso | undefined>>({});

  /* Traer es pura red: no toca el estado, así el efecto de montaje no
     dispara un setState sincrónico. */
  const traer = useCallback(async (): Promise<ProductoContenido[]> => {
    const res = await fetch(API, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data.productos as ProductoContenido[];
  }, []);

  const aplicarListado = useCallback((lista: ProductoContenido[]) => {
    setProductos(lista);

    /* Los borradores arrancan en el valor EFECTIVO: el override si el
       producto tiene uno, y si no el del código. Así el textarea y los
       escalones muestran de entrada lo que hoy ve el visitante. */
    const t: Record<string, string> = {};
    const d: Record<string, string> = {};
    const pr: Record<string, string> = {};
    const p: Record<string, string[]> = {};
    for (const x of lista) {
      t[x.id] = x.nombreOverride ?? x.nombreCodigo;
      d[x.id] = x.descripcionOverride ?? x.descripcionCodigo;
      /* Un producto sin precio en el código arranca con el campo vacío,
         no con un "0" que parecería un precio real. */
      const efectivo = x.precioOverride ?? x.precioCodigo ?? null;
      pr[x.id] = efectivo === null ? "" : String(efectivo);
      p[x.id] = (x.packPreciosOverride ?? x.packPreciosCodigo ?? []).map(String);
    }
    setTitulo(t);
    setDesc(d);
    setPrecio(pr);
    setPack(p);
    setEstado("listo");
  }, []);

  const fallo = useCallback((e: unknown) => {
    setErrorGeneral(e instanceof Error ? e.message : "No se pudo cargar el contenido");
    setEstado("error");
  }, []);

  useEffect(() => {
    let vivo = true;
    traer().then(
      (lista) => vivo && aplicarListado(lista),
      (e) => vivo && fallo(e)
    );
    return () => {
      vivo = false;
    };
  }, [traer, aplicarListado, fallo]);

  /* La usa el botón "Recargar": acá sí conviene el estado intermedio. */
  const cargar = useCallback(() => {
    setEstado("cargando");
    setErrorGeneral("");
    traer().then(aplicarListado, fallo);
  }, [traer, aplicarListado, fallo]);

  const marcar = (clave: string, a: Aviso | undefined) =>
    setAviso((prev) => ({ ...prev, [clave]: a }));

  const okPasajero = (clave: string, texto: string) => {
    marcar(clave, { tipo: "ok", texto });
    setTimeout(() => marcar(clave, undefined), 2000);
  };

  /** Actualiza un producto en el estado local después de escribir. */
  const aplicar = (id: string, parche: Partial<ProductoContenido>) =>
    setProductos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...parche, actualizado: new Date().toISOString() } : p
      )
    );

  const enviar = async (clave: string, cuerpo: Record<string, unknown>) => {
    if (ocupado[clave]) return null;
    setOcupado((p) => ({ ...p, [clave]: true }));
    marcar(clave, undefined);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      return data as Record<string, unknown>;
    } catch (e) {
      marcar(clave, { tipo: "error", texto: e instanceof Error ? e.message : "Error" });
      return null;
    } finally {
      setOcupado((p) => ({ ...p, [clave]: false }));
    }
  };

  /* ─── Opciones ─── */

  const agregarOpcion = async (p: ProductoContenido, grupo: string) => {
    const clave = `${p.id}|op|${grupo}`;
    const texto = nuevaOpcion[clave] ?? "";

    /* Misma validación que el servidor, para avisar sin ida y vuelta */
    const v = validarValorOpcion(texto);
    if (!v.ok) return marcar(clave, { tipo: "error", texto: v.error });

    const r = await enviar(clave, {
      productId: p.id,
      accion: "agregar-opcion",
      grupo,
      valor: v.valor,
    });
    if (!r) return;

    /* El grupo se reemplaza con lo que devolvió el servidor, que es la
       fuente de verdad de qué quedó agregado. */
    setProductos((prev) =>
      prev.map((x) =>
        x.id !== p.id
          ? x
          : {
              ...x,
              grupos: x.grupos.map((g) =>
                g.label !== grupo
                  ? g
                  : { ...g, agregados: [...g.agregados, r.valor as string] }
              ),
            }
      )
    );
    setNuevaOpcion((prev) => ({ ...prev, [clave]: "" }));
    const filas = r.filasCreadas as number;
    okPasajero(
      clave,
      filas > 0
        ? `Agregado · ${filas} ${filas === 1 ? "casillero" : "casilleros"} de stock en 0`
        : "Agregado"
    );
  };

  /* ─── Foto ─── */

  const subirFoto = async (p: ProductoContenido, archivo: File) => {
    const clave = `${p.id}|foto`;
    if (ocupado[clave]) return;

    if (!archivo.type.startsWith("image/")) {
      return marcar(clave, {
        tipo: "error",
        texto: "Ese archivo no es una imagen. Elegí una foto (JPG, PNG o WebP).",
      });
    }
    if (archivo.size > MAX_ORIGINAL_MB * 1024 * 1024) {
      return marcar(clave, {
        tipo: "error",
        texto: `Esa foto pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB, demasiado incluso para achicarla. Probá con otra.`,
      });
    }

    setOcupado((o) => ({ ...o, [clave]: true }));
    marcar(clave, { tipo: "ok", texto: "Preparando la foto…" });

    try {
      const chico = await achicar(archivo);
      marcar(clave, { tipo: "ok", texto: "Subiendo…" });

      const datos = new FormData();
      datos.append("productId", p.id);
      datos.append("archivo", chico);

      const res = await fetch("/api/admindistribucion/imagen", { method: "POST", body: datos });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      aplicar(p.id, { imagenOverride: data.imagen as string });
      okPasajero(clave, `Listo · ${Math.round((data.bytes as number) / 1024)} KB`);
    } catch (e) {
      marcar(clave, {
        tipo: "error",
        texto: e instanceof Error ? e.message : "No se pudo subir la foto.",
      });
    } finally {
      setOcupado((o) => ({ ...o, [clave]: false }));
    }
  };

  /* ─── Título ─── */

  const guardarTitulo = async (p: ProductoContenido) => {
    const clave = `${p.id}|titulo`;
    const texto = titulo[p.id] ?? "";

    const v = validarNombre(texto);
    if (!v.ok) return marcar(clave, { tipo: "error", texto: v.error });

    const r = await enviar(clave, { productId: p.id, accion: "fijar-nombre", nombre: v.valor });
    if (!r) return;
    const guardado = r.nombre as string;
    /* Se actualiza también `nombre`, que es el encabezado de la ficha */
    aplicar(p.id, { nombreOverride: guardado, nombre: guardado });
    setTitulo((prev) => ({ ...prev, [p.id]: guardado }));
    okPasajero(clave, "Guardado");
  };

  /* ─── Descripción ─── */

  const guardarDescripcion = async (p: ProductoContenido) => {
    const clave = `${p.id}|desc`;
    const texto = desc[p.id] ?? "";

    /* Misma validación que el servidor, para avisar sin ida y vuelta */
    const v = validarDescripcion(texto);
    if (!v.ok) return marcar(clave, { tipo: "error", texto: v.error });

    const r = await enviar(clave, {
      productId: p.id,
      accion: "fijar-descripcion",
      descripcion: v.valor,
    });
    if (!r) return;
    aplicar(p.id, { descripcionOverride: r.descripcion as string });
    setDesc((prev) => ({ ...prev, [p.id]: r.descripcion as string }));
    okPasajero(clave, "Guardado");
  };

  /* ─── Precio simple ─── */

  const guardarPrecio = async (p: ProductoContenido) => {
    const clave = `${p.id}|precio`;
    const crudo = (precio[p.id] ?? "").trim();

    /* Vacío es "no escribiste nada", no un cero: se avisa con el mismo
       texto que daría el servidor. `Number("")` sería 0 y pasaría como
       precio válido de no filtrarlo acá. */
    const v = validarPrecio(crudo === "" ? null : Number(crudo));
    if (!v.ok) return marcar(clave, { tipo: "error", texto: v.error });

    const r = await enviar(clave, { productId: p.id, accion: "fijar-precio", precio: v.valor });
    if (!r) return;
    const guardado = r.precio as number;
    aplicar(p.id, { precioOverride: guardado });
    setPrecio((prev) => ({ ...prev, [p.id]: String(guardado) }));
    okPasajero(clave, "Guardado");
  };

  /* ─── Precios por cantidad ─── */

  const guardarPack = async (p: ProductoContenido) => {
    const clave = `${p.id}|pack`;
    const crudos = pack[p.id] ?? [];

    /* Un campo vacío es un escalón sin precio, no un cero: se avisa acá
       con el mismo texto que daría el servidor. */
    const numeros = crudos.map((s) => (s.trim() === "" ? null : Number(s)));
    const v = validarPackPrecios(numeros);
    if (!v.ok) return marcar(clave, { tipo: "error", texto: v.error });

    const r = await enviar(clave, {
      productId: p.id,
      accion: "fijar-pack",
      packPrecios: v.valor,
    });
    if (!r) return;
    const guardados = r.packPrecios as number[];
    aplicar(p.id, { packPreciosOverride: guardados });
    setPack((prev) => ({ ...prev, [p.id]: guardados.map(String) }));
    okPasajero(clave, guardados.length === 0 ? "Promo apagada" : "Guardado");
  };

  /* ─── Volver al código ─── */

  const CLAVE_DE_CAMPO = {
    nombre: "titulo",
    imagen: "foto",
    descripcion: "desc",
    precio: "precio",
    packPrecios: "pack",
  } as const;

  const volverAlCodigo = async (
    p: ProductoContenido,
    campo: "nombre" | "imagen" | "descripcion" | "precio" | "packPrecios"
  ) => {
    const clave = `${p.id}|${CLAVE_DE_CAMPO[campo]}`;
    const r = await enviar(clave, { productId: p.id, accion: "borrar", campo });
    if (!r) return;

    if (campo === "imagen") {
      aplicar(p.id, { imagenOverride: null });
    } else if (campo === "nombre") {
      aplicar(p.id, { nombreOverride: null, nombre: p.nombreCodigo });
      setTitulo((prev) => ({ ...prev, [p.id]: p.nombreCodigo }));
    } else if (campo === "descripcion") {
      aplicar(p.id, { descripcionOverride: null });
      setDesc((prev) => ({ ...prev, [p.id]: p.descripcionCodigo }));
    } else if (campo === "precio") {
      aplicar(p.id, { precioOverride: null });
      setPrecio((prev) => ({
        ...prev,
        [p.id]: p.precioCodigo == null ? "" : String(p.precioCodigo),
      }));
    } else {
      aplicar(p.id, { packPreciosOverride: null });
      setPack((prev) => ({ ...prev, [p.id]: (p.packPreciosCodigo ?? []).map(String) }));
    }
    okPasajero(clave, "Volvió al valor del código");
  };

  /* ─── Edición de escalones ─── */

  const editarEscalon = (id: string, i: number, valor: string) =>
    setPack((prev) => {
      const lista = [...(prev[id] ?? [])];
      lista[i] = valor;
      return { ...prev, [id]: lista };
    });

  const agregarEscalon = (id: string) =>
    setPack((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), ""] }));

  /* Quitar del medio RENUMERA todo lo de abajo: la posición ES la
     cantidad, así que sacar el escalón de 2 convierte al de 3 en el de 2. */
  const quitarEscalon = (id: string, i: number) =>
    setPack((prev) => ({ ...prev, [id]: (prev[id] ?? []).filter((_, j) => j !== i) }));

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  /* Cuenta un producto una sola vez, tenga uno o cinco campos editados.
     Tiene que nombrarlos a TODOS: si falta alguno, un producto editado
     sólo en ese campo no se cuenta y el resumen miente. */
  const editados = useMemo(
    () =>
      productos.filter(
        (p) =>
          p.nombreOverride !== null ||
          p.imagenOverride !== null ||
          p.descripcionOverride !== null ||
          p.precioOverride !== null ||
          p.packPreciosOverride !== null
      ).length,
    [productos]
  );

  return (
    <div className="mt-8">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mut)]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto…"
            className="w-full rounded-xl border border-[var(--line)] bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--gold)]"
          />
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          <RefreshCw className="h-4 w-4" />
          Recargar
        </button>
      </div>

      {estado === "listo" && (
        <p className="mb-4 text-xs text-[var(--mut)]">
          {productos.length} productos · {editados} con algo editado desde el panel
        </p>
      )}

      {estado === "cargando" && (
        <p className="animate-pulse py-10 text-center text-sm text-[var(--mut)]">
          Cargando contenido…
        </p>
      )}

      {estado === "error" && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            No se pudo cargar el contenido
          </p>
          <p className="mt-1 text-red-300/80">{errorGeneral}</p>
          <p className="mt-2 text-red-300/60">
            El sitio público no se ve afectado: sigue mostrando los valores del código.
          </p>
        </div>
      )}

      {estado === "listo" && filtrados.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--mut)]">
          Nada coincide con la búsqueda.
        </p>
      )}

      <div className="space-y-5">
        {filtrados.map((p) => {
          const claveFoto = `${p.id}|foto`;
          const claveTitulo = `${p.id}|titulo`;
          const editandoFoto = p.imagenOverride !== null;
          const fotoActual = p.imagenOverride ?? p.imagenCodigo;
          const claveDesc = `${p.id}|desc`;
          const clavePack = `${p.id}|pack`;
          const clavePrecio = `${p.id}|precio`;
          const editandoTitulo = p.nombreOverride !== null;
          const editandoDesc = p.descripcionOverride !== null;
          const editandoPrecio = p.precioOverride !== null;
          const editandoPack = p.packPreciosOverride !== null;
          const escalones = pack[p.id] ?? [];
          const textoTitulo = titulo[p.id] ?? "";
          const textoDesc = desc[p.id] ?? "";
          const textoPrecio = precio[p.id] ?? "";

          /* Previsualización con separador de miles: el <input type="number">
             no puede mostrarla (un value con puntos no es un número válido
             y el navegador lo descarta), así que va al lado y se actualiza
             mientras se escribe. */
          const precioNum = Number(textoPrecio.trim());
          const precioPreview =
            textoPrecio.trim() !== "" && Number.isFinite(precioNum) && precioNum > 0
              ? pesos(precioNum)
              : null;

          /* ¿Este producto tiene promo por cantidad ACTIVA? Se mira el
             valor efectivo, no el del código: una promo apagada desde el
             panel (lista vacía) no cuenta. */
          const escaleraActiva =
            (p.packPreciosOverride ?? p.packPreciosCodigo ?? []).length > 0;
          const escalonDeUno = (p.packPreciosOverride ?? p.packPreciosCodigo ?? [])[0];
          /* Aviso, no bloqueo: los dos campos se guardan por separado, así
             que exigir que coincidan trabaría cualquier cambio. */
          const precioDiscrepa =
            escaleraActiva &&
            escalonDeUno !== undefined &&
            precioPreview !== null &&
            precioNum !== escalonDeUno;

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-[var(--line)] bg-[rgba(var(--navy-3-rgb),0.4)] p-5"
            >
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h3 className="text-base font-bold text-white">{p.nombre}</h3>
                <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--mut)]">
                  {p.categoria}
                </span>
              </div>

              {/* ─── Foto ─── */}
              <section className="mb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <ImageIcon className="h-4 w-4 text-[var(--gold)]" />
                    Foto principal
                  </h4>
                  <Etiqueta editado={editandoFoto} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Miniatura. Va como <img> y no <Image> a propósito: es
                      el panel, no hace falta optimizarla, y así no depende
                      de que el host esté en remotePatterns. */}
                  <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--line)] bg-white/[0.04]">
                    {fotoActual ? (
                      <img
                        src={fotoActual}
                        alt=""
                        className="h-full w-full object-cover"
                        key={fotoActual}
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-[var(--mut)]" />
                    )}
                  </span>

                  <div className="flex flex-col gap-2">
                    <label
                      className={`flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-3 py-1.5 text-xs font-bold text-[#1c1c1e] transition hover:brightness-110 ${
                        ocupado[claveFoto] ? "pointer-events-none opacity-40" : ""
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {fotoActual ? "Cambiar foto" : "Subir foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={!!ocupado[claveFoto]}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          /* Se limpia el input para que elegir la MISMA
                             foto otra vez vuelva a disparar el evento. */
                          e.target.value = "";
                          if (f) subirFoto(p, f);
                        }}
                      />
                    </label>

                    <p className="text-[11px] leading-relaxed text-[var(--mut)]">
                      Se achica y se convierte sola: no importa el formato ni el peso.
                    </p>
                  </div>

                  {editandoFoto && (
                    <BotonVolver
                      onClick={() => volverAlCodigo(p, "imagen")}
                      disabled={!!ocupado[claveFoto]}
                    />
                  )}
                  <Mensaje aviso={aviso[claveFoto]} />
                </div>

                {/* Las fundas tienen una foto por color: hay que decirlo o
                    parece que la subida no funcionó. */}
                {p.tieneFotosPorOpcion && (
                  <p className="mt-2 rounded-lg border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-[var(--mut)]">
                    <span className="font-semibold text-[var(--gold)]">Ojo:</span> este producto
                    tiene <span className="font-semibold text-[var(--ink)]">una foto por color</span>
                    . Acá cambiás sólo la principal, que es la que se ve en la grilla. Al elegir un
                    color, el cliente sigue viendo la foto de ese color.
                  </p>
                )}
              </section>

              {/* ─── Título ─── */}
              <section className="mb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <Type className="h-4 w-4 text-[var(--gold)]" />
                    Título
                  </h4>
                  <Etiqueta editado={editandoTitulo} />
                  <span className="ml-auto text-[11px] tabular-nums text-[var(--mut)]">
                    {textoTitulo.trim().length}/{LARGO_MAX_NOMBRE}
                  </span>
                </div>

                <input
                  value={textoTitulo}
                  disabled={!!ocupado[claveTitulo]}
                  onChange={(e) => setTitulo((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") guardarTitulo(p);
                  }}
                  className="w-full rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-[var(--gold)] disabled:opacity-50"
                />

                {editandoTitulo && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--mut)]">
                    <span className="font-semibold">En el código:</span> {p.nombreCodigo}
                  </p>
                )}

                {/* Aviso sólo en los productos que llevan nombre corto al
                    carrito. Es el caso raro y hay que decirlo, si no parece
                    que el cambio no se aplicó. */}
                {p.cartName && (
                  <p className="mt-2 rounded-lg border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-[var(--mut)]">
                    <span className="font-semibold text-[var(--gold)]">Ojo:</span> en el carrito y
                    en el pedido de WhatsApp este producto sigue apareciendo como{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      &ldquo;{p.cartName}&rdquo;
                    </span>
                    , que es su nombre corto. El título de acá cambia lo que se ve en la web.
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BotonGuardar
                    onClick={() => guardarTitulo(p)}
                    disabled={!!ocupado[claveTitulo]}
                  />
                  {editandoTitulo && (
                    <BotonVolver
                      onClick={() => volverAlCodigo(p, "nombre")}
                      disabled={!!ocupado[claveTitulo]}
                    />
                  )}
                  <Mensaje aviso={aviso[claveTitulo]} />
                </div>
              </section>

              {/* ─── Descripción ─── */}
              <section className="mb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <FileText className="h-4 w-4 text-[var(--gold)]" />
                    Descripción
                  </h4>
                  <Etiqueta editado={editandoDesc} />
                  <span className="ml-auto text-[11px] tabular-nums text-[var(--mut)]">
                    {textoDesc.trim().length}/{LARGO_MAX_DESCRIPCION}
                  </span>
                </div>

                <textarea
                  value={textoDesc}
                  rows={3}
                  disabled={!!ocupado[claveDesc]}
                  onChange={(e) => setDesc((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-full resize-y rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 py-2 text-sm leading-relaxed text-white outline-none transition focus:border-[var(--gold)] disabled:opacity-50"
                />

                {editandoDesc && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--mut)]">
                    <span className="font-semibold">En el código:</span> {p.descripcionCodigo}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BotonGuardar
                    onClick={() => guardarDescripcion(p)}
                    disabled={!!ocupado[claveDesc]}
                  />
                  {editandoDesc && (
                    <BotonVolver
                      onClick={() => volverAlCodigo(p, "descripcion")}
                      disabled={!!ocupado[claveDesc]}
                    />
                  )}
                  <Mensaje aviso={aviso[claveDesc]} />
                </div>
              </section>

              {/* ─── Precio ─── */}
              <section className="mb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <DollarSign className="h-4 w-4 text-[var(--gold)]" />
                    Precio
                  </h4>
                  <Etiqueta editado={editandoPrecio} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-[var(--mut)]">$</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={textoPrecio}
                    disabled={!!ocupado[clavePrecio]}
                    onChange={(e) => setPrecio((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") guardarPrecio(p);
                    }}
                    className="w-40 rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 py-2 text-sm font-bold tabular-nums text-white outline-none transition focus:border-[var(--gold)] disabled:opacity-50"
                  />
                  {precioPreview && (
                    <span className="text-sm font-bold tabular-nums text-[var(--gold)]">
                      {precioPreview}
                    </span>
                  )}
                </div>

                {editandoPrecio && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--mut)]">
                    <span className="font-semibold">En el código:</span>{" "}
                    {p.precioCodigo === null ? "sin precio" : pesos(p.precioCodigo)}
                  </p>
                )}

                {/* Los carritos guardan el precio del momento en que se
                    agregó el producto: hay que decirlo o parece un error. */}
                <p className="mt-2 rounded-lg border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-[var(--mut)]">
                  <span className="font-semibold text-[var(--gold)]">Ojo:</span> el precio nuevo
                  vale para el catálogo desde que lo guardás, pero{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    no cambia los carritos que ya estén abiertos
                  </span>
                  : quien agregó el producto antes lo conserva al precio de ese momento, y así
                  llega su pedido por WhatsApp.
                </p>

                {/* La Silicone Case es el caso: precio simple y escalera
                    conviven, y cada uno manda en un lado distinto. */}
                {escaleraActiva && (
                  <p className="mt-2 rounded-lg border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-[var(--mut)]">
                    Este producto{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      también tiene precios por cantidad
                    </span>
                    , acá abajo. Este precio es el que se ve en la grilla y el que usan el filtro
                    y el orden por precio; al abrir el producto, el cliente ve la tabla de
                    cantidades y paga según ella.
                  </p>
                )}

                {precioDiscrepa && (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-300/80">
                    El escalón de 1 unidad sale {pesos(escalonDeUno!)} y acá pusiste{" "}
                    {precioPreview}. Se puede guardar igual, pero en la grilla se va a leer un
                    precio y al abrir el producto otro: conviene dejar los dos iguales.
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BotonGuardar
                    onClick={() => guardarPrecio(p)}
                    disabled={!!ocupado[clavePrecio]}
                  />
                  {editandoPrecio && (
                    <BotonVolver
                      onClick={() => volverAlCodigo(p, "precio")}
                      disabled={!!ocupado[clavePrecio]}
                    />
                  )}
                  <Mensaje aviso={aviso[clavePrecio]} />
                </div>
              </section>

              {/* ─── Precios por cantidad ─── */}
              <section className="border-t border-[var(--line)] pt-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <Tag className="h-4 w-4 text-[var(--gold)]" />
                    Precios por cantidad
                  </h4>
                  {editandoPack && p.packPreciosOverride?.length === 0 ? (
                    <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      PROMO APAGADA
                    </span>
                  ) : (
                    <Etiqueta editado={editandoPack} />
                  )}
                </div>

                {escalones.length === 0 ? (
                  <p className="mb-2 text-[12px] text-[var(--mut)]">
                    Sin promo por cantidad. Agregá escalones para crearla.
                  </p>
                ) : (
                  <ul className="mb-2 space-y-1.5">
                    {escalones.map((valor, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 text-[12px] font-semibold text-[var(--mut)]">
                          {unidades(i + 1)}
                        </span>
                        <span className="text-sm text-[var(--mut)]">$</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={valor}
                          disabled={!!ocupado[clavePack]}
                          onChange={(e) => editarEscalon(p.id, i, e.target.value)}
                          className="w-32 rounded-lg border border-[var(--line)] bg-white/[0.05] px-2.5 py-1.5 text-sm font-bold tabular-nums text-white outline-none transition focus:border-[var(--gold)]"
                        />
                        <button
                          onClick={() => quitarEscalon(p.id, i)}
                          disabled={!!ocupado[clavePack]}
                          title="Quitar este escalón (renumera los de abajo)"
                          className="rounded-lg border border-[var(--line)] p-1.5 text-[var(--mut)] transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {editandoPack && (
                  <p className="mb-2 text-[11px] leading-relaxed text-[var(--mut)]">
                    <span className="font-semibold">En el código:</span>{" "}
                    {p.packPreciosCodigo?.length
                      ? p.packPreciosCodigo.map((n, i) => `${i + 1}: ${pesos(n)}`).join(" · ")
                      : "sin promo por cantidad"}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => agregarEscalon(p.id)}
                    disabled={!!ocupado[clavePack]}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar escalón
                  </button>
                  <BotonGuardar onClick={() => guardarPack(p)} disabled={!!ocupado[clavePack]} />
                  {editandoPack && (
                    <BotonVolver
                      onClick={() => volverAlCodigo(p, "packPrecios")}
                      disabled={!!ocupado[clavePack]}
                    />
                  )}
                  <Mensaje aviso={aviso[clavePack]} />
                </div>

                {escalones.length === 0 && (p.packPreciosCodigo?.length ?? 0) > 0 && (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-300/80">
                    Si guardás con la lista vacía, la promo que define el código queda apagada
                    en la web.
                  </p>
                )}
              </section>

              {/* ─── Opciones ─── */}
              {p.grupos.length > 0 && (
                <section className="mt-5 border-t border-[var(--line)] pt-4">
                  {p.grupos.map((g) => {
                    const claveOp = `${p.id}|op|${g.label}`;
                    return (
                      <div key={g.label} className="mb-4 last:mb-0">
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                          <ListPlus className="h-4 w-4 text-[var(--gold)]" />
                          {g.label}
                          <span className="font-normal text-[var(--mut)]">
                            · {g.delCodigo.length + g.agregados.length} opciones
                          </span>
                        </h4>

                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {g.delCodigo.map((v) => (
                            <span
                              key={v}
                              className="rounded-md border border-[var(--line)] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-[var(--mut)]"
                            >
                              {v}
                            </span>
                          ))}
                          {g.agregados.map((v) => (
                            <span
                              key={v}
                              className="inline-flex items-center gap-1 rounded-md border border-[var(--gold)]/40 bg-[rgba(184,179,171,0.14)] px-2 py-1 text-[11px] font-semibold text-[var(--ink)]"
                            >
                              {v}
                              <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--gold)]">
                                nuevo
                              </span>
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={nuevaOpcion[claveOp] ?? ""}
                            placeholder={`Agregar ${g.label.toLowerCase()}…`}
                            disabled={!!ocupado[claveOp]}
                            onChange={(e) =>
                              setNuevaOpcion((prev) => ({ ...prev, [claveOp]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") agregarOpcion(p, g.label);
                            }}
                            className="w-44 rounded-lg border border-[var(--line)] bg-white/[0.05] px-2.5 py-1.5 text-sm text-white outline-none transition placeholder:text-[var(--mut)]/70 focus:border-[var(--gold)] disabled:opacity-50"
                          />
                          <button
                            onClick={() => agregarOpcion(p, g.label)}
                            disabled={!!ocupado[claveOp]}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                          </button>
                          <Mensaje aviso={aviso[claveOp]} />
                        </div>
                      </div>
                    );
                  })}

                  <p className="rounded-lg border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-[var(--mut)]">
                    Las opciones <span className="font-semibold text-[var(--ink)]">no se pueden
                    borrar</span>, para no perder el stock que ya cargaste ni romper pedidos en
                    curso. Cada opción nueva arranca <span className="font-semibold text-[var(--ink)]">
                    en 0</span>: cargale la cantidad en <span className="font-semibold text-[var(--gold)]">
                    Stock</span>, más arriba.
                  </p>
                </section>
              )}

              {p.actualizado && (
                <p className="mt-3 text-[10px] text-[var(--mut)]/70">
                  Última edición: {new Date(p.actualizado).toLocaleString("es-AR")}
                  {p.por ? ` · ${p.por}` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Piezas chicas ─── */

function Etiqueta({ editado }: { editado: boolean }) {
  return editado ? (
    <span className="rounded-md bg-[rgba(184,179,171,0.18)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--gold)]">
      EDITADO
    </span>
  ) : (
    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--mut)]">
      DEL CÓDIGO
    </span>
  );
}

function BotonGuardar({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-3 py-1.5 text-xs font-bold text-[#1c1c1e] transition hover:brightness-110 disabled:opacity-40"
    >
      <Save className="h-3.5 w-3.5" />
      Guardar
    </button>
  );
}

function BotonVolver({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Borra lo editado y vuelve al valor de products.ts"
      className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30"
    >
      <Undo2 className="h-3.5 w-3.5" />
      Volver al código
    </button>
  );
}

function Mensaje({ aviso }: { aviso: Aviso | undefined }) {
  if (!aviso) return null;
  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-semibold ${
        aviso.tipo === "ok" ? "text-green-400" : "text-red-400"
      }`}
    >
      {aviso.tipo === "ok" ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      {aviso.texto}
    </span>
  );
}
