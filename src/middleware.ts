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

// Extrae el JWT de la request: primero `Authorization: Bearer ...`
// (apps móviles), luego cookie `kanm_session` (web). Coincide con la
// lógica de `getSession()` en `src/lib/auth.ts`.
function extractToken(req: NextRequest): string | undefined {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return req.cookies.get("kanm_session")?.value;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = extractToken(req);
  const session = await decodeSession(token);
  const isLogged = !!session?.userId;
  const role = session?.role;

  // Rutas que requieren ser OWNER. `/api/users/fcm-token` es la excepción:
  // cualquier usuario logueado (incluido BAKER) tiene que poder registrar el
  // token FCM de su dispositivo móvil. La autorización fina vive en la ruta.
  const isOwnerOnly =
    pathname.startsWith("/admin/usuarios") ||
    (pathname.startsWith("/api/users") && pathname !== "/api/users/fcm-token");

  // Páginas y APIs protegidas (cualquier usuario logueado)
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isWriteApi =
    (pathname.startsWith("/api/products") && req.method !== "GET") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/activity");
  const isAdminApi = pathname.startsWith("/api/admin/");
  // /api/whatsapp/*: el GET (bandeja de escalaciones) requiere sesión.
  // El POST lo llama el bot externo y se protege con `x-bot-api-key` adentro
  // de la ruta — debe pasar sin cookie.
  // El cron de Vercel (GET /api/whatsapp/escalations/cron) se autentica con
  // `Authorization: Bearer CRON_SECRET` dentro de la ruta, así que también
  // pasa sin cookie.
  const isWhatsappReadApi =
    pathname.startsWith("/api/whatsapp/") &&
    req.method === "GET" &&
    pathname !== "/api/whatsapp/escalations/cron";

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
  if ((isAdminPage || isWriteApi || isAdminApi || isWhatsappReadApi) && !isLogged) {
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
    // /api/whatsapp/*: el middleware corre para todos los métodos, pero la
    // lógica adentro (isWhatsappReadApi) sólo bloquea GET sin sesión. POST
    // del bot externo pasa sin auth y se valida por API key en la ruta.
    "/api/whatsapp/:path*",
  ],
};
