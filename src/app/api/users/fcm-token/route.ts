import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Registra el token FCM del dispositivo que acaba de loguearse contra la
 * cuenta indicada en el Bearer JWT. La app móvil llama este endpoint:
 *   - tras un login exitoso
 *   - cuando Firebase rota el token (onNewToken)
 *
 * Asociamos UN token por user (último ganador). Si en el futuro hay
 * usuarios con varios dispositivos, migrar a una tabla FcmDevice.
 */

const bodySchema = z.object({
  token: z.string().trim().min(20).max(4096),
});

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Token inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { fcmToken: parsed.data.token },
  });

  return NextResponse.json({ ok: true });
}
