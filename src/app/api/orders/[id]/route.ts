import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "NEEDS_INFO", "REJECTED", "CANCELLED"];
const VALID_BAKERS   = ["Karolyn Sierra", "Astrid Sierra", null, ""];

async function isAuthed() { return !!(await getSession()); }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status))
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    data.status = body.status;
  }

  if (body.assignedTo !== undefined) {
    data.assignedTo = body.assignedTo || null;
  }

  const order = await prisma.order.update({ where: { id: params.id }, data });
  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
