// Public upload endpoint — used by the cotizar form (no auth required)
// The admin upload at /api/upload is protected by middleware
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif", "image/avif",
]);

function isAllowedByExtension(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg","jpeg","png","webp","gif","heic","heif","avif"].includes(ext);
}

async function detectMime(file: File): Promise<string> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (buf[0]===0xff && buf[1]===0xd8) return "image/jpeg";
  if (buf[0]===0x89 && buf[1]===0x50) return "image/png";
  if (buf[0]===0x47 && buf[1]===0x49) return "image/gif";
  if (buf[0]===0x52 && buf[1]===0x49 && buf[8]===0x57 && buf[9]===0x45) return "image/webp";
  if (buf[4]===0x66 && buf[5]===0x74) return "image/heic";
  return file.type || "image/jpeg";
}

export async function POST(req: NextRequest) {
  // Rate limit: 30 imágenes cada 10 min por IP
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `upload:${ip}`, limit: 30, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Has subido muchas imágenes. Por favor espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });

  const detectedType = await detectMime(file);
  const allowed = ALLOWED_TYPES.has(detectedType) || ALLOWED_TYPES.has(file.type) || isAllowedByExtension(file.name);
  if (!allowed) return NextResponse.json({ error: `Tipo no soportado. Usa JPG, PNG o WEBP.` }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Máximo 10MB por imagen." }, { status: 400 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: "Configuración incompleta." }, { status: 500 });

  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = "kanm";
  const signature = crypto.createHash("sha256").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");

  const uploadFile = file.type === "" || !ALLOWED_TYPES.has(file.type)
    ? new File([file], file.name || `upload.jpg`, { type: detectedType })
    : file;

  const fd = new FormData();
  fd.append("file", uploadFile);
  fd.append("api_key", apiKey);
  fd.append("timestamp", timestamp);
  fd.append("signature", signature);
  fd.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();

  if (!res.ok) return NextResponse.json({ error: data?.error?.message ?? "Error al subir." }, { status: 500 });
  return NextResponse.json({ url: data.secure_url }, { status: 201 });
}
