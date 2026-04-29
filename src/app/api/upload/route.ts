import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa JPG, PNG, WEBP o GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `El archivo no puede superar los ${MAX_SIZE_MB}MB.` },
      { status: 400 }
    );
  }

  try {
    // Send file directly as multipart/form-data — avoids the slash error
    // that occurs when encoding large data URIs as URLSearchParams
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", "kanm_products");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Cloudinary error:", err);
      return NextResponse.json(
        { error: `Error Cloudinary: ${err?.error?.message ?? "desconocido"}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ url: data.secure_url }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Error interno al subir la imagen" }, { status: 500 });
  }
}
