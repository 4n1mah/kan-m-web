import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Fail-closed: sin CRON_SECRET configurado el endpoint queda deshabilitado.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron deshabilitado (CRON_SECRET no configurado)" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
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
