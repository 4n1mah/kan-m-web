import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────
//  Tests del handler real de /api/orders (no de una copia de la
//  lógica): se simulan solo sus dependencias de infraestructura.
//  De @/lib/auth se sustituye únicamente getSession — los helpers
//  de permisos son los de producción.
// ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
  getSession: vi.fn(),
  getSiteSettings: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { order: { findMany: mocks.findMany, create: mocks.create } } }));
vi.mock("@/lib/settings", () => ({ getSiteSettings: mocks.getSiteSettings }));
vi.mock("@/lib/push", () => ({ notifyOnNewOrder: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({
  rateLimit: mocks.rateLimit,
  getClientIp: () => "203.0.113.10",
}));
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  getSession: mocks.getSession,
}));

const { GET, POST } = await import("@/app/api/orders/route");

const FILA = {
  id: "o1",
  name: "Ana",
  phone: "809-519-5688",
  eventType: "boda",
  eventDate: "2026-12-01",
  status: "CONFIRMED",
  assignedTo: "Rosa",
  internalNote: "entregar 3pm",
  selectedItems: ["Pastel"],
  imageUrls: [],
  cakeDetails: null,
  agreedPrice: 5000,
  depositAmount: 2500,
  paymentStatus: "PARTIAL",
};

const CAMPOS_FINANCIEROS = ["agreedPrice", "depositAmount", "paymentStatus"] as const;

function pedidoValido(extra: Record<string, unknown> = {}) {
  return {
    name: "Ana Perez",
    phone: "809-519-5688",
    eventType: "boda",
    eventDate: "2026-09-14",
    guestCount: "50",
    ...extra,
  };
}

const req = (url: string, init?: RequestInit) => new NextRequest(url, init as never);
const postReq = (body: unknown) =>
  req("http://localhost/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 60_000 });
  mocks.getSiteSettings.mockResolvedValue({ catalogEnabled: true, quotesEnabled: true });
  mocks.findMany.mockResolvedValue([FILA]);
  mocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({ id: "nuevo", ...data }));
  mocks.getSession.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("GET /api/orders — campos financieros por rol", () => {
  it("sin sesión responde 401", async () => {
    const res = await GET(req("http://localhost/api/orders"));
    expect(res.status).toBe(401);
  });

  it("OWNER recibe precio, depósito y estado de pago", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u1", email: "o@k.com", name: "Dueña", role: "OWNER" });
    const res = await GET(req("http://localhost/api/orders"));
    const [pedido] = await res.json();
    for (const campo of CAMPOS_FINANCIEROS) expect(pedido).toHaveProperty(campo);
    expect(pedido.agreedPrice).toBe(5000);
  });

  it("BAKER también los recibe", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u2", email: "b@k.com", name: "Rosa", role: "BAKER" });
    const res = await GET(req("http://localhost/api/orders"));
    const [pedido] = await res.json();
    for (const campo of CAMPOS_FINANCIEROS) expect(pedido).toHaveProperty(campo);
  });

  it("ASSISTANT NO recibe ninguno de esos campos", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u3", email: "a@k.com", name: "Ayudante", role: "ASSISTANT" });
    const res = await GET(req("http://localhost/api/orders"));
    const [pedido] = await res.json();
    for (const campo of CAMPOS_FINANCIEROS) expect(pedido).not.toHaveProperty(campo);
  });

  it("ASSISTANT sí conserva los campos operativos", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u3", email: "a@k.com", name: "Ayudante", role: "ASSISTANT" });
    const res = await GET(req("http://localhost/api/orders"));
    const [pedido] = await res.json();
    expect(pedido.name).toBe("Ana");
    expect(pedido.status).toBe("CONFIRMED");
    expect(pedido.assignedTo).toBe("Rosa");
    expect(pedido.eventDate).toBe("2026-12-01");
  });

  it("el filtrado también aplica en la respuesta paginada (?limit)", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u3", email: "a@k.com", name: "Ayudante", role: "ASSISTANT" });
    const res = await GET(req("http://localhost/api/orders?limit=500"));
    const body = await res.json();
    expect(Array.isArray(body.orders)).toBe(true);
    for (const campo of CAMPOS_FINANCIEROS) expect(body.orders[0]).not.toHaveProperty(campo);
  });
});

describe("POST /api/orders — mínimo de 3 días de antelación", () => {
  // 2026-09-11 12:00 UTC = 08:00 en RD (UTC-4) -> el mínimo es el día 14.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));
  });

  it("el día 3 exacto se acepta", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-14" })));
    expect(res.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("el día 2 se rechaza", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-13" })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("3 días de antelación");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("el mismo día se rechaza", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-11" })));
    expect(res.status).toBe(400);
  });

  it("una fecha pasada se rechaza", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-01" })));
    expect(res.status).toBe(400);
  });

  it("más allá del día 3 se acepta", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-10-20" })));
    expect(res.status).toBe(201);
  });

  it("cuenta los días en hora RD, no en UTC", async () => {
    // 2026-09-12 02:00 UTC sigue siendo el 11 de septiembre, 22:00, en RD,
    // así que el mínimo continúa siendo el día 14 y no el 15.
    vi.setSystemTime(new Date("2026-09-12T02:00:00Z"));
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-14" })));
    expect(res.status).toBe(201);
  });

  it("una fecha a más de dos años se rechaza", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2030-01-01" })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("inválida");
  });

  it("un pedido EN PERSONA con sesión acepta el mismo día", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u2", email: "b@k.com", name: "Rosa", role: "BAKER" });
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-11", source: "IN_PERSON" })));
    expect(res.status).toBe(201);
  });

  it("un pedido EN PERSONA no puede ser en el pasado", async () => {
    mocks.getSession.mockResolvedValue({ userId: "u2", email: "b@k.com", name: "Rosa", role: "BAKER" });
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-10", source: "IN_PERSON" })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("pasada");
  });

  it("sin sesión, source IN_PERSON se ignora y vuelve a exigir 3 días", async () => {
    const res = await POST(postReq(pedidoValido({ eventDate: "2026-09-12", source: "IN_PERSON" })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("3 días de antelación");
  });
});
