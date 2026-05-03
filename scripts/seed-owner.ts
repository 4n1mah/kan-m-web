/**
 * Crea el primer usuario OWNER. Correr una sola vez después de
 * `npx prisma db push` la primera vez que se despliega el sistema
 * de usuarios.
 *
 * Uso (desde la raíz del proyecto):
 *   ADMIN_EMAIL=tu@correo.com ADMIN_NAME="Sadiel" ADMIN_PASSWORD=miclavefuerte \
 *     npx ts-node --transpile-only scripts/seed-owner.ts
 *
 * O si prefieres con tsx:
 *   npx tsx scripts/seed-owner.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const name = process.env.ADMIN_NAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !name || !password) {
    console.error("❌ Faltan variables: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("❌ La contraseña debe tener al menos 8 caracteres");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  El usuario ${email} ya existe. No se hizo nada.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: "OWNER" },
  });

  console.log(`✅ OWNER creado: ${user.name} <${user.email}>`);
  console.log(`   Ya puedes iniciar sesión en /admin/login`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
