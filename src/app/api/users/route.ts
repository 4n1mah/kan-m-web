import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword, canManageUsers } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

async function requireOwner() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  if (!canManageUsers(session.role)) {
    return { error: NextResponse.json({ error: "Solo el dueño puede gestionar usuarios" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function GET() {
  const { error, session } = await requireOwner();
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, email: true, name: true, role: true,
      active: true, lastLoginAt: true, createdAt: true,
    },
  });
  return NextResponse.json(users);
}

const newUserSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().trim().min(2).max(60),
  password: z.string().min(8).max(200),
  role: z.enum(["OWNER", "BAKER", "ASSISTANT"]),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = newUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: { email: normalizedEmail, name, passwordHash, role },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });

  await logActivity({
    user: session,
    action: "user.create",
    entityType: "user",
    entityId: created.id,
    metadata: { email: created.email, name: created.name, role: created.role },
  });

  return NextResponse.json(created, { status: 201 });
}
