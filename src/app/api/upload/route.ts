import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json(
      { error: "Solicitud inválida. Intenta subir la imagen nuevamente." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No se recibió ningún archivo." },
      { status: 400 }
    );
  }

  console.log("Upload attempt:", {
    name: file.name,
    type: file.type,
    sizeMB: Number((file.size / 1024 / 1024).toFixed(2)),
  });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Tipo de archivo no permitido: ${file.type || "desconocido"}. Usa JPG, PNG, WEBP, GIF, HEIC o HEIF.`,
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo permitido: ${MAX_SIZE_MB}MB.`,
      },
      { status: 400 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary env vars missing:", {
      cloudName: !!cloudName,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
    });

    return NextResponse.json(
      { error: "Configuración de servidor incompleta." },
      { status: 500 }
    );
  }

  try {
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
      {
        method: "POST",
        body: cloudForm,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary upload failed:", {
        status: res.status,
        fileName: file.name,
        fileType: file.type,
        fileSizeMB: Number((file.size / 1024 / 1024).toFixed(2)),
        cloudinaryError: data,
      });

      return NextResponse.json(
        {
          error: data?.error?.message
            ? `Error de Cloudinary: ${data.error.message}`
            : "Error al subir la imagen a Cloudinary.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        url: data.secure_url,
        publicId: data.public_id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload exception:", err);

    return NextResponse.json(
      { error: "Error interno del servidor al subir la imagen." },
      { status: 500 }
    );
  }
}