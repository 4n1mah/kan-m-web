// ────────────────────────────────────────────────────────────────
// Rate limiter en memoria (sliding window, por IP).
// Limitación conocida: en Vercel cada instancia serverless tiene su
// propia memoria, así que esto es un "best effort" y no cubre ataques
// distribuidos. Pero protege bien contra bots simples y abuso casual.
// Para producción en escala real, migrar a Upstash Ratelimit.
// ────────────────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Limpieza ocasional para no crecer en memoria indefinidamente
let lastCleanup = 0;
function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

export function rateLimit(opts: {
  key: string;        // p.ej. "login:1.2.3.4" o "upload:1.2.3.4"
  limit: number;      // máximo de requests por ventana
  windowMs: number;   // tamaño de la ventana en ms
}): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  cleanup(now);
  const existing = buckets.get(opts.key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + opts.windowMs;
    buckets.set(opts.key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }
  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count++;
  return { ok: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(req: Request): string {
  // Vercel pone la IP en x-forwarded-for. En dev, es localhost.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
