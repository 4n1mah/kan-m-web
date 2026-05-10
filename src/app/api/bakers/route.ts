// Endpoint para que cualquier usuario logueado obtenga la lista de
// miembros del equipo asignables. Incluye OWNER, BAKER y ASSISTANT.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ["OWNER", "BAKER", "ASSISTANT"] },
    },
    select: { id: true, name: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
