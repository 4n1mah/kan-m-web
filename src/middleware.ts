import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ALG = "HS256";

async function isValid(token: string | undefined) {
  if (!token) return false;
  const authSecret = process.env.AUTH_SECRET ?? process.env.JWT_SECRET;
  if (!authSecret) return false;
  try {
    const secret = new TextEncoder().encode(authSecret);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("kanm_session")?.value;
  const valid = await isValid(token);

  // Protect /admin/dashboard and admin write APIs
  const isAdminPage = pathname.startsWith("/admin/dashboard");
  const isWriteApi =
    (pathname.startsWith("/api/products") && req.method !== "GET") ||
    pathname.startsWith("/api/upload");

  if ((isAdminPage || isWriteApi) && !valid) {
    if (isWriteApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // If logged in and visiting login, redirect to dashboard
  if (pathname === "/admin/login" && valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/products/:path*", "/api/upload"],
};
