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

const empty = { name: "", description: "", category: "cakes", imageUrl: "", price: "" };

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  async function load() {
    const r = await fetch("/api/products");
    setProducts(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    setUploading(true);
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) {
      alert("Por favor selecciona una imagen para el producto.");
      return;
    }
    setLoading(true);
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      imageUrl: form.imageUrl,
      price: form.price === "" ? null : Number(form.price),
    };
    const url = editing ? `/api/products/${editing}` : "/api/products";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) { alert("Error: " + (await res.text())); return; }
    setForm(empty);
    setEditing(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-3xl">Panel de productos</h1>
        <button onClick={logout} className="text-sm text-rose hover:underline">Cerrar sesión</button>
      </div>

      <form onSubmit={save} className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-6 grid md:grid-cols-2 gap-4 mb-12">
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm md:col-span-2" />
        <textarea required placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm md:col-span-2" rows={3} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm">
          <option value="cakes">Pasteles</option>
          <option value="desserts">Postres</option>
          <option value="events">Mesa de dulces</option>
          <option value="picaderas">Picaderas para eventos</option>
          <option value="brunch">Brunch</option>
        </select>
        <input type="number" step="0.01" placeholder="Precio (opcional)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm" />

        {/* ── Image upload ── */}
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
                title="Quitar imagen"
              >
                ✕
              </button>
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
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="sr-only"
          />

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button disabled={loading || uploading} className="px-6 py-2.5 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 disabled:opacity-50">
            {editing ? "Actualizar" : "Crear"} producto
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(empty); setImagePreview(""); }}
              className="px-6 py-2.5 rounded-full bg-card border border-[var(--border)] hover:bg-secondary">Cancelar</button>
          )}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover" />
            <div className="p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</div>
              <h3 className="font-display text-lg mt-1">{p.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => edit(p)} className="px-4 py-2 text-sm rounded-full bg-card border border-[var(--border)] hover:bg-secondary">Editar</button>
                <button onClick={() => del(p.id)} className="px-4 py-2 text-sm rounded-full text-white bg-destructive hover:opacity-90">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
