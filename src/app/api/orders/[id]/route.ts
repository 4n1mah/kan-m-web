import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_STATUSES = ["PENDING","CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED","REJECTED","CANCELLED"];

async function isAuthed() { return !!(await getSession()); }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status))
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    data.status = body.status;

    // Append to status log
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { statusLog: true } as any,
    }) as any;
    const log = Array.isArray(existing?.statusLog) ? existing.statusLog : [];
    data.statusLog = [...log, { status: body.status, by: body.changedBy ?? "Admin", at: new Date().toISOString() }];
  }

  if (body.assignedTo !== undefined)     data.assignedTo    = body.assignedTo || null;
  if (body.internalNote !== undefined)   data.internalNote  = body.internalNote || null;
  if (body.agreedPrice !== undefined)    data.agreedPrice   = body.agreedPrice  === "" || body.agreedPrice  === null ? null : Number(body.agreedPrice);
  if (body.depositAmount !== undefined)  data.depositAmount = body.depositAmount === "" || body.depositAmount === null ? null : Number(body.depositAmount);
  if (body.paymentStatus !== undefined)  data.paymentStatus = body.paymentStatus;
  if (body.deliveryMethod !== undefined) data.deliveryMethod = body.deliveryMethod || null;
  if (body.name !== undefined)           data.name          = body.name;
  if (body.phone !== undefined)          data.phone         = body.phone;
  if (body.email !== undefined)          data.email         = body.email || null;
  if (body.eventType !== undefined)      data.eventType     = body.eventType;
  if (body.eventDate !== undefined)      data.eventDate     = body.eventDate;
  if (body.deliveryTime !== undefined)   data.deliveryTime  = body.deliveryTime || null;
  if (body.guestCount !== undefined)     data.guestCount    = body.guestCount;
  if (body.notes !== undefined)          data.notes         = body.notes || null;

  const order = await prisma.order.update({ where: { id: params.id }, data });
  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
