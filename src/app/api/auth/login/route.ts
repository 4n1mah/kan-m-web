import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyCredentials } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";

const schema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  // Rate limit: máximo 8 intentos cada 5 minutos por IP
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `login:${ip}`, limit: 8, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos antes de reintentar." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const result = await verifyCredentials(email, password);
  if (result === "LOCKED") {
    return NextResponse.json(
      { error: "Esta cuenta está bloqueada por varios intentos fallidos. Contacta a la dueña para desbloquearla." },
      { status: 403 }
    );
  }
  if (!result) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }
  const user = result;

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // Log de inicio de sesión
  await logActivity({
    user: { userId: user.id, email: user.email, name: user.name, role: user.role },
    action: "user.login",
    entityType: "user",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
}
