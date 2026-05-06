import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ALG = "HS256";

async function decodeSession(token: string | undefined) {
  if (!token) return null;
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) return null;
  try {
    const secret = new TextEncoder().encode(authSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId?: string; email?: string; name?: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("kanm_session")?.value;
  const session = await decodeSession(token);
  const isLogged = !!session?.userId;
  const role = session?.role;

  // Rutas que requieren ser OWNER
  const isOwnerOnly =
    pathname.startsWith("/admin/usuarios") ||
    pathname.startsWith("/api/users");

  // Páginas y APIs protegidas (cualquier usuario logueado)
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isWriteApi =
    (pathname.startsWith("/api/products") && req.method !== "GET") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/activity");
  const isAdminApi = pathname.startsWith("/api/admin/");

  const isApiCall = pathname.startsWith("/api/");

  // OWNER-only: bloquear si no es OWNER
  if (isOwnerOnly && (!isLogged || role !== "OWNER")) {
    if (!isLogged) {
      if (isApiCall) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    if (isApiCall) return NextResponse.json({ error: "Solo el dueño puede hacer esto" }, { status: 403 });
    // página /admin/usuarios — la página misma muestra "acceso restringido"
    // así que dejamos pasar para no causar loop con el dashboard
  }

  // ASSISTANT: solo puede acceder a pedidos y calendario.
  // Reportes y catálogo son exclusivos de OWNER y BAKER.
  if (isLogged && role === "ASSISTANT") {
    const blocked = pathname.startsWith("/admin/reportes");
    if (blocked) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Bloqueos generales
  if ((isAdminPage || isWriteApi || isAdminApi) && !isLogged) {
    if (isApiCall) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Si está logueado y va al login, mandar al dashboard
  if (pathname === "/admin/login" && isLogged) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/products/:path*",
    "/api/upload",
    "/api/users/:path*",
    "/api/activity/:path*",
    "/api/admin/:path*",
  ],
};
