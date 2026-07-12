import { redirect } from "next/navigation";

// Las órdenes del catálogo ahora viven como pestaña del dashboard.
// Esta ruta queda como redirect para push notifications viejas y bookmarks.
export default function OrdenesRedirect() {
  redirect("/admin/dashboard?tab=ordenes");
}
