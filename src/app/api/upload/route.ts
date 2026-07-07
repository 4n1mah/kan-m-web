import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { canEditCatalog, getSession } from "@/lib/auth";

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// MIME types explicitly allowed
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
]);

// Extension fallback when MIME type is empty (Google Photos on Android sends this)
function isAllowedByExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"].includes(ext);
}

// Detect real type from magic bytes (first 12 bytes of the file)
async function detectMimeFromBuffer(file: File): Promise<string> {
  const slice = file.slice(0, 12);
  const buf = new Uint8Array(await slice.arrayBuffer());

  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  // WebP: "RIFF" at 0-3, "WEBP" at 8-11
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57 && buf[9] === 0x45) return "image/webp";
  // HEIC/HEIF: ftyp box at offset 4
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return "image/heic";
  return file.type || "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditCatalog(session.role)) {
    return NextResponse.json({ error: "Sin permisos para subir imagenes al catalogo" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  // Detect real MIME type — Google Photos on Android often sends type: ""
  const detectedType = await detectMimeFromBuffer(file);
  const allowed =
    ALLOWED_TYPES.has(detectedType) ||
    ALLOWED_TYPES.has(file.type) ||
    isAllowedByExtension(file.name);

  if (!allowed) {
    return NextResponse.json(
      { error: `Tipo de archivo no soportado (${file.type || "desconocido"}). Usa JPG, PNG, WEBP o HEIC.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo: ${MAX_SIZE_MB}MB.` },
      { status: 400 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary env vars missing");
    return NextResponse.json({ error: "Configuración de servidor incompleta." }, { status: 500 });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = "kanm";
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha256").update(toSign).digest("hex");

    // If type is empty, rebuild the File with the detected type so Cloudinary gets it correctly
    const uploadFile =
      file.type === "" || !ALLOWED_TYPES.has(file.type)
        ? new File([file], file.name || `upload.${detectedType.split("/")[1]}`, { type: detectedType })
        : file;


    const cloudForm = new FormData();
    cloudForm.append("file", uploadFile);
    cloudForm.append("api_key", apiKey);
    cloudForm.append("timestamp", timestamp);
    cloudForm.append("signature", signature);
    cloudForm.append("folder", folder);
    
    // FIX HDR Pixel
    cloudForm.append("quality", "auto");
    cloudForm.append("fetch_format", "auto");
    // opcional si algún HDR sigue fallando:
    // cloudForm.append("flags", "strip_profile");
    
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary error:", { status: res.status, error: data });
      return NextResponse.json(
        { error: "Error al subir la imagen. Intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.secure_url }, { status: 201 });
  } catch (err) {
    console.error("Upload exception:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
