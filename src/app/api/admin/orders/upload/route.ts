// Endpoint autenticado para subir fotos de referencia a órdenes/cotizaciones desde el admin.
// Solo accesible con sesión activa — el middleware ya protege /api/admin/*

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif", "image/avif",
]);

function isAllowedByExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"].includes(ext);
}

async function detectMime(file: File): Promise<string> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57 && buf[9] === 0x45) return "image/webp";
  if (buf[4] === 0x66 && buf[5] === 0x74) return "image/heic";
  return file.type || "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "ASSISTANT") {
    return NextResponse.json({ error: "Sin permisos para subir fotos" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo: 10MB.` },
      { status: 400 }
    );
  }

  const detectedType = await detectMime(file);
  const allowed =
    ALLOWED_TYPES.has(detectedType) || ALLOWED_TYPES.has(file.type) || isAllowedByExtension(file.name);

  if (!allowed) {
    return NextResponse.json(
      { error: "Solo se aceptan imágenes (JPG, PNG, WEBP, HEIC)." },
      { status: 400 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Configuración del servidor incompleta." }, { status: 500 });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = "kanm/orders";
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha256").update(toSign).digest("hex");

    const uploadFile =
      !file.type || !ALLOWED_TYPES.has(file.type)
        ? new File([file], file.name || "photo.jpg", { type: detectedType })
        : file;

    const cloudForm = new FormData();
    cloudForm.append("file", uploadFile);
    cloudForm.append("api_key", apiKey);
    cloudForm.append("timestamp", timestamp);
    cloudForm.append("signature", signature);
    cloudForm.append("folder", folder);
    cloudForm.append("quality", "auto");
    cloudForm.append("fetch_format", "auto");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("[admin-orders-upload] Cloudinary error:", { status: res.status, error: data });
      return NextResponse.json(
        { error: "Error al subir la imagen. Intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.secure_url }, { status: 201 });
  } catch (err) {
    console.error("[admin-orders-upload]", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
