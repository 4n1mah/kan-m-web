import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE = "kanm_session";
const ALG = "HS256";
const SESSION_DAYS = 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (≥32 chars)");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: "OWNER" | "BAKER" | "ASSISTANT";
};

// Crea el JWT y lo setea como cookie httpOnly (web).
// Devuelve el token también, para que el endpoint de login lo pueda
// devolver en el body cuando el cliente sea una app móvil.
export async function createSession(user: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });

  return token;
}

// Lee la sesión del cliente. Acepta dos formatos:
//   1. Authorization: Bearer <jwt>   (apps móviles, clientes nativos)
//   2. Cookie kanm_session            (navegador web)
//
// Si pasas `req`, intenta primero el Bearer header; si no hay req o no
// existe el header, cae al cookie. Mantiene compatibilidad con todas las
// rutas existentes que llaman `getSession()` sin argumentos.
export async function getSession(req?: Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    const auth = req.headers.get("authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) {
      token = auth.slice(7).trim();
    }
  }

  if (!token) {
    token = cookies().get(COOKIE)?.value;
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.userId || !payload.email || !payload.role) return null;

    const user = await prisma.user.findUnique({
      where: { id: String(payload.userId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lockedUntil: true,
      },
    });
    if (!user || !user.active) return null;
    if (user.lockedUntil && user.lockedUntil > new Date()) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE);
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos, auto-expira

// ── Comparación timing-safe a través de bcrypt (bcrypt.compare ya es timing-safe) ──
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  // Comparar contra un hash dummy si no existe el user, para que el tiempo
  // de respuesta sea similar y un atacante no pueda enumerar emails válidos.
  const DUMMY_HASH = "$2a$12$abcdefghijklmnopqrstuv0000000000000000000000000000000000";
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.active) return null;

  // Verificar bloqueo temporal (auto-expira)
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return "LOCKED" as const;
  }

  if (!ok) {
    const newCount = (user.failedLoginAttempts ?? 0) + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newCount,
        ...(newCount >= MAX_FAILED_ATTEMPTS
          ? { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) }
          : {}),
      },
    });
    return null;
  }

  // Login exitoso: resetear contador y actualizar lastLoginAt
  prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
  }).catch(() => {});

  return user;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

// ── Helpers de autorización ──
export function canManageUsers(role: SessionPayload["role"]) {
  return role === "OWNER";
}
export function canEditCatalog(role: SessionPayload["role"]) {
  return role === "OWNER" || role === "BAKER";
}
export function canEditAnyOrder(role: SessionPayload["role"]) {
  return role === "OWNER" || role === "BAKER";
}
export function canDeleteOrders(role: SessionPayload["role"]) {
  return role === "OWNER";
}
export function canManageCartOrders(role: SessionPayload["role"]) {
  return role === "OWNER" || role === "BAKER";
}
export function canViewActivity(role: SessionPayload["role"]) {
  return role === "OWNER" || role === "BAKER";
}
export function canUploadOrderPhotos(role: SessionPayload["role"]) {
  return role === "OWNER" || role === "BAKER";
}
export function canViewReports(role: SessionPayload["role"]) {
  return role === "OWNER" || role === "BAKER";
}
export function canManageSettings(role: SessionPayload["role"]) {
  return role === "OWNER";
}
