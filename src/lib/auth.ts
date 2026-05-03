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

export async function createSession(user: SessionPayload) {
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
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.userId || !payload.email || !payload.role) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE);
}

// ── Comparación timing-safe a través de bcrypt (bcrypt.compare ya es timing-safe) ──
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  // Comparar contra un hash dummy si no existe el user, para que el tiempo
  // de respuesta sea similar y un atacante no pueda enumerar emails válidos.
  const DUMMY_HASH = "$2a$12$abcdefghijklmnopqrstuv0000000000000000000000000000000000";
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) return null;
  // Actualizar lastLoginAt sin esperar (best effort)
  prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
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
