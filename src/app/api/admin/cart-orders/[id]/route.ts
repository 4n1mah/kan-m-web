import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageCartOrders, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { sendOrderToExternalApi } from "@/lib/externalApi";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "DENIED", "SENT"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageCartOrders(session.role)) {
    return NextResponse.json({ error: "Sin permisos para modificar ordenes online" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const existing = await prisma.cartOrder.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  if (existing.status === body.status) return NextResponse.json(existing);

  const updated = await prisma.cartOrder.update({
    where: { id: params.id },
    data: { status: body.status },
  });

  await logActivity({
    user: session,
    action: "cart_order.status",
    entityType: "cart_order",
    entityId: params.id,
    metadata: { from: existing.status, to: body.status, by: session.name },
  });

  // Cuando se confirma, intentar sync con API externa
  if (body.status === "CONFIRMED") {
    const result = await sendOrderToExternalApi({
      code: updated.code,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      fulfillmentMethod: updated.fulfillmentMethod,
      items: updated.items,
      total: updated.total,
      receiptImageUrl: updated.receiptImageUrl,
      status: updated.status,
      createdAt: updated.createdAt,
    });

    const syncStatus =
      result === "sent" ? "SENT" : result === "failed" ? "FAILED" : "NOT_SENT";

    const finalOrder = await prisma.cartOrder.update({
      where: { id: params.id },
      data: { externalSyncStatus: syncStatus },
    });

    return NextResponse.json(finalOrder);
  }

  return NextResponse.json(updated);
}
