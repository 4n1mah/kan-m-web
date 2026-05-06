import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canDeleteOrders, canEditAnyOrder, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { isAllowedCloudinaryImageUrl } from "@/lib/cloudinary";
import { validateDominicanPhone } from "@/lib/phone";

const VALID_STATUSES = ["PENDING","CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED","REJECTED","CANCELLED"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditAnyOrder(session.role)) {
    return NextResponse.json({ error: "Sin permisos para modificar pedidos" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  // Cargar el pedido actual para hacer diff y append en statusLog
  const existingOrder = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existingOrder) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  const existing = existingOrder;

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
  function setIfChanged(field: keyof typeof existing & string, newValue: unknown) {
    const old = existing[field];
    const same = JSON.stringify(old ?? null) === JSON.stringify(newValue ?? null);
    if (!same) {
      data[field] = newValue;
      changes[field] = { from: old ?? null, to: newValue ?? null };
    }
  }

  // BAKER puede asignarse a sí misma o a cualquier ASSISTANT activo.
  // OWNER puede asignar a cualquiera.
  if (body.assignedTo !== undefined) {
    if (session.role === "BAKER" && body.assignedTo && body.assignedTo !== session.name) {
      const target = await prisma.user.findFirst({
        where: { name: body.assignedTo, active: true, role: "ASSISTANT" },
        select: { id: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Solo puedes asignarte pedidos a ti misma o a asistentes." },
          { status: 403 }
        );
      }
    }
    setIfChanged("assignedTo", body.assignedTo || null);
  }
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
  if (body.imageUrls !== undefined) {
    if (!Array.isArray(body.imageUrls))
      return NextResponse.json({ error: "imageUrls debe ser un array" }, { status: 400 });
    if (body.imageUrls.length > 20)
      return NextResponse.json({ error: "Máximo 20 imágenes por pedido" }, { status: 400 });
    if (!body.imageUrls.every((url: unknown) => typeof url === "string" && isAllowedCloudinaryImageUrl(url)))
      return NextResponse.json({ error: "Las imagenes deben ser URLs validas de Cloudinary" }, { status: 400 });
    setIfChanged("imageUrls", body.imageUrls);
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.length > 80)
      return NextResponse.json({ error: "Nombre inválido (máximo 80 caracteres)" }, { status: 400 });
    setIfChanged("name", body.name);
  }
  if (body.phone !== undefined) {
    if (!validateDominicanPhone(body.phone))
      return NextResponse.json({ error: "Teléfono inválido. Formato esperado: 809-000-0000" }, { status: 400 });
    setIfChanged("phone", body.phone);
  }
  if (body.email !== undefined) {
    if (body.email && (typeof body.email !== "string" || body.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)))
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    setIfChanged("email", body.email || null);
  }
  if (body.eventType !== undefined) {
    if (typeof body.eventType !== "string" || body.eventType.trim().length < 1 || body.eventType.length > 60)
      return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });
    setIfChanged("eventType", body.eventType);
  }
  if (body.eventDate !== undefined) {
    if (typeof body.eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.eventDate))
      return NextResponse.json({ error: "Fecha inválida (formato esperado: YYYY-MM-DD)" }, { status: 400 });
    setIfChanged("eventDate", body.eventDate);
  }
  if (body.deliveryTime !== undefined)   setIfChanged("deliveryTime", body.deliveryTime || null);
  if (body.guestCount !== undefined) {
    if (typeof body.guestCount !== "string" || body.guestCount.length > 20)
      return NextResponse.json({ error: "Cantidad de invitados inválida" }, { status: 400 });
    setIfChanged("guestCount", body.guestCount);
  }
  if (body.notes !== undefined) {
    if (body.notes && (typeof body.notes !== "string" || body.notes.length > 2000))
      return NextResponse.json({ error: "Notas demasiado largas (máximo 2000 caracteres)" }, { status: 400 });
    setIfChanged("notes", body.notes || null);
  }

  // Si nada cambió, no escribir y no loggear ruido
  if (Object.keys(data).length === 0) {
    return NextResponse.json(existing);
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data: data as Prisma.OrderUncheckedUpdateInput,
    });

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
  if (!canDeleteOrders(session.role)) {
    return NextResponse.json({ error: "Solo OWNER puede eliminar pedidos" }, { status: 403 });
  }
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
