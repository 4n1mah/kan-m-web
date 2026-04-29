import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Tipo no permitido. Usa JPG, PNG, WEBP o GIF." }, { status: 400 });

  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return NextResponse.json({ error: `Máximo ${MAX_SIZE_MB}MB por imagen.` }, { status: 400 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary env vars missing:", { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
    return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 });
  }

  try {
    // Use SIGNED upload (no preset required — works without Cloudinary dashboard config)
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = "kanm";
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha256").update(toSign).digest("hex");

    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("api_key", apiKey);
    cloudForm.append("timestamp", timestamp);
    cloudForm.append("signature", signature);
    cloudForm.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary upload failed:", JSON.stringify(data));
      return NextResponse.json(
        { error: `Error al subir: ${data?.error?.message ?? "error desconocido"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.secure_url }, { status: 201 });
  } catch (err) {
    console.error("Upload exception:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
