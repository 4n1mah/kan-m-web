"use client";
import { usePathname } from "next/navigation";

/**
 * Fondo decorativo fijo del sitio público: mesh de marca a bajo alpha
 * sobre el crema base. Se composita una sola vez (position:fixed, sin
 * filtros ni animación) — cero costo en scroll. Oculto en /admin.
 */
export default function SiteBackdrop() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <div aria-hidden className="site-backdrop" />;
}
