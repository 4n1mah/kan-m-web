-- Completa el esquema: la migración inicial solo creaba `products`.
-- Con esta, un clon nuevo puede recrear la base entera con
-- `prisma migrate deploy`.
--
-- NO se crean las tablas wa_conversations, wa_processed_messages ni
-- wa_test_diag: son del bot de WhatsApp, que vive en otro repositorio y
-- administra esas tablas en la misma base compartida. Están declaradas en
-- schema.prisma solo para que `prisma db push` no intente borrarlas.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'BAKER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ProductAvailabilityStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'HIDDEN');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('ONLINE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'NEEDS_INFO', 'COMPLETED', 'DELIVERED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CartOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DENIED', 'SENT');

-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('DINE_IN', 'PICKUP');

-- CreateEnum
CREATE TYPE "ExternalSyncStatus" AS ENUM ('NOT_SENT', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BAKER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "fcm_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- AlterTable: `products` ya existe desde la migración inicial.
ALTER TABLE "products" ADD COLUMN "availability_status" "ProductAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "event_type" TEXT NOT NULL,
    "event_date" TEXT NOT NULL,
    "guest_count" TEXT NOT NULL,
    "selected_items" JSONB NOT NULL,
    "cake_details" JSONB,
    "notes" TEXT,
    "internal_note" TEXT,
    "image_urls" JSONB NOT NULL,
    "delivery_time" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_to" TEXT,
    "agreed_price" DOUBLE PRECISION,
    "deposit_amount" DOUBLE PRECISION,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "delivery_method" TEXT,
    "source" "OrderSource" NOT NULL DEFAULT 'ONLINE',
    "taken_by" TEXT,
    "status_log" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "fulfillment_method" "FulfillmentMethod" NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "receipt_image_url" TEXT NOT NULL,
    "status" "CartOrderStatus" NOT NULL DEFAULT 'PENDING',
    "external_sync_status" "ExternalSyncStatus" NOT NULL DEFAULT 'NOT_SENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "catalog_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quotes_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "activity_log_entity_type_entity_id_idx" ON "activity_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_log_user_id_idx" ON "activity_log"("user_id");

-- CreateIndex
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");

-- CreateIndex
CREATE INDEX "products_availability_status_idx" ON "products"("availability_status");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cart_orders_code_key" ON "cart_orders"("code");

-- CreateIndex
CREATE INDEX "cart_orders_status_idx" ON "cart_orders"("status");

-- CreateIndex
CREATE INDEX "cart_orders_created_at_idx" ON "cart_orders"("created_at");

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
