import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession, canManageSettings } from "@/lib/auth";
import { getSiteSettingsRow, updateSiteSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activityLog";

export const runtime = "nodejs";

// El middleware ya restringe /api/admin/settings a OWNER; este check
// en-ruta es defensa en profundidad.
async function requireOwner(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (!canManageSettings(session.role)) {
    return { error: NextResponse.json({ error: "Solo el dueño puede cambiar la configuración" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function GET(req: NextRequest) {
  const { error } = await requireOwner(req);
  if (error) return error;
  const row = await getSiteSettingsRow();
  return NextResponse.json(row, { headers: { "Cache-Control": "private, no-store" } });
}

const patchSchema = z
  .object({
    catalogEnabled: z.boolean().optional(),
    quotesEnabled: z.boolean().optional(),
  })
  .refine((d) => d.catalogEnabled !== undefined || d.quotesEnabled !== undefined, {
    message: "Nada que actualizar",
  });

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireOwner(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateSiteSettings(parsed.data, session!.name);

    await logActivity({
      user: session,
      action: "settings.update",
      entityType: "settings",
      entityId: "site",
      metadata: parsed.data,
    });

    // Refresca las páginas ISR de inmediato para que el switch se
    // refleje sin esperar el revalidate normal.
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/cotizar");

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[settings] update failed:", e);
    return NextResponse.json({ error: "No se pudo guardar la configuración" }, { status: 500 });
  }
}
