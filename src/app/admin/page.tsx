import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminIndex() {
  const session = await getSession();
  // Con sesión → al panel. Sin sesión → 404: el login vive en una URL
  // secreta (/acceso/<slug>), no exponemos ninguna pista de dónde entrar.
  if (session) redirect("/admin/dashboard");
  notFound();
}
