import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canEditCatalog, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { isAllowedStoredImageUrl } from "@/lib/cloudinary";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  category: z.enum(["cakes", "desserts", "events", "picaderas", "brunch", "drinks"]),
  imageUrl: z.string().max(500).refine(
    (v) => isAllowedStoredImageUrl(v),
    { message: "Debe ser una imagen valida de Cloudinary" }
  ),
  price: z.number().nonnegative().nullable().optional(),
  availabilityStatus: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]).optional(),
});

export async function GET(req: NextRequest) {
  const cat = req.nextUrl.searchParams.get("category");
  const session = await getSession();
  const isAdmin = !!session;

  // Public users only see orderable products. Admin users see every status.
  const where: Prisma.ProductWhereInput = {};
  if (cat) where.category = cat;
  if (!isAdmin) where.availabilityStatus = { in: ["AVAILABLE", "OUT_OF_STOCK"] };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditCatalog(session.role)) {
    return NextResponse.json({ error: "Sin permisos para modificar el catalogo" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.product.create({ data: parsed.data });
  await logActivity({
    user: session,
    action: "product.create",
    entityType: "product",
    entityId: created.id,
    metadata: { name: created.name, category: created.category },
  });
  return NextResponse.json(created, { status: 201 });
}
