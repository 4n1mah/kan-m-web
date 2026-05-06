type ExternalOrderPayload = {
  code: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMethod: string;
  items: unknown;
  total: number;
  receiptImageUrl: string;
  status: string;
  createdAt: Date;
};

export async function sendOrderToExternalApi(
  order: ExternalOrderPayload
): Promise<"sent" | "failed" | "skipped"> {
  const url = process.env.EXTERNAL_ORDERS_API_URL;
  if (!url) {
    console.warn(
      `[ExternalAPI] EXTERNAL_ORDERS_API_URL not configured — skipping sync for order ${order.code}`
    );
    return "skipped";
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: order.code,
        cliente: order.customerName,
        telefono: order.customerPhone,
        metodo: order.fulfillmentMethod,
        items: order.items,
        total: order.total,
        comprobante: order.receiptImageUrl,
        estado: order.status,
        fecha: order.createdAt,
      }),
    });

    if (!res.ok) {
      throw new Error(`External API responded with HTTP ${res.status}`);
    }

    console.info(`[ExternalAPI] Order ${order.code} synced successfully.`);
    return "sent";
  } catch (err) {
    console.error(`[ExternalAPI] Failed to send order ${order.code}:`, err);
    return "failed";
  }
}
