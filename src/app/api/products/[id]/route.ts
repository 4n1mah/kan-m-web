import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canEditCatalog, getSession } from "@/lib/auth";
import { logActivity, diffChanges } from "@/lib/activityLog";
import { isAllowedStoredImageUrl } from "@/lib/cloudinary";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  category: z.enum(["cakes", "desserts", "events", "picaderas", "brunch", "drinks", "laticas"]),
  imageUrl: z.string().max(500).refine(
    (v) => isAllowedStoredImageUrl(v),
    { message: "Debe ser una imagen valida de Cloudinary" }
  ),
  price: z.number().nonnegative().nullable().optional(),
  availabilityStatus: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!session && product.availabilityStatus !== "AVAILABLE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditCatalog(session.role)) {
    return NextResponse.json({ error: "Sin permisos para modificar el catalogo" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.product.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data,
    });
    const changes = diffChanges(before as unknown as Record<string, unknown>, parsed.data);
    if (Object.keys(changes).length > 0) {
      await logActivity({
        user: session,
        action: "product.update",
        entityType: "product",
        entityId: params.id,
        metadata: { changes },
      });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditCatalog(session.role)) {
    return NextResponse.json({ error: "Sin permisos para modificar el catalogo" }, { status: 403 });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    await prisma.product.delete({ where: { id: params.id } });
    if (product) {
      await logActivity({
        user: session,
        action: "product.delete",
        entityType: "product",
        entityId: params.id,
        metadata: { name: product.name },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
