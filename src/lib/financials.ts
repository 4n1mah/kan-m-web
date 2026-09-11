// ─────────────────────────────────────────────────────────────
//  Filtrado de campos financieros por rol.
//
//  Los roles sin `canViewFinancials` (hoy: ASSISTANT) no deben recibir
//  información de ventas ni facturación. El recorte se hace aquí, en el
//  servidor, antes de serializar la respuesta: ocultar los campos solo en
//  la interfaz no sirve, porque cualquier usuario con sesión puede llamar
//  a la API directamente.
//
//  Qué se recorta:
//    • Pedidos (Order):     agreedPrice, depositAmount, paymentStatus
//    • Órdenes (CartOrder): subtotal, total y el price de cada item
//
//  Lo que NO se recorta, por decisión de negocio:
//    • receiptImageUrl — el comprobante sigue siendo visible para todos.
//    • cakeDetails[*].estimatedPrice — sale del menú público de pasteles.
// ─────────────────────────────────────────────────────────────

const ORDER_FINANCIAL_FIELDS = ["agreedPrice", "depositAmount", "paymentStatus"] as const;
const CART_ORDER_FINANCIAL_FIELDS = ["subtotal", "total"] as const;

type OrderFinancialField = (typeof ORDER_FINANCIAL_FIELDS)[number];
type CartOrderFinancialField = (typeof CART_ORDER_FINANCIAL_FIELDS)[number];

/** Quita de un pedido los campos de precio, depósito y estado de pago. */
export function stripOrderFinancials<T extends object>(
  order: T
): Omit<T, OrderFinancialField> {
  const out: Record<string, unknown> = { ...(order as unknown as Record<string, unknown>) };
  for (const field of ORDER_FINANCIAL_FIELDS) delete out[field];
  return out as Omit<T, OrderFinancialField>;
}

/**
 * Quita de una orden del catálogo los totales y los precios que viajan
 * dentro del snapshot de `items` (que es Json en Prisma, así que se
 * normaliza a array antes de recorrerlo).
 */
export function stripCartOrderFinancials<T extends object>(
  order: T
): Omit<T, CartOrderFinancialField> {
  const out: Record<string, unknown> = { ...(order as unknown as Record<string, unknown>) };
  for (const field of CART_ORDER_FINANCIAL_FIELDS) delete out[field];

  // `items` es Json en Prisma: puede venir nulo o sin forma de array.
  const items = Array.isArray(out.items) ? out.items : [];
  out.items = items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    delete copy.price;
    return copy;
  });

  return out as Omit<T, CartOrderFinancialField>;
}
