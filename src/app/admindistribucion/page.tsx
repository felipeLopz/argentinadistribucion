import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import BotonSalir from "./BotonSalir";

/* Shell del panel.
   El listado, la edición y el "−1" llegan en el sub-paso 3b.

   Segunda barrera: además del middleware, esta página revalida la sesión
   del lado del servidor por su cuenta. */

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const email = await requerirSesion();
  if (!email) redirect("/admindistribucion/login");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gestión de stock</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">
            Sesión iniciada como <span className="font-semibold text-[var(--gold)]">{email}</span>
          </p>
        </div>
        <BotonSalir />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-[rgba(15,26,80,0.4)] p-10 text-center">
        <p className="text-sm text-[var(--mut)]">
          El listado de productos, la edición de stock y el botón de descuento
          se agregan en el próximo paso.
        </p>
      </div>
    </div>
  );
}
