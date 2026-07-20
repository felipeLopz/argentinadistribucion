"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function BotonSalir() {
  const router = useRouter();

  const salir = async () => {
    await fetch("/api/admindistribucion/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    router.replace("/admindistribucion/login");
    router.refresh();
  };

  return (
    <button
      onClick={salir}
      className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
    >
      <LogOut className="h-4 w-4" />
      Salir
    </button>
  );
}
