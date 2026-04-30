"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number | null;
};

const CATEGORIES = [
  { id: "cakes",     label: "Pasteles" },
  { id: "desserts",  label: "Postres" },
  { id: "events",    label: "Mesa de dulces" },
  { id: "picaderas", label: "Picaderas para eventos" },
  { id: "brunch",    label: "Brunch" },
];

const categoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

const empty = { name: "", description: "", category: "cakes", imageUrl: "", price: "" };

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts]     = useState<Product[]>([]);
  const [form, setForm]             = useState<typeof empty>(empty);
  const [editing, setEditing]       = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch("/api/products");
    setProducts(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // Convierte cualquier imagen (Ultra HDR, HEIC, etc.) a JPEG estándar usando canvas.
  // Los Pixel con Ultra HDR generan JPEGs con gainmap que Cloudinary rechaza.
  // Dibujar en canvas aplana el HDR a SDR y produce un JPEG limpio.
  async function flattenToJpeg(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; // fondo blanco para imágenes con transparencia
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const safeName = file.name.replace(/\.\w+$/, ".jpg") || "foto.jpg";
            resolve(new File([blob], safeName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.92
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploadError("");
    setImagePreview(URL.createObjectURL(raw));
    setUploading(true);

    // Aplanar a JPEG estándar antes de subir (fix para Pixel Ultra HDR)
    const file = await flattenToJpeg(raw);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error al subir la imagen" }));
      setUploadError(err.error ?? "Error al subir la imagen");
      setImagePreview("");
      setForm((f) => ({ ...f, imageUrl: "" }));
      return;
    }
    const { url } = await res.json();
    setForm((f) => ({ ...f, imageUrl: url }));
  }

  function clearImage() {
    setImagePreview("");
    setUploadError("");
    setForm((f) => ({ ...f, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelEdit() {
    setEditing(null);
    setForm(empty);
    setImagePreview("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) { alert("Por favor selecciona una imagen."); return; }
    setLoading(true);
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      imageUrl: form.imageUrl,
      price: form.price === "" ? null : Number(form.price),
    };
    const url    = editing ? `/api/products/${editing}` : "/api/products";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) { alert("Error: " + (await res.text())); return; }
    cancelEdit();
    load();
  }

  function edit(p: Product) {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      imageUrl: p.imageUrl,
      price: p.price?.toString() ?? "",
    });
    setImagePreview(p.imageUrl);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Error al eliminar"); return; }
    load();
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl">Panel de administración</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} producto{products.length !== 1 ? "s" : ""} en el catálogo</p>
        </div>
        <button onClick={logout} className="text-sm text-rose hover:underline">Cerrar sesión</button>
      </div>

      {/* Form */}
      <div ref={formRef}>
        <h2 className="font-display text-xl mb-4">
          {editing ? "✏️ Editando producto" : "➕ Agregar nuevo producto"}
        </h2>
        <form onSubmit={save} className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-6 grid md:grid-cols-2 gap-4 mb-12">

          <input
            required
            placeholder="Nombre del producto"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm md:col-span-2"
          />

          <textarea
            required
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm md:col-span-2"
            rows={3}
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio en RD$ (opcional)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm"
          />

          {/* Image upload */}
          <div className="md:col-span-2 space-y-3">
            <label className="block text-sm font-medium">Imagen del producto</label>

            {imagePreview ? (
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                >✕</button>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-xs">Subiendo…</span>
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-[var(--input)] bg-background cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm text-muted-foreground">Haz clic para subir una imagen</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP o GIF · máx. 5 MB</span>
              </label>
            )}

            <input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif/image/jpg,image/heic,image/heif"
              onChange={handleImageChange}
              className="sr-only"
            />
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              disabled={loading || uploading}
              className="px-6 py-2.5 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 disabled:opacity-50 transition"
            >
              {uploading ? "Subiendo imagen…" : loading ? "Guardando…" : editing ? "Actualizar producto" : "Agregar al catálogo"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2.5 rounded-full bg-card border border-[var(--border)] hover:bg-secondary transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product list */}
      <h2 className="font-display text-xl mb-6">Productos en el catálogo</h2>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No hay productos aún. ¡Agrega el primero!</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover" />
              <div className="p-5">
                <span className="inline-block text-xs uppercase tracking-widest text-white bg-gradient-rose px-2 py-0.5 rounded-full mb-2">
                  {categoryLabel(p.category)}
                </span>
                <h3 className="font-display text-lg">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                {p.price != null && (
                  <p className="text-sm font-semibold text-rose mt-2">RD${p.price.toLocaleString("es-DO")}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => edit(p)}
                    className="flex-1 px-4 py-2 text-sm rounded-full bg-card border border-[var(--border)] hover:bg-secondary transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => del(p.id)}
                    className="flex-1 px-4 py-2 text-sm rounded-full text-white bg-destructive hover:opacity-90 transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
