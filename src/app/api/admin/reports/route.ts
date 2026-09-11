import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canViewReports, getSession } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────
//  Feed de /admin/reportes — solo OWNER y BAKER.
//
//  La página de reportes calcula sus métricas en el cliente y además
//  lista pedidos individuales y exporta CSV, así que este endpoint
//  devuelve filas, no solo agregados. Su función es que el permiso
//  (canViewReports) se aplique en el servidor y no solo en la UI:
//  el middleware bloquea la PÁGINA a ASSISTANT, pero un bloqueo de
//  página no protege datos por sí solo.
//
//  Se seleccionan únicamente los campos que la página consume.
// ─────────────────────────────────────────────────────────────

const MAX_ROWS = 500;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewReports(session.role)) {
    return NextResponse.json({ error: "Sin permisos para ver reportes" }, { status: 403 });
  }

  const [orders, cartOrders] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS + 1, // +1 para saber si quedaron filas fuera
      select: {
        id: true, name: true, phone: true, eventType: true, eventDate: true,
        status: true, assignedTo: true, agreedPrice: true, createdAt: true,
      },
    }),
    prisma.cartOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS + 1,
      select: {
        id: true, code: true, customerName: true, customerPhone: true,
        status: true, total: true, items: true, createdAt: true,
      },
    }),
  ]);

  const hasMore = orders.length > MAX_ROWS || cartOrders.length > MAX_ROWS;

  return NextResponse.json(
    {
      orders: orders.slice(0, MAX_ROWS),
      // items es Json en Prisma; la página espera siempre un array.
      cartOrders: cartOrders.slice(0, MAX_ROWS).map(o => ({
        ...o,
        items: Array.isArray(o.items) ? o.items : [],
      })),
      hasMore,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
