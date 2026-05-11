import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { validateDominicanPhone } from "@/lib/phone";
import { isAllowedCloudinaryImageUrl } from "@/lib/cloudinary";
import { notifyOnNewCartOrder } from "@/lib/push";

const MAX_CART_ITEMS = 40;
const MAX_ITEM_QUANTITY = 99;

const cartItemSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  productId: z.string().min(1).max(120).optional(),
  quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
  name: z.string().max(120).optional(),
  price: z.number().nonnegative().nullable().optional(),
  category: z.string().max(60).optional(),
}).refine((item) => item.id || item.productId, {
  message: "Producto requerido",
  path: ["id"],
});

const cartOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z.string().trim().refine(
    (v) => validateDominicanPhone(v),
    { message: "Ingresa un numero dominicano valido, ejemplo: 809-519-5688." }
  ),
  items: z.array(cartItemSchema).min(1).max(MAX_CART_ITEMS),
  receiptImageUrl: z.string().url().max(500).refine(
    (v) => isAllowedCloudinaryImageUrl(v),
    { message: "El comprobante debe ser una imagen valida de Cloudinary" }
  ),
});

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `PED-${num}`;
    const existing = await prisma.cartOrder.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `PED-${Date.now().toString().slice(-4)}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `cart-order:${ip}`, limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = cartOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerName, customerPhone, items, receiptImageUrl } = parsed.data;

  const quantitiesByProduct = new Map<string, number>();
  for (const item of items) {
    const productId = item.productId ?? item.id;
    if (!productId) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    const nextQuantity = (quantitiesByProduct.get(productId) ?? 0) + item.quantity;
    if (nextQuantity > MAX_ITEM_QUANTITY) {
      return NextResponse.json(
        { error: `Cantidad maxima por producto: ${MAX_ITEM_QUANTITY}` },
        { status: 400 }
      );
    }
    quantitiesByProduct.set(productId, nextQuantity);
  }

  const productIds = [...quantitiesByProduct.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, category: true, availabilityStatus: true },
  });
  const productsById = new Map(products.map((p) => [p.id, p]));

  const missing = productIds.filter((id) => !productsById.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Uno o mas productos no existen. Por favor actualiza tu carrito." },
      { status: 409 }
    );
  }

  const normalizedItems = productIds.map((id) => {
    const product = productsById.get(id)!;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantitiesByProduct.get(id)!,
      category: product.category,
      availabilityStatus: product.availabilityStatus,
    };
  });

  const unavailable = normalizedItems.filter((item) => item.availabilityStatus !== "AVAILABLE");
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: `Algunos productos ya no estan disponibles: ${unavailable.map((i) => i.name).join(", ")}. Por favor actualiza tu carrito.` },
      { status: 409 }
    );
  }

  const withoutPrice = normalizedItems.filter((item) => item.price === null);
  if (withoutPrice.length > 0) {
    return NextResponse.json(
      { error: `Algunos productos no se pueden ordenar desde el carrito: ${withoutPrice.map((i) => i.name).join(", ")}.` },
      { status: 409 }
    );
  }

  const orderItems = normalizedItems.map(({ availabilityStatus, ...item }) => item);
  const subtotal = Math.round(
    orderItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0) * 100
  ) / 100;

  // Retry hasta 3 veces si la unique-constraint en `code` choca por race entre
  // dos órdenes simultáneas. Tras 3 intentos respondemos 503 para que el
  // cliente reintente (en lugar de fallar con 500 silencioso).
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = await generateUniqueCode();
    try {
      const order = await prisma.cartOrder.create({
        data: {
          code,
          customerName,
          customerPhone,
          fulfillmentMethod: "PICKUP",
          items: orderItems,
          subtotal,
          total: subtotal,
          receiptImageUrl,
          status: "PENDING",
          externalSyncStatus: "NOT_SENT",
        },
      });

      try {
        await notifyOnNewCartOrder({
          id: order.id,
          code: order.code,
          customerName: order.customerName,
          total: order.total,
        });
      } catch (e) {
        console.error("[cart-orders] notifyOnNewCartOrder failed:", e);
      }

      return NextResponse.json(
        { code: order.code, id: order.id, total: order.total },
        { status: 201 }
      );
    } catch (err) {
      // P2002 = unique constraint violation. Reintentar con código nuevo.
      const isUniqueErr =
        typeof err === "object" && err !== null &&
        (err as { code?: string }).code === "P2002";
      if (!isUniqueErr || attempt === 2) {
        console.error("[cart-orders] create failed:", err);
        return NextResponse.json(
          { error: "No pudimos crear la orden ahora mismo. Intenta de nuevo en un momento." },
          { status: 503 }
        );
      }
      // si es colisión, el for vuelve a generar otro code
    }
  }

  // Inalcanzable, pero TypeScript lo necesita
  return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
}
