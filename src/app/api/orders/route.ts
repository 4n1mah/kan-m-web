import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { validateDominicanPhone } from "@/lib/phone";
import { isAllowedCloudinaryImageUrl } from "@/lib/cloudinary";

async function isAuthed() {
  const session = await getSession();
  return !!session;
}

export async function GET() {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });

  // Normalize Json fields — Prisma returns them as Prisma.JsonValue (object),
  // but the frontend expects plain arrays/objects
  const normalized = orders.map(o => ({
    ...o,
    selectedItems: Array.isArray(o.selectedItems) ? o.selectedItems : [],
    imageUrls: Array.isArray(o.imageUrls) ? o.imageUrls : [],
    cakeDetails: o.cakeDetails && typeof o.cakeDetails === "object" ? o.cakeDetails : null,
  }));

  return NextResponse.json(normalized);
}

// Esquema de validación para POST público.
// Limita longitudes para evitar abuso por payloads gigantes.
const newOrderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().refine(
    (v) => validateDominicanPhone(v),
    { message: "Ingresa un número dominicano válido, ejemplo: 809-519-5688." }
  ),
  email: z.string().trim().max(120).email().optional().or(z.literal("")).nullable(),
  eventType: z.string().trim().min(2).max(60),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
  guestCount: z.string().trim().min(1).max(20),
  selectedItems: z.array(z.string().max(120)).max(40).optional(),
  cakeDetails: z.record(z.any()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  imageUrls: z.array(z.string().url().max(500).refine(
    (v) => isAllowedCloudinaryImageUrl(v),
    { message: "Las imagenes deben ser URLs validas de Cloudinary" }
  )).max(20).optional(),
  deliveryTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable().or(z.literal("")),
  deliveryMethod: z.enum(["pickup", "delivery"]).optional().nullable().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  // Rate limit: máximo 10 pedidos cada 10 min por IP
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `order:${ip}`, limit: 10, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Has enviado muchas solicitudes. Por favor espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = newOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Validar que la fecha sea al menos today + 3 días (zona horaria RD = UTC-4)
  const nowRD = new Date(Date.now() - 4 * 3600_000);
  const todayRD = new Date(nowRD.toISOString().slice(0, 10) + "T00:00:00");
  const minDate = new Date(todayRD);
  minDate.setDate(minDate.getDate() + 3);
  const eventDateObj = new Date(data.eventDate + "T00:00:00");
  if (isNaN(eventDateObj.getTime()) || eventDateObj < minDate) {
    return NextResponse.json(
      { error: "Los pedidos personalizados deben realizarse con un mínimo de 3 días de antelación." },
      { status: 400 }
    );
  }
  const twoYears = 2 * 365 * 86400_000;
  if (eventDateObj.getTime() > Date.now() + twoYears) {
    return NextResponse.json({ error: "Fecha del evento inválida" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      eventType: data.eventType,
      eventDate: data.eventDate,
      guestCount: data.guestCount,
      selectedItems: data.selectedItems ?? [],
      cakeDetails: data.cakeDetails ?? undefined,
      notes: data.notes || null,
      imageUrls: data.imageUrls ?? [],
      deliveryTime: data.deliveryTime || null,
      deliveryMethod: data.deliveryMethod || null,
      status: "PENDING",
    },
  });

  return NextResponse.json(order, { status: 201 });
}
