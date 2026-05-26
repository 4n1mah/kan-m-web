/**
 * Envío de notificaciones push vía Firebase Cloud Messaging.
 *
 * Configuración:
 *   - Definir `FIREBASE_SERVICE_ACCOUNT_JSON` en env (Vercel + .env.local)
 *     con el contenido completo del service-account JSON descargado de
 *     Firebase Console → Project Settings → Service accounts.
 *   - Si la variable no está presente, todas las funciones son no-op y
 *     loguean un warning una sola vez (el endpoint del cliente sigue ok).
 *
 * El payload se envía como `data` (no `notification`) para que el cliente
 * Android tenga control total del armado de la NotificationCompat — el
 * servicio FCM client-side traduce `data.type` al canal y copy correctos.
 */
import admin from "firebase-admin";
import { prisma } from "@/lib/db";

let initState: "uninitialized" | "ready" | "disabled" = "uninitialized";
let warned = false;

function ensureApp(): boolean {
  if (initState === "ready") return true;
  if (initState === "disabled") return false;

  if (admin.apps.length > 0) {
    initState = "ready";
    return true;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    if (!warned) {
      console.warn("[push] FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM disabled");
      warned = true;
    }
    initState = "disabled";
    return false;
  }

  try {
    const credentials = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(credentials) });
    initState = "ready";
    return true;
  } catch (e) {
    console.error("[push] firebase-admin init failed:", e);
    initState = "disabled";
    return false;
  }
}

type PushData = Record<string, string | number | undefined | null>;

async function sendToTokens(tokens: string[], data: PushData): Promise<void> {
  if (!ensureApp() || tokens.length === 0) return;
  // FCM acepta sólo strings en data. Convertimos y dropeamos nulos/undefined.
  const stringified: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    stringified[k] = String(v);
  }

  try {
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      data: stringified,
    });
    if (result.failureCount > 0) {
      // Tokens inválidos/desregistrados podrían limpiarse aquí en una
      // siguiente iteración. Por ahora sólo logueamos para no borrar tokens
      // en uso por un error transitorio.
      console.warn(
        `[push] ${result.failureCount}/${tokens.length} mensajes fallaron`,
      );
    }
  } catch (e) {
    console.error("[push] sendEachForMulticast error:", e);
  }
}

/** Devuelve los tokens FCM activos de los usuarios con un rol dado. */
async function tokensForRoles(roles: ("OWNER" | "BAKER" | "ASSISTANT")[]): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: {
      active: true,
      fcmToken: { not: null },
      role: { in: roles },
    },
    select: { fcmToken: true },
  });
  return rows.map((r) => r.fcmToken!).filter(Boolean);
}

// ── Helpers de alto nivel — uno por evento de negocio ────────────────────

export async function notifyOnNewOrder(order: {
  id: string;
  name: string;
  eventDate: string;
}): Promise<void> {
  // Nuevo pedido entra sin asignación; OWNERs y BAKERs lo ven para poder
  // tomarlo. ASSISTANT no recibe push (lo dijo el spec).
  const tokens = await tokensForRoles(["OWNER", "BAKER"]);
  await sendToTokens(tokens, {
    type: "new_order",
    entityId: order.id,
    name: order.name,
    eventDate: order.eventDate,
  });
}

export async function notifyOnNewCartOrder(order: {
  id: string;
  code: string;
  customerName: string;
  total: number;
}): Promise<void> {
  const tokens = await tokensForRoles(["OWNER", "BAKER"]);
  await sendToTokens(tokens, {
    type: "new_cart_order",
    entityId: order.id,
    code: order.code,
    customerName: order.customerName,
    total: order.total,
  });
}

export async function notifyOnEscalation(escalation: {
  id: string;
  phone: string;
  clientName: string;
  motivo: string;
}): Promise<void> {
  const tokens = await tokensForRoles(["OWNER", "BAKER"]);
  await sendToTokens(tokens, {
    type: "whatsapp_escalation",
    entityId: escalation.id,
    phone: escalation.phone,
    clientName: escalation.clientName,
    motivo: escalation.motivo,
  });
}
