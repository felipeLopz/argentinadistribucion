"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Save, Minus, Ban, Check, AlertCircle } from "lucide-react";

interface Variante {
  key: string;
  cantidad: number | null;
  actualizado: string | null;
  por: string | null;
}
interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  variantes: Variante[];
}

type Estado = "cargando" | "listo" | "error";

const API = "/api/admindistribucion/stock";

/** Identificador único de una fila (producto + variante). */
const idFila = (productId: string, key: string) => `${productId}|${key}`;

export default function PanelStock() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<Record<string, boolean>>({});
  const [aviso, setAviso] = useState<Record<string, { tipo: "ok" | "error"; texto: string }>>({});

  const cargar = useCallback(async () => {
    setEstado("cargando");
    setErrorGeneral("");
    try {
      const res = await fetch(API, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setProductos(data.productos as Producto[]);
      /* Los borradores se recargan con los valores reales de la base */
      const nuevos: Record<string, string> = {};
      for (const p of data.productos as Producto[]) {
        for (const v of p.variantes) {
          nuevos[idFila(p.id, v.key)] = v.cantidad === null ? "" : String(v.cantidad);
        }
      }
      setBorradores(nuevos);
      setEstado("listo");
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : "No se pudo cargar el stock");
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Aplica el resultado de una escritura sobre el estado local. */
  const aplicar = (productId: string, key: string, cantidad: number) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : {
              ...p,
              variantes: p.variantes.map((v) =>
                v.key === key ? { ...v, cantidad, actualizado: new Date().toISOString() } : v
              ),
            }
      )
    );
    setBorradores((prev) => ({ ...prev, [idFila(productId, key)]: String(cantidad) }));
  };

  const enviar = async (
    productId: string,
    key: string,
    accion: "fijar" | "descontar" | "agotar",
    cantidad?: number
  ) => {
    const fila = idFila(productId, key);
    if (ocupado[fila]) return;
    setOcupado((p) => ({ ...p, [fila]: true }));
    setAviso((p) => ({ ...p, [fila]: undefined as never }));
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, stockKey: key, accion, cantidad }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      aplicar(productId, key, data.cantidad as number);
      setAviso((p) => ({ ...p, [fila]: { tipo: "ok", texto: "Guardado" } }));
      setTimeout(() => setAviso((p) => ({ ...p, [fila]: undefined as never })), 2000);
    } catch (e) {
      setAviso((p) => ({
        ...p,
        [fila]: { tipo: "error", texto: e instanceof Error ? e.message : "Error" },
      }));
    } finally {
      setOcupado((p) => ({ ...p, [fila]: false }));
    }
  };

  const guardar = (productId: string, key: string) => {
    const valor = borradores[idFila(productId, key)] ?? "";
    const n = Number(valor);
    if (valor.trim() === "" || !Number.isInteger(n) || n < 0) {
      setAviso((p) => ({
        ...p,
        [idFila(productId, key)]: { tipo: "error", texto: "Poné un entero de 0 o más" },
      }));
      return;
    }
    enviar(productId, key, "fijar", n);
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    const out: Producto[] = [];
    for (const p of productos) {
      if (p.nombre.toLowerCase().includes(q)) {
        out.push(p);
        continue;
      }
      const vs = p.variantes.filter((v) => v.key.toLowerCase().includes(q));
      if (vs.length) out.push({ ...p, variantes: vs });
    }
    return out;
  }, [productos, busqueda]);

  const totalUnidades = useMemo(
    () =>
      productos.reduce(
        (s, p) => s + p.variantes.reduce((t, v) => t + (v.cantidad ?? 0), 0),
        0
      ),
    [productos]
  );

  return (
    <div className="mt-8">
      {/* Buscador */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mut)]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto o variante…"
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
          {productos.length} productos · {totalUnidades} unidades en total
        </p>
      )}

      {estado === "cargando" && (
        <p className="animate-pulse py-10 text-center text-sm text-[var(--mut)]">Cargando stock…</p>
      )}

      {estado === "error" && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            No se pudo cargar el stock
          </p>
          <p className="mt-1 text-red-300/80">{errorGeneral}</p>
        </div>
      )}

      {estado === "listo" && filtrados.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--mut)]">Nada coincide con la búsqueda.</p>
      )}

      {/* Listado */}
      <div className="space-y-5">
        {filtrados.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-[var(--line)] bg-[rgba(15,26,80,0.4)] p-5"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold text-white">{p.nombre}</h2>
              <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--mut)]">
                {p.categoria}
              </span>
            </div>

            <div className="space-y-2">
              {p.variantes.map((v) => {
                const fila = idFila(p.id, v.key);
                const trabajando = !!ocupado[fila];
                const msg = aviso[fila];
                const agotado = v.cantidad === 0;
                return (
                  <div
                    key={fila}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.03] px-3 py-2.5"
                  >
                    <span className="min-w-[150px] flex-1 text-sm font-semibold text-[var(--ink)]">
                      {v.key === "" ? (
                        <span className="text-[var(--mut)]">Sin variantes</span>
                      ) : (
                        v.key
                      )}
                      {agotado && (
                        <span className="ml-2 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          AGOTADO
                        </span>
                      )}
                      {v.cantidad === null && (
                        <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--mut)]">
                          SIN CARGAR
                        </span>
                      )}
                    </span>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={borradores[fila] ?? ""}
                      disabled={trabajando}
                      onChange={(e) =>
                        setBorradores((prev) => ({ ...prev, [fila]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") guardar(p.id, v.key);
                      }}
                      className="w-20 rounded-lg border border-[var(--line)] bg-white/[0.05] px-2.5 py-1.5 text-center text-sm font-bold tabular-nums text-white outline-none transition focus:border-[var(--gold)]"
                    />

                    <button
                      onClick={() => guardar(p.id, v.key)}
                      disabled={trabajando}
                      title="Guardar este número"
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar
                    </button>

                    <button
                      onClick={() => enviar(p.id, v.key, "descontar")}
                      disabled={trabajando || v.cantidad === 0}
                      title="Descontar una unidad (venta confirmada)"
                      className="flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />1
                    </button>

                    <button
                      onClick={() => enviar(p.id, v.key, "agotar")}
                      disabled={trabajando || v.cantidad === 0}
                      title="Poner en 0"
                      className="flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-30"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Agotar
                    </button>

                    {msg && (
                      <span
                        className={`flex items-center gap-1 text-[11px] font-semibold ${
                          msg.tipo === "ok" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {msg.tipo === "ok" ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        {msg.texto}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
