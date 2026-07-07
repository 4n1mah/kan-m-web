import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyOnEscalation } from "@/lib/push";
import { timingSafeEqual } from "crypto";

async function liberarEstadoBot(phone: string): Promise<void> {
  // Libera el estado del bot en wa_conversations directamente
  // en la DB compartida. Usa SQL crudo porque Prisma no modela
  // las tablas wa_* (son del bot Python).
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE wa_conversations
          SET state = 'menu_principal',
              escalated_at = NULL,
              context = COALESCE(context, '{}'::jsonb) ||
                        '{"escalado_aviso_enviado": false,
                          "escalado_motivo": null}'::jsonb,
              updated_at = now()
        WHERE phone = $1`,
      phone
    );
  } catch (e) {
    console.error("[escalations] liberarEstadoBot failed:", e);
  }
}

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

// Caps de longitud conservadores: no imponen formato de teléfono (el bot
// puede mandar formato internacional de WhatsApp) pero evitan payloads
// gigantes en columnas Text.
const escalationSchema = z.object({
  phone: z.string().trim().min(5).max(32),
  clientName: z.string().trim().max(120).optional().nullable(),
  motivo: z.string().trim().max(200).optional().nullable(),
  summary: z.string().max(10000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!verifyBotKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = escalationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { phone, clientName, motivo, summary } = parsed.data;

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
  return NextResponse.json(escalations, {
    headers: { "Cache-Control": "private, no-store" },
  });
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
  let phoneToUse: string | null = phone;
  try {
    if (phone) {
      await prisma.whatsappEscalation.delete({ where: { phone } });
    } else {
      const esc = await prisma.whatsappEscalation.findUnique({
        where: { id: id! },
        select: { phone: true },
      });
      phoneToUse = esc?.phone ?? null;
      await prisma.whatsappEscalation.delete({ where: { id: id! } });
    }
    if (phoneToUse) {
      await liberarEstadoBot(phoneToUse);
    }
  } catch {
    // Idempotente: si no existe, ok igual
  }
  return NextResponse.json({ ok: true });
}
