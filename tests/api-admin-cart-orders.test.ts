import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────
//  Órdenes del catálogo en el panel: ASSISTANT puede verlas en modo
//  solo lectura, pero sin importes. El recorte ocurre en el servidor,
//  tanto en el listado como en el detalle.
// ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { cartOrder: { findMany: mocks.findMany, findUnique: mocks.findUnique, update: vi.fn() } },
}));
vi.mock("@/lib/activityLog", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/externalApi", () => ({ sendOrderToExternalApi: vi.fn() }));
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  getSession: mocks.getSession,
}));

const { GET: GET_LISTA } = await import("@/app/api/admin/cart-orders/route");
const { GET: GET_DETALLE } = await import("@/app/api/admin/cart-orders/[id]/route");

const ORDEN = {
  id: "c1",
  code: "PED-0001",
  customerName: "Luis",
  customerPhone: "809-519-5688",
  fulfillmentMethod: "PICKUP",
  items: [{ id: "p1", name: "Latica", price: 400, quantity: 2, category: "laticas" }],
  subtotal: 800,
  total: 800,
  receiptImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/x.jpg",
  status: "PENDING",
  externalSyncStatus: "NOT_SENT",
};

const sesion = (role: "OWNER" | "BAKER" | "ASSISTANT") => ({
  userId: "u1",
  email: "user@kanm.com",
  name: "Usuaria",
  role,
});

const req = (url = "http://localhost/api/admin/cart-orders") => new NextRequest(url);
const params = { params: { id: "c1" } };

beforeEach(() => {
  mocks.findMany.mockResolvedValue([ORDEN]);
  mocks.findUnique.mockResolvedValue(ORDEN);
  mocks.getSession.mockResolvedValue(null);
});

afterEach(() => vi.clearAllMocks());

describe("GET /api/admin/cart-orders (listado)", () => {
  it("sin sesión responde 401", async () => {
    expect((await GET_LISTA(req())).status).toBe(401);
  });

  it("OWNER recibe subtotal, total y el precio de cada item", async () => {
    mocks.getSession.mockResolvedValue(sesion("OWNER"));
    const [orden] = await (await GET_LISTA(req())).json();
    expect(orden.subtotal).toBe(800);
    expect(orden.total).toBe(800);
    expect(orden.items[0].price).toBe(400);
  });

  it("BAKER también los recibe", async () => {
    mocks.getSession.mockResolvedValue(sesion("BAKER"));
    const [orden] = await (await GET_LISTA(req())).json();
    expect(orden.total).toBe(800);
    expect(orden.items[0].price).toBe(400);
  });

  it("ASSISTANT no recibe subtotal ni total", async () => {
    mocks.getSession.mockResolvedValue(sesion("ASSISTANT"));
    const [orden] = await (await GET_LISTA(req())).json();
    expect(orden).not.toHaveProperty("subtotal");
    expect(orden).not.toHaveProperty("total");
  });

  it("ASSISTANT no recibe el precio dentro de los items", async () => {
    mocks.getSession.mockResolvedValue(sesion("ASSISTANT"));
    const [orden] = await (await GET_LISTA(req())).json();
    expect(orden.items[0]).not.toHaveProperty("price");
    expect(orden.items[0].name).toBe("Latica");
    expect(orden.items[0].quantity).toBe(2);
  });

  it("ASSISTANT conserva lo que sí necesita para trabajar", async () => {
    mocks.getSession.mockResolvedValue(sesion("ASSISTANT"));
    const [orden] = await (await GET_LISTA(req())).json();
    expect(orden.code).toBe("PED-0001");
    expect(orden.customerName).toBe("Luis");
    expect(orden.status).toBe("PENDING");
    expect(orden.receiptImageUrl).toContain("cloudinary");
  });

  it("el filtrado también aplica en la respuesta paginada", async () => {
    mocks.getSession.mockResolvedValue(sesion("ASSISTANT"));
    const res = await GET_LISTA(req("http://localhost/api/admin/cart-orders?limit=500"));
    const body = await res.json();
    expect(body.orders[0]).not.toHaveProperty("total");
    expect(body.orders[0].items[0]).not.toHaveProperty("price");
  });
});

describe("GET /api/admin/cart-orders/[id] (detalle)", () => {
  it("sin sesión responde 401", async () => {
    expect((await GET_DETALLE(req(), params)).status).toBe(401);
  });

  it("OWNER recibe los importes", async () => {
    mocks.getSession.mockResolvedValue(sesion("OWNER"));
    const orden = await (await GET_DETALLE(req(), params)).json();
    expect(orden.total).toBe(800);
    expect(orden.subtotal).toBe(800);
    expect(orden.items[0].price).toBe(400);
  });

  it("ASSISTANT no recibe importes en el detalle", async () => {
    mocks.getSession.mockResolvedValue(sesion("ASSISTANT"));
    const orden = await (await GET_DETALLE(req(), params)).json();
    expect(orden).not.toHaveProperty("subtotal");
    expect(orden).not.toHaveProperty("total");
    expect(orden.items[0]).not.toHaveProperty("price");
    expect(orden.code).toBe("PED-0001");
  });

  it("responde 404 cuando la orden no existe", async () => {
    mocks.getSession.mockResolvedValue(sesion("OWNER"));
    mocks.findUnique.mockResolvedValue(null);
    expect((await GET_DETALLE(req(), params)).status).toBe(404);
  });
});
