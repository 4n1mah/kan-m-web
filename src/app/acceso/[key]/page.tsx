import { notFound, redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { getSession } from "@/lib/auth";
import AdminLoginForm from "@/components/AdminLoginForm";

// ── Login del panel en URL SECRETA ──────────────────────────────
// El formulario ya no vive en /admin/login (esa ruta ahora da 404).
// Solo se llega al login desde /acceso/<slug>, donde <slug> DEBE coincidir
// con la variable de entorno ADMIN_LOGIN_SLUG (nunca se expone al cliente).
// Objetivo: que bots y curiosos no encuentren la página de acceso.
//
// NOTA de seguridad: esconder la URL reduce el ruido de escaneos, pero la
// protección real sigue siendo la contraseña + rate-limit + bloqueo de
// cuenta del endpoint /api/auth/login. No compartas el enlace por canales
// inseguros ni lo dejes en historiales públicos.

export const runtime = "nodejs";
// Nunca cachear ni prerender: depende de un secreto de servidor y de la sesión.
export const dynamic = "force-dynamic";

// Comparación en tiempo constante para no filtrar el slug por timing.
function slugMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function AccesoPage({
  params,
}: {
  params: { key: string };
}) {
  const expected = process.env.ADMIN_LOGIN_SLUG;

  // Sin secreto configurado, o slug incorrecto → 404 (la página "no existe").
  if (!expected || expected.length < 8 || !slugMatches(params.key, expected)) {
    notFound();
  }

  // Si ya hay sesión válida, no mostrar el login: ir directo al panel.
  const session = await getSession();
  if (session) redirect("/admin/dashboard");

  return <AdminLoginForm />;
}
