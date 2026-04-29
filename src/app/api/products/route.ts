import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  category: z.enum(["cakes", "desserts", "events", "picaderas", "brunch"]),
  imageUrl: z.string().max(500).refine(
    (v) => v.startsWith("/uploads/") || /^https?:\/\//.test(v),
    { message: "Debe ser una URL válida o una imagen subida al servidor" }
  ),
  price: z.number().nonnegative().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const cat = req.nextUrl.searchParams.get("category");
  const products = await prisma.product.findMany({
    where: cat ? { category: cat } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  // Auth enforced in middleware
  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
