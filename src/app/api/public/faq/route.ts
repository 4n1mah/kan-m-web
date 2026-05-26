import { NextRequest, NextResponse } from "next/server";
import { FAQS } from "@/lib/bizInfo";

// FAQs canónicas para el bot externo de WhatsApp y la web. Solo lectura,
// público (el matcher de middleware no cubre /api/public/*).
export const runtime = "nodejs";
export const revalidate = 300;

// Combining diacritical marks (U+0300..U+036F). NFD + esta clase = quitar tildes.
const DIACRITICS_RE = /[̀-ͯ]/g;

// Normaliza string a lowercase y sin tildes para matchear texto libre.
// Equivalente al normalizado de los `tags` en bizInfo.ts.
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

export async function GET(req: NextRequest) {
  const qRaw = req.nextUrl.searchParams.get("q");
  const headers = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  };

  if (!qRaw || !qRaw.trim()) {
    return NextResponse.json({ faqs: FAQS }, { headers });
  }

  const needle = normalize(qRaw.trim());
  if (!needle) {
    return NextResponse.json({ faqs: FAQS }, { headers });
  }

  // Tokenizamos la query: cada palabra (>=2 chars) debe matchear en algún
  // campo (q, a o tags) para que la FAQ pase. Esto evita el ruido de queries
  // con stopwords ("¿dónde están ubicados?") matcheando todo el listado.
  const tokens = needle.split(/\s+/).filter((t) => t.length >= 2);
  const effectiveTokens = tokens.length > 0 ? tokens : [needle];

  const matches = FAQS.filter((f) => {
    const haystack = normalize(`${f.q} ${f.a} ${f.tags.join(" ")}`);
    return effectiveTokens.every((t) => haystack.includes(t));
  });

  return NextResponse.json({ faqs: matches }, { headers });
}
