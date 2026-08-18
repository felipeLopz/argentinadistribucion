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
} from "lucide-react";
import { validarDescripcion, validarPackPrecios, LARGO_MAX_DESCRIPCION } from "@/lib/contenido";

/* ═══════════════════════════════════════════════
   PANEL DE CONTENIDO — descripciones y precios por cantidad

   Edita lo que en products.ts es la BASE. Cada campo tiene dos estados
   visibles: "usa el valor del código" o "editado desde el panel", y
   siempre se puede volver al código con un botón.

   Se valida con las MISMAS funciones puras que usa el servidor
   (contenido.ts), así el error se ve al instante y con el mismo texto.
   Igual el servidor revalida todo: esto es comodidad, no seguridad.
   ═══════════════════════════════════════════════ */

interface ProductoContenido {
  id: string;
  nombre: string;
  categoria: string;
  descripcionCodigo: string;
  packPreciosCodigo: number[] | null;
  descripcionOverride: string | null;
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

export default function PanelContenido() {
  const [productos, setProductos] = useState<ProductoContenido[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [busqueda, setBusqueda] = useState("");

  /* Borradores: lo que hay escrito en pantalla, todavía sin guardar */
  const [desc, setDesc] = useState<Record<string, string>>({});
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
    const d: Record<string, string> = {};
    const p: Record<string, string[]> = {};
    for (const x of lista) {
      d[x.id] = x.descripcionOverride ?? x.descripcionCodigo;
      p[x.id] = (x.packPreciosOverride ?? x.packPreciosCodigo ?? []).map(String);
    }
    setDesc(d);
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

  const volverAlCodigo = async (p: ProductoContenido, campo: "descripcion" | "packPrecios") => {
    const clave = `${p.id}|${campo === "descripcion" ? "desc" : "pack"}`;
    const r = await enviar(clave, { productId: p.id, accion: "borrar", campo });
    if (!r) return;

    if (campo === "descripcion") {
      aplicar(p.id, { descripcionOverride: null });
      setDesc((prev) => ({ ...prev, [p.id]: p.descripcionCodigo }));
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

  const editados = useMemo(
    () =>
      productos.filter((p) => p.descripcionOverride !== null || p.packPreciosOverride !== null)
        .length,
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
          const claveDesc = `${p.id}|desc`;
          const clavePack = `${p.id}|pack`;
          const editandoDesc = p.descripcionOverride !== null;
          const editandoPack = p.packPreciosOverride !== null;
          const escalones = pack[p.id] ?? [];
          const textoDesc = desc[p.id] ?? "";

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-[var(--line)] bg-[rgba(36,26,69,0.4)] p-5"
            >
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h3 className="text-base font-bold text-white">{p.nombre}</h3>
                <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--mut)]">
                  {p.categoria}
                </span>
              </div>

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
    <span className="rounded-md bg-[rgba(167,139,250,0.18)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--gold)]">
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
      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40"
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
