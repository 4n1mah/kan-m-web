import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyOnEscalation } from "@/lib/push";
import { timingSafeEqual } from "crypto";

function verifyBotKey(req: NextRequest): boolean {
  const key = req.headers.get("x-bot-api-key") || "";
  const expected = process.env.BOT_API_KEY || "";
  if (!expected || !key) return false;
  try {
    const a = Buffer.from(key.padEnd(64));
    const b = Buffer.from(expected.padEnd(64));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyBotKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.phone) {
    return NextResponse.json({ error: "phone requerido" }, { status: 400 });
  }
  const { phone, clientName, motivo, summary } = body;

  const escalation = await prisma.whatsappEscalation.upsert({
    where: { phone },
    create: {
      phone,
      clientName: clientName || "Cliente",
      motivo: motivo || "manual",
      summary: summary || "",
    },
    update: {
      clientName: clientName || "Cliente",
      motivo: motivo || "manual",
      summary: summary || "",
      resolvedAt: null,
      updatedAt: new Date(),
    },
  });

  try {
    await notifyOnEscalation({
      id: escalation.id,
      phone,
      clientName: escalation.clientName,
      motivo: escalation.motivo,
    });
  } catch (e) {
    console.error("[escalations] push failed:", e);
  }

  return NextResponse.json(escalation, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const escalations = await prisma.whatsappEscalation.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(escalations);
}

export async function DELETE(req: NextRequest) {
  const isBotCall = verifyBotKey(req);
  if (!isBotCall) {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const phone = req.nextUrl.searchParams.get("phone");
  const id = req.nextUrl.searchParams.get("id");
  if (!phone && !id) {
    return NextResponse.json({ error: "phone o id requerido" }, { status: 400 });
  }
  try {
    if (phone) {
      await prisma.whatsappEscalation.delete({ where: { phone } });
    } else {
      await prisma.whatsappEscalation.delete({ where: { id: id! } });
    }
  } catch {
    // Idempotente: si no existe, ok igual
  }
  return NextResponse.json({ ok: true });
}
