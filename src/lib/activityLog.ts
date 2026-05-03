import { prisma } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

// Registra una acción en la bitácora. No falla la operación principal si
// el log falla — siempre best effort.
export async function logActivity(opts: {
  user: SessionPayload | null;
  action: string;          // ej: "order.status", "product.create", "user.update"
  entityType: "order" | "product" | "user";
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: opts.user?.userId ?? null,
        userName: opts.user?.name ?? "Sistema",
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        metadata: (opts.metadata ?? {}) as object,
      },
    });
  } catch (e) {
    // No interrumpir el flujo principal si el log falla.
    console.error("[activityLog] failed to record:", e);
  }
}

// Calcula el diff entre dos objetos (solo campos cambiados) para guardar
// metadata más legible en lugar del objeto completo.
export function diffChanges<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    const a = before[key];
    const b = after[key as keyof T];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes[key] = { from: a ?? null, to: b ?? null };
    }
  }
  return changes;
}
