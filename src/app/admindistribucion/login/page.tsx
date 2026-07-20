"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/admindistribucion/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setPassword("");
        router.replace("/admindistribucion");
        router.refresh();
        return;
      }
      setError(data?.error ?? "No se pudo iniciar sesión");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[rgba(15,26,80,0.5)] p-7"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)]">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-3 text-lg font-bold text-white">Gestión de stock</h1>
          <p className="mt-1 text-[13px] text-[var(--mut)]">Acceso privado</p>
        </div>

        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[var(--ink)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-xl border border-[var(--line)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[rgba(232,183,58,0.22)]"
        />

        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[var(--ink)]">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-5 w-full rounded-xl border border-[var(--line)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[rgba(232,183,58,0.22)]"
        />

        {error && (
          <p className="mb-4 flex items-start gap-1.5 text-xs font-semibold text-red-400">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition ${
            enviando
              ? "cursor-not-allowed bg-white/10 text-[var(--mut)]"
              : "bg-gradient-to-br from-[var(--blue-l)] to-[var(--blue)] hover:-translate-y-px hover:brightness-110"
          }`}
        >
          <LogIn className="h-4 w-4" />
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
