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

const EXTERNAL_API_TIMEOUT_MS = 5000;

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

  // Timeout duro de 5s para no bloquear la lambda Vercel ni el confirm del admin.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);

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
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`External API responded with HTTP ${res.status}`);
    }

    console.info(`[ExternalAPI] Order ${order.code} synced successfully.`);
    return "sent";
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "timeout"
        : err instanceof Error ? err.message : "unknown";
    console.error(`[ExternalAPI] Failed to send order ${order.code} (${reason}).`);
    return "failed";
  } finally {
    clearTimeout(timeout);
  }
}
