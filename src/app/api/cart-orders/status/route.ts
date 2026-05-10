import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `order-status:${ip}`, limit: 20, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiadas consultas. Espera unos minutos." }, { status: 429 });
  }

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim() ?? "";
  if (!code || !/^PED-\d{4,}$/.test(code)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const order = await prisma.cartOrder.findUnique({
    where: { code },
    select: { code: true, status: true, total: true, createdAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(order);
}
