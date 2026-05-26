import { NextResponse } from "next/server";
import {
  BUSINESS,
  CATALOG_CATEGORIES,
  FAQS,
  LINKS,
  RULES,
  SCHEDULE_TEXT,
  isOpenNow,
} from "@/lib/bizInfo";

// Endpoint público de solo lectura. Lo consume el bot externo de WhatsApp
// (proyecto Python/FastAPI) y cualquier cliente que necesite la info canónica
// del negocio. Sin auth — el matcher de middleware NO cubre /api/public/*.
export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const status = isOpenNow();

  const body = {
    business: {
      name: BUSINESS.name,
      greeting: BUSINESS.greeting,
    },
    address: BUSINESS.address,
    mapsUrl: BUSINESS.mapsUrl,
    phone: {
      display: BUSINESS.phoneDisplay,
      tel: BUSINESS.phoneTel,
    },
    email: BUSINESS.email,
    socials: {
      instagram: BUSINESS.instagram,
      tiktok: BUSINESS.tiktok,
    },
    schedule: SCHEDULE_TEXT,
    isOpenNow: status.open,
    links: LINKS,
    rules: RULES,
    categories: CATALOG_CATEGORIES,
    // Conteo informativo: el cliente que quiera todas las FAQs llama a /api/public/faq.
    faqCount: FAQS.length,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
