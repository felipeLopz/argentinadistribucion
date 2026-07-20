import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import BotonSalir from "./BotonSalir";
import PanelStock from "./PanelStock";

/* Panel de gestión de stock.

   Segunda barrera: además del middleware, esta página revalida la sesión
   del lado del servidor por su cuenta. */

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const email = await requerirSesion();
  if (!email) redirect("/admindistribucion/login");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gestión de stock</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">
            Sesión iniciada como <span className="font-semibold text-[var(--gold)]">{email}</span>
          </p>
        </div>
        <BotonSalir />
      </div>

      <PanelStock />
    </div>
  );
}
