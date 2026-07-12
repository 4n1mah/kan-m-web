-- Tabla de configuración del sitio público (switches de features).
-- NOTA: el app se auto-bootstrapea (src/lib/settings.ts corre este mismo
-- CREATE TABLE IF NOT EXISTS en runtime) — correr este SQL a mano en la
-- consola de Neon es OPCIONAL, solo útil para baselinear migraciones.

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "catalog_enabled" BOOLEAN NOT NULL DEFAULT true,
  "quotes_enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" TEXT,
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "site_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
