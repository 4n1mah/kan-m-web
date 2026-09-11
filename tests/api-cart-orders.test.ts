import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────
//  POST /api/cart-orders — el precio SIEMPRE lo pone el servidor.
//  El carrito viaja desde el navegador, así que el handler solo usa
//  el id y la cantidad de cada línea: nombre, categoría y precio se
//  releen de la base de datos. Estos tests envían carritos con
//  precios manipulados y verifican qué se guarda realmente.
// ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  cartFindUnique: vi.fn(),
  cartCreate: vi.fn(),
  getSiteSettings: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: mocks.productFindMany },
    cartOrder: { findUnique: mocks.cartFindUnique, create: mocks.cartCreate },
  },
}));
vi.mock("@/lib/settings", () => ({ getSiteSettings: mocks.getSiteSettings }));
vi.mock("@/lib/push", () => ({ notifyOnNewCartOrder: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({
  rateLimit: mocks.rateLimit,
  getClientIp: () => "203.0.113.10",
}));

const { POST } = await import("@/app/api/cart-orders/route");

const COMPROBANTE = "https://res.cloudinary.com/demo/image/upload/v1/comprobante.jpg";

const producto = (extra: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Latica de chocolate",
  price: 400,
  category: "laticas",
  availabilityStatus: "AVAILABLE",
  ...extra,
});

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/cart-orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  } as never);
}

function carrito(items: unknown[]) {
  return {
    customerName: "Luis Perez",
    customerPhone: "809-519-5688",
    items,
    receiptImageUrl: COMPROBANTE,
  };
}

/** Datos con los que el handler llamó a prisma.cartOrder.create. */
function datosCreados() {
  return mocks.cartCreate.mock.calls[0][0].data as {
    subtotal: number;
    total: number;
    items: { id: string; name: string; price: number; quantity: number; category: string }[];
  };
}

beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 60_000 });
  mocks.getSiteSettings.mockResolvedValue({ catalogEnabled: true, quotesEnabled: true });
  mocks.cartFindUnique.mockResolvedValue(null); // ningún código repetido
  mocks.cartCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
    id: "c1",
    createdAt: new Date(),
    ...data,
  }));
  mocks.productFindMany.mockResolvedValue([producto()]);
});

afterEach(() => vi.clearAllMocks());

describe("POST /api/cart-orders — precios manipulados por el cliente", () => {
  it("ignora el precio enviado y usa el de la base de datos", async () => {
    const res = await POST(postReq(carrito([{ id: "p1", quantity: 2, price: 1 }])));
    expect(res.status).toBe(201);

    const guardado = datosCreados();
    expect(guardado.items[0].price).toBe(400);
    expect(guardado.subtotal).toBe(800);
    expect(guardado.total).toBe(800);
  });

  it("un precio de 0 no abarata el pedido", async () => {
    await POST(postReq(carrito([{ id: "p1", quantity: 3, price: 0 }])));
    expect(datosCreados().total).toBe(1200);
  });

  it("el total de la respuesta es el del servidor, no el del cliente", async () => {
    const res = await POST(postReq(carrito([{ id: "p1", quantity: 2, price: 1 }])));
    const body = await res.json();
    expect(body.total).toBe(800);
    expect(body).toHaveProperty("code");
  });

  it("ignora también nombre y categoría enviados por el cliente", async () => {
    await POST(
      postReq(carrito([{ id: "p1", quantity: 1, price: 5, name: "Gratis", category: "hackeado" }]))
    );
    const item = datosCreados().items[0];
    expect(item.name).toBe("Latica de chocolate");
    expect(item.category).toBe("laticas");
    expect(item.price).toBe(400);
  });

  it("un precio negativo lo rechaza la validación de entrada", async () => {
    const res = await POST(postReq(carrito([{ id: "p1", quantity: 1, price: -400 }])));
    expect(res.status).toBe(400);
    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });

  it("suma las cantidades cuando el cliente repite el mismo producto", async () => {
    await POST(postReq(carrito([
      { id: "p1", quantity: 2, price: 400 },
      { id: "p1", quantity: 3, price: 400 },
    ])));
    const guardado = datosCreados();
    expect(guardado.items).toHaveLength(1);
    expect(guardado.items[0].quantity).toBe(5);
    expect(guardado.total).toBe(2000);
  });

  it("rechaza superar el máximo por producto repartiendo el mismo item", async () => {
    const res = await POST(postReq(carrito([
      { id: "p1", quantity: 60, price: 400 },
      { id: "p1", quantity: 60, price: 400 },
    ])));
    expect(res.status).toBe(400);
    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });

  it("acepta productId además de id", async () => {
    await POST(postReq(carrito([{ productId: "p1", quantity: 1 }])));
    expect(datosCreados().total).toBe(400);
  });

  it("redondea el subtotal a dos decimales", async () => {
    mocks.productFindMany.mockResolvedValue([producto({ price: 33.33 })]);
    await POST(postReq(carrito([{ id: "p1", quantity: 3 }])));
    expect(datosCreados().total).toBe(99.99);
  });

  it("no guarda el precio de un producto que no existe", async () => {
    mocks.productFindMany.mockResolvedValue([]);
    const res = await POST(postReq(carrito([{ id: "fantasma", quantity: 1, price: 10 }])));
    expect(res.status).toBe(409);
    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });

  it("rechaza productos agotados u ocultos", async () => {
    mocks.productFindMany.mockResolvedValue([producto({ availabilityStatus: "OUT_OF_STOCK" })]);
    const res = await POST(postReq(carrito([{ id: "p1", quantity: 1 }])));
    expect(res.status).toBe(409);
  });

  it("rechaza productos sin precio en el catálogo", async () => {
    mocks.productFindMany.mockResolvedValue([producto({ price: null })]);
    const res = await POST(postReq(carrito([{ id: "p1", quantity: 1 }])));
    expect(res.status).toBe(409);
  });

  it("exige un comprobante alojado en la cuenta propia de Cloudinary", async () => {
    const res = await POST(postReq({
      customerName: "Luis Perez",
      customerPhone: "809-519-5688",
      items: [{ id: "p1", quantity: 1 }],
      receiptImageUrl: "https://res.cloudinary.com/otra-cuenta/image/upload/v1/x.jpg",
    }));
    expect(res.status).toBe(400);
  });

  it("no crea nada si el catálogo está apagado", async () => {
    mocks.getSiteSettings.mockResolvedValue({ catalogEnabled: false, quotesEnabled: true });
    const res = await POST(postReq(carrito([{ id: "p1", quantity: 1 }])));
    expect(res.status).toBe(403);
    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });
});
