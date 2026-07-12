import { prisma } from "@/lib/db";
import CatalogClient from "./CatalogClient";
import ComingSoon from "@/components/ComingSoon";
import { getSiteSettings } from "@/lib/settings";

// ISR: regenera la página cada 5 minutos. Sirve HTML completo a Google
// y al primer paint del usuario sin tocar la DB en cada request.
// El switch del admin llama revalidatePath("/catalogo") para refresh inmediato.
export const revalidate = 300;

export default async function CatalogPage() {
  const settings = await getSiteSettings();
  if (!settings.catalogEnabled) return <ComingSoon variant="catalog" />;

  // Si la DB no responde durante el build/revalidate, servimos el catálogo
  // vacío (con su estado vacío) en vez de tumbar el deploy; ISR reintenta
  // en 5 minutos.
  const products = await prisma.product
    .findMany({
      where: { availabilityStatus: { in: ["AVAILABLE", "OUT_OF_STOCK"] } },
      orderBy: { createdAt: "desc" },
    })
    .catch((e) => {
      console.error("[catalogo] products query failed:", e);
      return [];
    });

  return <CatalogClient initialProducts={products} />;
}
