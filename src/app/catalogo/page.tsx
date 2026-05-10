import { prisma } from "@/lib/db";
import CatalogClient from "./CatalogClient";

// ISR: regenera la página cada 5 minutos. Sirve HTML completo a Google
// y al primer paint del usuario sin tocar la DB en cada request.
export const revalidate = 300;

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    where: { availabilityStatus: { in: ["AVAILABLE", "OUT_OF_STOCK"] } },
    orderBy: { createdAt: "desc" },
  });

  return <CatalogClient initialProducts={products} />;
}
