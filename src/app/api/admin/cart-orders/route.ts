import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canViewFinancials, getSession } from "@/lib/auth";
import { stripCartOrderFinancials } from "@/lib/financials";

// Nota de permisos: cualquier usuario logueado (incluida la ASISTENTE) puede
// LEER las ordenes del catalogo — ve la pestaña Ordenes en modo solo lectura.
// Las acciones (confirmar/negar pago) exigen canManageCartOrders en [id]/route.ts.
// Los importes (subtotal, total y el precio de cada item) se recortan en el
// servidor para los roles sin canViewFinancials — ver src/lib/financials.ts.
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl;
  const limitRaw = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;
  const cursor = url.searchParams.get("cursor") || undefined;
  const status = url.searchParams.get("status");

  const orders = await prisma.cartOrder.findMany({
    where: status ? { status: status as "PENDING" | "CONFIRMED" | "DENIED" | "SENT" } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = orders.length > limit;
  const slice = hasMore ? orders.slice(0, limit) : orders;
  const nextCursor = hasMore ? slice[slice.length - 1].id : null;

  const visible = canViewFinancials(session.role)
    ? slice
    : slice.map((order) => stripCartOrderFinancials(order));

  // Compat con el dashboard web actual (espera array). Si el cliente
  // pasa `?limit` o `?cursor`, devolvemos objeto con metadata.
  const wantsPagination =
    url.searchParams.has("limit") ||
    url.searchParams.has("cursor") ||
    url.searchParams.has("status");

  if (!wantsPagination) {
    return NextResponse.json(visible, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return NextResponse.json(
    { orders: visible, nextCursor, hasMore },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
