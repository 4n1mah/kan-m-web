import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
//  Configuración del sitio público (switches de features).
//
//  La tabla se auto-crea en el primer uso por instancia (lambda):
//  CREATE TABLE IF NOT EXISTS es idempotente y barato, y evita
//  depender de migraciones manuales (las credenciales de la DB
//  solo existen en Vercel). El DDL calca exactamente el modelo
//  SiteSettings de prisma/schema.prisma (snake_case + TIMESTAMP(3),
//  misma convención que la migración init).
// ─────────────────────────────────────────────────────────────

export type PublicSiteSettings = {
  catalogEnabled: boolean;
  quotesEnabled: boolean;
};

export const DEFAULT_SETTINGS: PublicSiteSettings = {
  catalogEnabled: true,
  quotesEnabled: true,
};

// Promesa memoizada; se resetea en fallo para reintentar (Neon cold start).
let bootstrapPromise: Promise<unknown> | null = null;
function ensureTable() {
  if (!bootstrapPromise) {
    bootstrapPromise = prisma
      .$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "site_settings" (
          "id" INTEGER NOT NULL DEFAULT 1,
          "catalog_enabled" BOOLEAN NOT NULL DEFAULT true,
          "quotes_enabled" BOOLEAN NOT NULL DEFAULT true,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_by" TEXT,
          CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
        )`
      )
      .catch((e) => {
        bootstrapPromise = null;
        throw e;
      });
  }
  return bootstrapPromise;
}

/**
 * Lee los switches del sitio. FAIL-SOFT: ante cualquier error (DB dormida,
 * build sin DATABASE_URL, carrera del bootstrap) devuelve los defaults
 * (todo habilitado) — las páginas públicas nunca se rompen por esto.
 */
export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    await ensureTable();
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return row
      ? { catalogEnabled: row.catalogEnabled, quotesEnabled: row.quotesEnabled }
      : DEFAULT_SETTINGS;
  } catch (e) {
    console.error("[settings] read failed, using defaults:", e);
    return DEFAULT_SETTINGS;
  }
}

/** Fila completa (con updatedAt/updatedBy) para el panel admin. Fail-soft. */
export async function getSiteSettingsRow() {
  try {
    await ensureTable();
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (row) return row;
  } catch (e) {
    console.error("[settings] row read failed, using defaults:", e);
  }
  return { id: 1, ...DEFAULT_SETTINGS, updatedAt: null as Date | null, updatedBy: null as string | null };
}

/**
 * Actualiza los switches. Los writes SÍ lanzan en caso de error —
 * el API del admin debe reportar el fallo honestamente.
 */
export async function updateSiteSettings(
  patch: Partial<PublicSiteSettings>,
  updatedBy: string
) {
  await ensureTable();
  return prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...DEFAULT_SETTINGS, ...patch, updatedBy },
    update: { ...patch, updatedBy },
  });
}
