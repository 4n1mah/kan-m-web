import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "ASSISTANT") {
    return NextResponse.json({ error: "Sin permisos para ver el registro de actividad" }, { status: 403 });
  }

  const url = req.nextUrl;
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const userId = url.searchParams.get("userId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const where: Prisma.ActivityLogWhereInput = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
