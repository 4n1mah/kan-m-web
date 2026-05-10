import { NextResponse } from "next/server";

// Endpoint público que la app móvil usa para:
//   1. Verificar que el backend está vivo (antes de intentar login).
//   2. Sincronizar tiempo de servidor (para evitar problemas de clock skew
//      al firmar/verificar cosas dependientes de fecha).
//   3. Comparar versión de API con la versión esperada por la app móvil
//      (para mostrar "Actualiza la app" cuando despleguemos breaking changes).
//
// No requiere auth. Diseñado para ser el primer request que hace la app.

export const dynamic = "force-dynamic";

const API_VERSION = "1.0.0";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "kanm-api",
      version: API_VERSION,
      serverTime: new Date().toISOString(),
      env: process.env.NODE_ENV,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
