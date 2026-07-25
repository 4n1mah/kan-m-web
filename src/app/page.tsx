import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import HomeClient from "./HomeClient";

// ISR: regenera el HTML cada 60s. El home no necesita estado live;
// reduce queries a Neon y mejora LCP / TTFB de SEO. El render (incluido el
// idioma) vive en HomeClient; acá solo cargamos datos y los pasamos por props.
export const revalidate = 60;

export default async function HomePage() {
  // Switches del sitio (fail-soft a habilitado). El PATCH del admin llama
  // revalidatePath("/") asi que el cambio se refleja al instante.
  const settings = await getSiteSettings();

  // Si la DB no responde durante el build/revalidate, servimos el home sin
  // destacados en vez de tumbar el deploy; ISR reintenta en 60s.
  const featured = !settings.catalogEnabled
    ? []
    : await prisma.product
        .findMany({
          where: { availabilityStatus: "AVAILABLE" },
          take: 6,
          orderBy: { createdAt: "desc" },
        })
        .catch((e) => {
          console.error("[home] featured products query failed:", e);
          return [];
        });

  return <HomeClient settings={settings} featured={featured} />;
}
