// Endpoint para que cualquier usuario logueado obtenga la lista de
// reposteras + dueñas activas. Útil para llenar dropdowns de "asignar a".
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ["OWNER", "BAKER"] },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
