import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function verifyCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const { count } = await prisma.whatsappEscalation.deleteMany({
    where: {
      resolvedAt: null,
      updatedAt: { lt: cutoff },
    },
  });
  console.info(`[escalations-cron] Resueltas ${count} por inactividad`);
  return NextResponse.json({ resolved: count });
}
