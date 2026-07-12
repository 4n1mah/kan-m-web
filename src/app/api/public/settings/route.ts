import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

// Flags públicos del sitio (los consume el Navbar/Footer y páginas client).
// Siempre fresco: los switches del admin deben reflejarse al instante.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings(); // fail-soft: defaults si la DB falla
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store" },
  });
}
