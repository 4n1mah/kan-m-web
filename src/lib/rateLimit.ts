// ────────────────────────────────────────────────────────────────
// Rate limiter híbrido.
//
//   • Si las env vars `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
//     están configuradas → usa Upstash Redis (distribuido, robusto en serverless).
//   • Si no → fallback a un Map en memoria (best-effort, no cubre ataques
//     distribuidos pero protege contra bots simples y abuso casual).
//
// Para activar Upstash en producción:
//   1) Crear cuenta gratis en https://upstash.com
//   2) Crear una "Redis" database (Global Free tier — 10k requests/día).
//   3) Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
//   4) Pegarlos en Vercel → Settings → Environment Variables.
//   5) Redeploy.
// ────────────────────────────────────────────────────────────────

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitOpts = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

// ── Upstash (si está configurado) ──────────────────────────────────
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstashEnabled = Boolean(upstashUrl && upstashToken);

const redis = upstashEnabled
  ? new Redis({ url: upstashUrl!, token: upstashToken! })
  : null;

// Cache de instancias de Ratelimit por configuración (limit + window).
// Cada combinación (limit, windowMs) crea una instancia reutilizable.
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: true,
    prefix: "kanm:rl",
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

async function upstashRateLimit(opts: RateLimitOpts): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(opts.limit, opts.windowMs);
  const result = await limiter.limit(opts.key);
  return {
    ok: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}

// ── In-memory fallback (sliding window por instancia) ──────────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

let lastCleanup = 0;
function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

function memoryRateLimit(opts: RateLimitOpts): RateLimitResult {
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

// ── API pública ────────────────────────────────────────────────────
//
// `rateLimit` es síncrona en su firma original (in-memory), pero ahora
// puede devolver una Promise si Upstash está habilitado. Para mantener
// compatibilidad, exponemos un wrapper que SIEMPRE devuelve Promise.
// Las rutas que la usaban con `await` siguen funcionando; las que no,
// hay que actualizarlas (ya están todas con `await` en este proyecto —
// ver `git grep "rateLimit({"`).
//
// Si necesitas la versión sync sin Upstash, usa `rateLimitSync`.
export function rateLimit(opts: RateLimitOpts): Promise<RateLimitResult> {
  if (upstashEnabled) {
    return upstashRateLimit(opts).catch((err) => {
      // Si Upstash falla por red, no rompemos la request: dejamos pasar
      // (fail-open). Mejor que tirar 500 al cliente. Loggeamos para alerta.
      console.error("[rateLimit] Upstash error, failing open:", err);
      return { ok: true, remaining: opts.limit, resetAt: Date.now() + opts.windowMs };
    });
  }
  return Promise.resolve(memoryRateLimit(opts));
}

export function rateLimitSync(opts: RateLimitOpts): RateLimitResult {
  return memoryRateLimit(opts);
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function isUpstashEnabled() {
  return upstashEnabled;
}
