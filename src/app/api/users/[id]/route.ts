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

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  role: z.enum(["OWNER", "BAKER", "ASSISTANT"]).optional(),
  active: z.boolean().optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // No permitir auto-degradación del único OWNER
  if (target.id === session!.userId && parsed.data.role && parsed.data.role !== "OWNER") {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol de OWNER" }, { status: 400 });
  }
  if (target.id === session!.userId && parsed.data.active === false) {
    return NextResponse.json({ error: "No puedes desactivarte a ti mismo" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.newPassword) data.passwordHash = await hashPassword(parsed.data.newPassword);

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  });

  await logActivity({
    user: session,
    action: "user.update",
    entityType: "user",
    entityId: params.id,
    metadata: {
      changedFields: Object.keys(parsed.data).filter(k => k !== "newPassword"),
      passwordReset: !!parsed.data.newPassword,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireOwner();
  if (error) return error;

  if (params.id === session!.userId) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  // En lugar de borrar, desactivar (preserva historial / FK del activity log)
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.user.update({ where: { id: params.id }, data: { active: false } });

  await logActivity({
    user: session,
    action: "user.deactivate",
    entityType: "user",
    entityId: params.id,
    metadata: { email: target.email },
  });

  return NextResponse.json({ ok: true });
}
