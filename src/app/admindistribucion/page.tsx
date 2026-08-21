import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import BotonSalir from "./BotonSalir";
import PanelStock from "./PanelStock";
import PanelContenido from "./PanelContenido";

/* Panel de gestión: stock + contenido editable.

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
          <h1 className="text-2xl font-black text-white">Panel de gestión</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">
            Sesión iniciada como <span className="font-semibold text-[var(--gold)]">{email}</span>
          </p>
        </div>
        <BotonSalir />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-black text-white">Stock</h2>
        <PanelStock />
      </section>

      <section className="mt-14 border-t border-[var(--line)] pt-10">
        <h2 className="text-lg font-black text-white">Fotos, textos y precios</h2>
        <p className="mt-1 text-sm text-[var(--mut)]">
          Lo que se edita acá pisa lo que dice <code className="text-[var(--gold)]">products.ts</code>{" "}
          sin necesidad de hacer deploy. Si la base falla, la web vuelve sola a los valores del
          código.
        </p>
        <PanelContenido />
      </section>
    </div>
  );
}
