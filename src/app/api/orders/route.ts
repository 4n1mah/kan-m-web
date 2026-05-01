import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function isAuthed() {
  const session = await getSession();
  return !!session;
}

export async function GET() {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, eventType, eventDate, guestCount, selectedItems, cakeDetails, notes, imageUrls, deliveryTime } = body;

  if (!name || !phone || !eventType || !eventDate || !guestCount) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      name, phone,
      email: email || null,
      eventType, eventDate, guestCount,
      selectedItems: selectedItems ?? [],
      cakeDetails: cakeDetails ?? null,
      notes: notes || null,
      imageUrls: imageUrls ?? [],
      deliveryTime: deliveryTime || null,
      status: "PENDING",
    },
  });

  return NextResponse.json(order, { status: 201 });
}
