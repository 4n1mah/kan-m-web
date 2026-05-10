import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://kan-m-reposteria.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/catalogo`, lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/cotizar`,  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/catering`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/nosotros`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`,      lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Categorías del catálogo como entradas separadas
  const categories = ["cakes", "desserts", "events", "picaderas", "brunch", "drinks"];
  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/catalogo?cat=${cat}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Productos individuales (visibles públicamente)
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { availabilityStatus: { in: ["AVAILABLE", "OUT_OF_STOCK"] } },
      select: { id: true, createdAt: true },
    });
    productEntries = products.map((p) => ({
      url: `${SITE_URL}/catalogo?producto=${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // Si la DB no responde durante el build, seguimos con las rutas estáticas.
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
