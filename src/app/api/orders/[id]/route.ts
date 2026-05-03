import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

const VALID_STATUSES = ["PENDING","CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED","REJECTED","CANCELLED"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  // Cargar el pedido actual para hacer diff y append en statusLog
  const existing = await prisma.order.findUnique({ where: { id: params.id } }) as any;
  if (!existing) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status))
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    if (body.status !== existing.status) {
      data.status = body.status;
      changes.status = { from: existing.status, to: body.status };
      const log = Array.isArray(existing?.statusLog) ? existing.statusLog : [];
      data.statusLog = [...log, {
        status: body.status,
        by: session.name,
        byUserId: session.userId,
        at: new Date().toISOString(),
      }];
    }
  }

  // Helper: solo asigna a `data` si el valor cambia, y registra en `changes`
  function setIfChanged(field: string, newValue: unknown) {
    const old = existing[field];
    const same = JSON.stringify(old ?? null) === JSON.stringify(newValue ?? null);
    if (!same) {
      data[field] = newValue;
      changes[field] = { from: old ?? null, to: newValue ?? null };
    }
  }

  if (body.assignedTo !== undefined)     setIfChanged("assignedTo", body.assignedTo || null);
  if (body.internalNote !== undefined)   setIfChanged("internalNote", body.internalNote || null);
  if (body.agreedPrice !== undefined) {
    if (body.agreedPrice === "" || body.agreedPrice === null) {
      setIfChanged("agreedPrice", null);
    } else {
      const n = Number(body.agreedPrice);
      if (!isFinite(n) || n < 0) return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
      setIfChanged("agreedPrice", n);
    }
  }
  if (body.depositAmount !== undefined) {
    if (body.depositAmount === "" || body.depositAmount === null) {
      setIfChanged("depositAmount", null);
    } else {
      const n = Number(body.depositAmount);
      if (!isFinite(n) || n < 0) return NextResponse.json({ error: "Depósito inválido" }, { status: 400 });
      setIfChanged("depositAmount", n);
    }
  }
  if (body.paymentStatus !== undefined) {
    if (!["PENDING","PARTIAL","PAID"].includes(body.paymentStatus))
      return NextResponse.json({ error: "Estado de pago inválido" }, { status: 400 });
    setIfChanged("paymentStatus", body.paymentStatus);
  }
  if (body.deliveryMethod !== undefined) {
    if (body.deliveryMethod && !["pickup","delivery"].includes(body.deliveryMethod))
      return NextResponse.json({ error: "Método de entrega inválido" }, { status: 400 });
    setIfChanged("deliveryMethod", body.deliveryMethod || null);
  }
  if (body.name !== undefined)           setIfChanged("name", body.name);
  if (body.phone !== undefined)          setIfChanged("phone", body.phone);
  if (body.email !== undefined)          setIfChanged("email", body.email || null);
  if (body.eventType !== undefined)      setIfChanged("eventType", body.eventType);
  if (body.eventDate !== undefined)      setIfChanged("eventDate", body.eventDate);
  if (body.deliveryTime !== undefined)   setIfChanged("deliveryTime", body.deliveryTime || null);
  if (body.guestCount !== undefined)     setIfChanged("guestCount", body.guestCount);
  if (body.notes !== undefined)          setIfChanged("notes", body.notes || null);

  // Si nada cambió, no escribir y no loggear ruido
  if (Object.keys(data).length === 0) {
    return NextResponse.json(existing);
  }

  try {
    const order = await prisma.order.update({ where: { id: params.id }, data });

    // Log de actividad — separa cambios de estado vs cambios de datos
    if (changes.status) {
      await logActivity({
        user: session,
        action: "order.status",
        entityType: "order",
        entityId: params.id,
        metadata: { from: changes.status.from, to: changes.status.to, otherChanges: Object.keys(changes).filter(k => k !== "status") },
      });
    } else {
      await logActivity({
        user: session,
        action: "order.update",
        entityType: "order",
        entityId: params.id,
        metadata: { changes },
      });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Error al actualizar el pedido" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.order.delete({ where: { id: params.id } });
    await logActivity({
      user: session,
      action: "order.delete",
      entityType: "order",
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
}
