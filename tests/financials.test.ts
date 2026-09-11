import { describe, expect, it } from "vitest";
import { stripCartOrderFinancials, stripOrderFinancials } from "@/lib/financials";

const pedido = () => ({
  id: "o1",
  name: "Ana",
  status: "CONFIRMED",
  assignedTo: "Rosa",
  internalNote: "entregar 3pm",
  agreedPrice: 5000,
  depositAmount: 2500,
  paymentStatus: "PARTIAL",
  cakeDetails: { Pastel: { estimatedPrice: 1800, flavor: "vainilla" } },
});

const orden = () => ({
  id: "c1",
  code: "PED-0001",
  customerName: "Luis",
  status: "PENDING",
  items: [
    { id: "p1", name: "Latica", price: 400, quantity: 2, category: "laticas" },
    { id: "p2", name: "Brownie", price: 150, quantity: 1, category: "desserts" },
  ],
  subtotal: 950,
  total: 950,
  receiptImageUrl: "https://res.cloudinary.com/demo/image/upload/x.jpg",
});

describe("stripOrderFinancials", () => {
  it("quita precio, depósito y estado de pago", () => {
    const out = stripOrderFinancials(pedido()) as Record<string, unknown>;
    expect("agreedPrice" in out).toBe(false);
    expect("depositAmount" in out).toBe(false);
    expect("paymentStatus" in out).toBe(false);
  });

  it("conserva los campos operativos del pedido", () => {
    const out = stripOrderFinancials(pedido()) as Record<string, unknown>;
    expect(out.name).toBe("Ana");
    expect(out.status).toBe("CONFIRMED");
    expect(out.assignedTo).toBe("Rosa");
    expect(out.internalNote).toBe("entregar 3pm");
  });

  it("conserva cakeDetails con su estimatedPrice (decisión de negocio)", () => {
    const out = stripOrderFinancials(pedido()) as Record<string, unknown>;
    expect(out.cakeDetails).toEqual({ Pastel: { estimatedPrice: 1800, flavor: "vainilla" } });
  });

  it("no muta el objeto original", () => {
    const original = pedido();
    stripOrderFinancials(original);
    expect(original.agreedPrice).toBe(5000);
  });
});

describe("stripCartOrderFinancials", () => {
  it("quita subtotal y total", () => {
    const out = stripCartOrderFinancials(orden()) as Record<string, unknown>;
    expect("subtotal" in out).toBe(false);
    expect("total" in out).toBe(false);
  });

  it("quita el precio de cada item del snapshot", () => {
    const out = stripCartOrderFinancials(orden()) as Record<string, unknown>;
    const items = out.items as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    for (const item of items) expect("price" in item).toBe(false);
  });

  it("conserva nombre, cantidad y categoría de cada item", () => {
    const out = stripCartOrderFinancials(orden()) as Record<string, unknown>;
    const items = out.items as Record<string, unknown>[];
    expect(items[0]).toEqual({ id: "p1", name: "Latica", quantity: 2, category: "laticas" });
  });

  it("conserva el comprobante de pago (decisión de negocio)", () => {
    const out = stripCartOrderFinancials(orden()) as Record<string, unknown>;
    expect(out.receiptImageUrl).toBe("https://res.cloudinary.com/demo/image/upload/x.jpg");
  });

  it("no muta el original ni sus items", () => {
    const original = orden();
    stripCartOrderFinancials(original);
    expect(original.total).toBe(950);
    expect(original.items[0].price).toBe(400);
  });

  it("tolera items ausentes o con forma inesperada", () => {
    // Los literales se asignan antes de llamar para evitar la comprobación de
    // propiedades excedentes de TypeScript contra la restricción genérica:
    // los llamadores reales pasan objetos de Prisma, no literales frescos.
    const ordenSinItems = { id: "c2", total: 10 };
    const sinItems = stripCartOrderFinancials(ordenSinItems) as Record<string, unknown>;
    expect(sinItems.items).toEqual([]);

    const ordenRara = { items: [null, "texto", 7] };
    const raros = stripCartOrderFinancials(ordenRara) as Record<string, unknown>;
    expect(raros.items).toEqual([null, "texto", 7]);
  });
});
