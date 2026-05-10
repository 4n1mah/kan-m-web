import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    // Solo borramos el cookie si el cliente vino por cookie y la sesión es inválida.
    // Para clientes con Bearer no hay cookie que borrar (lo hacen ellos del lado app).
    const hadCookie = !!req.cookies.get("kanm_session");
    if (hadCookie) destroySession();
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
