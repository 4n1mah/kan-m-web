"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, ClipboardList, LogOut, RefreshCw, Plus, X,
  Pencil, Trash2, ChevronLeft, ChevronRight, Check,
  MessageCircle, User, ShoppingBag, FileText, Image as ImageIcon, Clock
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────
type Product = { id: string; name: string; description: string; category: string; imageUrl: string; price: number | null; };
type CakeDetail = { filling: string; masa: string; colors: string; message: string; size: string; };
type Order = {
  id: string; name: string; phone: string; email?: string;
  eventType: string; eventDate: string; deliveryTime?: string; guestCount: string;
  selectedItems: string[]; cakeDetails?: Record<string, CakeDetail>;
  notes?: string; imageUrls: string[];
  status: string; assignedTo?: string | null; createdAt: string;
};

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDING:    { label: "En revisión",     color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  CONFIRMED:  { label: "Confirmado",      color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  NEEDS_INFO: { label: "Más información", color: "#1e3a8a", bg: "#dbeafe", dot: "#3b82f6" },
  REJECTED:   { label: "No disponible",   color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  CANCELLED:  { label: "Cancelado",       color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" },
};
const STATUSES = Object.keys(STATUS);
const BAKERS = ["Karolyn Sierra", "Astrid Sierra"];

const CATEGORIES = [
  { id: "cakes", label: "Pasteles" }, { id: "desserts", label: "Postres" },
  { id: "events", label: "Mesa de dulces" }, { id: "picaderas", label: "Picaderas" },
  { id: "brunch", label: "Brunch" }, { id: "drinks", label: "Bebidas" },
];
const catLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label ?? id;
const empty = { name: "", description: "", category: "cakes", imageUrl: "", price: "" };
const BTN = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

// ── Order Detail Modal ────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, onDelete }: {
  order: Order; onClose: () => void;
  onUpdate: (id: string, data: Partial<Order>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [status, setStatus]     = useState(order.status);
  const [assigned, setAssigned] = useState(order.assignedTo ?? "");
  const [saving, setSaving]     = useState(false);
  const [imgIdx, setImgIdx]     = useState(0);

  const imgs  = Array.isArray(order.imageUrls) ? order.imageUrls : [];
  const items = Array.isArray(order.selectedItems) ? order.selectedItems : [];
  const cakeDetails = (order.cakeDetails ?? {}) as Record<string, CakeDetail>;
  const st = STATUS[status] ?? STATUS.PENDING;
  const dateReceived = new Date(order.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  async function save() {
    setSaving(true);
    await onUpdate(order.id, { status, assignedTo: assigned || null });
    setSaving(false);
  }

  const waMsg = encodeURIComponent(
    `Hola ${order.name} 👋, te habla ${bakerName} desde Kan M Repostería y Catering.
  
  Estamos revisando tu cotización para *${order.eventType}* el *${order.eventDate}*${order.deliveryTime ? ` a las ${order.deliveryTime}` : ""}.
  
  Quedo atenta para cualquier detalle adicional 💕`
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0] rounded-t-3xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />{st.label}
            </span>
            <span className="text-xs text-gray-400">{dateReceived}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Client */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 font-display" style={{ background: BTN }}>
              {order.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-2xl leading-tight">{order.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1">
                <a href={`tel:${order.phone}`} className="text-sm text-gray-500 hover:text-[#f07097] transition">📱 {order.phone}</a>
                {order.email && <a href={`mailto:${order.email}`} className="text-sm text-gray-500 hover:text-[#f07097] transition">📧 {order.email}</a>}
              </div>
            </div>
          </div>

          {/* Event grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🎉", label: "Tipo de evento", value: order.eventType },
              { icon: "📅", label: "Fecha", value: order.eventDate },
              { icon: "⏰", label: "Hora de entrega", value: order.deliveryTime || "No especificada" },
              { icon: "👥", label: "Personas", value: order.guestCount },
            ].map(d => (
              <div key={d.label} className="bg-[#faf8f5] rounded-2xl p-3.5">
                <p className="text-xs text-gray-400 mb-0.5">{d.label}</p>
                <p className="font-semibold text-sm">{d.icon} {d.value}</p>
              </div>
            ))}
          </div>

          {/* Products + cake details */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><ShoppingBag size={12} /> Productos de interés</p>
              <div className="space-y-2">
                {items.map(item => {
                  const cd = cakeDetails[item];
                  return (
                    <div key={item} className={`rounded-xl border p-3 ${cd ? "border-[#f07097]/20 bg-[#fef7f9]" : "border-[#f0e8e0] bg-[#faf8f5]"}`}>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        🎂 {item}
                      </p>
                      {cd && (
                        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <p><span className="font-medium text-gray-700">Masa:</span> {cd.masa}</p>
                          <p><span className="font-medium text-gray-700">Relleno:</span> {cd.filling}</p>
                          <p><span className="font-medium text-gray-700">Tamaño:</span> {cd.size}</p>
                          {cd.colors && <p><span className="font-medium text-gray-700">Colores:</span> {cd.colors}</p>}
                          {cd.message && <p className="col-span-2"><span className="font-medium text-gray-700">Mensaje:</span> "{cd.message}"</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><FileText size={12} /> Notas</p>
              <div className="bg-[#faf8f5] rounded-2xl p-4 text-sm text-gray-600 italic">"{order.notes}"</div>
            </div>
          )}

          {/* Reference images */}
          {imgs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <ImageIcon size={12} /> Imágenes de referencia ({imgs.length})
              </p>
              <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgs[imgIdx]} alt="" className="w-full h-full object-contain" />
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"><ChevronLeft size={18} /></button>
                    <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"><ChevronRight size={18} /></button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imgs.map((_, i) => (
                        <button key={i} onClick={() => setImgIdx(i)} className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white w-5" : "bg-white/50 w-1.5"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {imgs.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" onClick={() => setImgIdx(i)}
                      className={`w-14 h-14 rounded-xl object-cover cursor-pointer border-2 transition ${i === imgIdx ? "border-[#f07097]" : "border-transparent opacity-60 hover:opacity-100"}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin controls */}
          <div className="border-t border-[#f0e8e0] pt-5 space-y-4">
            {/* Status dropdown */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Estado del pedido</p>
              <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#f0e8e0] bg-white text-sm font-semibold focus:outline-none focus:border-[#f07097] transition appearance-none cursor-pointer pr-10"
                  style={{ color: STATUS[status]?.color }}>
                  {STATUSES.map(s => <option key={s} value={s} style={{ color: STATUS[s].color }}>{STATUS[s].label}</option>)}
                </select>
                <ChevronLeft size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Assign */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><User size={11} /> Asignar a repostera</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setAssigned("")}
                  className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${!assigned ? "text-white border-transparent" : "border-[#f0e8e0] text-gray-400 hover:border-gray-300"}`}
                  style={!assigned ? { background: BTN } : {}}>
                  Sin asignar
                </button>
                {BAKERS.map(baker => (
                  <button key={baker} onClick={() => setAssigned(baker)}
                    className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${assigned === baker ? "text-white border-transparent" : "border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`}
                    style={assigned === baker ? { background: BTN } : {}}>
                    {baker}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={save} disabled={saving}
                className="flex-1 min-w-[140px] py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: BTN }}>
                {saving ? "Guardando…" : <><Check size={16} /> Guardar cambios</>}
              </button>
              <a
                href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm transition ${
                  !order.assignedTo ? "opacity-50 pointer-events-none" : "hover:opacity-90"
                }`}
                style={{ background: "#25D366" }}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <button onClick={() => onDelete(order.id)}
                className="px-4 py-3 rounded-2xl border-2 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition flex items-center gap-1.5 text-sm">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"catalog" | "orders">("orders");

  // Catalog
  const [products, setProducts]   = useState<Product[]>([]);
  const [catFilter, setCatFilter] = useState("all");
  const [form, setForm]           = useState<typeof empty>(empty);
  const [editing, setEditing]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef      = useRef<HTMLDivElement>(null);

  // Orders
  const [orders, setOrders]           = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  async function load() { const r = await fetch("/api/products"); setProducts(await r.json()); }
  async function loadOrders() {
    setOrdersLoading(true);
    const r = await fetch("/api/orders");
    if (r.ok) setOrders(await r.json());
    setOrdersLoading(false);
  }
  useEffect(() => { load(); loadOrders(); }, []);

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/admin/login"); }

  // Catalog helpers
  async function flattenToJpeg(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new window.Image(); const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0); URL.revokeObjectURL(objectUrl);
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); }; img.src = objectUrl;
    });
  }
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]; if (!raw) return;
    setUploadError(""); setImagePreview(URL.createObjectURL(raw)); setUploading(true);
    const file = await flattenToJpeg(raw);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Error al subir" })); setUploadError(err.error ?? "Error al subir"); setImagePreview(""); setForm(f => ({ ...f, imageUrl: "" })); return; }
    const { url } = await res.json(); setForm(f => ({ ...f, imageUrl: url }));
  }
  function clearImage() { setImagePreview(""); setUploadError(""); setForm(f => ({ ...f, imageUrl: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }
  function cancelEdit() { setEditing(null); setForm(empty); setImagePreview(""); setUploadError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!form.imageUrl) { alert("Por favor selecciona una imagen."); return; }
    setLoading(true);
    const body = { name: form.name, description: form.description, category: form.category, imageUrl: form.imageUrl, price: form.price === "" ? null : Number(form.price) };
    const res = await fetch(editing ? `/api/products/${editing}` : "/api/products", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false); if (!res.ok) { alert("Error: " + await res.text()); return; } cancelEdit(); load();
  }
  function editProduct(p: Product) {
    setEditing(p.id); setForm({ name: p.name, description: p.description, category: p.category, imageUrl: p.imageUrl, price: p.price?.toString() ?? "" });
    setImagePreview(p.imageUrl); setUploadError(""); if (fileInputRef.current) fileInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function del(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" }); if (!res.ok) { alert("Error al eliminar"); return; } load();
  }

  // Orders helpers
  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await loadOrders();
    setSelectedOrder(prev => prev?.id === id ? { ...prev, ...data } : prev);
  }, []);
  const deleteOrder = useCallback(async (id: string) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" }); setSelectedOrder(null); loadOrders();
  }, []);

  const pendingCount = orders.filter(o => o.status === "PENDING").length;
  const filteredProducts = catFilter === "all" ? products : products.filter(p => p.category === catFilter);

  return (
    <div className="min-h-screen" style={{ background: "#faf8f5" }}>
      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={updateOrder} onDelete={deleteOrder} />
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#f0e8e0] bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: BTN }}>K</div>
            <span className="font-semibold text-sm">Kan M · Admin</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <LogOut size={15} /> Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Productos", value: products.length, icon: "🛍️" },
            { label: "Total pedidos", value: orders.length, icon: "📋" },
            { label: "En revisión", value: pendingCount, icon: "⏳", highlight: pendingCount > 0 },
            { label: "Confirmados", value: orders.filter(o => o.status === "CONFIRMED").length, icon: "✅" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#f0e8e0] p-4 shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold font-display ${s.highlight ? "text-[#f07097]" : "text-gray-800"}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-[#f0e8e0] rounded-2xl p-1 w-fit shadow-sm">
          <button onClick={() => setTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "orders" ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={tab === "orders" ? { background: BTN } : {}}>
            <ClipboardList size={16} /> Pedidos
            {pendingCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === "orders" ? "bg-white text-[#f07097]" : "bg-[#f07097] text-white"}`}>{pendingCount}</span>
            )}
          </button>
          <button onClick={() => setTab("catalog")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "catalog" ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={tab === "catalog" ? { background: BTN } : {}}>
            <Package size={16} /> Catálogo
          </button>
        </div>

        {/* ── ORDERS ─────────────────────────── */}
        {tab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl">Pedidos y encargos</h2>
              <button onClick={loadOrders} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#f07097] transition px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#f0e8e0]">
                <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
            {ordersLoading ? (
              <div className="text-center py-20 text-gray-400">Cargando pedidos…</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#f0e8e0]"><div className="text-5xl mb-3">📋</div><p className="text-gray-500">No hay pedidos aún.</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {orders.map(o => {
                  const st = STATUS[o.status] ?? STATUS.PENDING;
                  const imgs = Array.isArray(o.imageUrls) ? o.imageUrls : [];
                  const items = Array.isArray(o.selectedItems) ? o.selectedItems : [];
                  const dateR = new Date(o.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
                  return (
                    <button key={o.id} onClick={() => setSelectedOrder(o)}
                      className="bg-white rounded-3xl border border-[#f0e8e0] shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full cursor-pointer group">
                      {imgs.length > 0 ? (
                        <div className="flex h-28 overflow-hidden">
                          {imgs.slice(0, 3).map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={url} alt="" className="flex-1 object-cover min-w-0 group-hover:scale-105 transition-transform duration-300" style={{ flexBasis: `${100 / Math.min(imgs.length, 3)}%` }} />
                          ))}
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)" }}>🎂</div>
                      )}
                      <div className="p-5 flex flex-col gap-2.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />{st.label}
                          </span>
                          <span className="text-xs text-gray-400">{dateR}</span>
                        </div>
                        <div>
                          <h3 className="font-display text-lg leading-tight">{o.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{o.phone}</p>
                        </div>
                        <div className="bg-[#faf8f5] rounded-xl p-3 text-xs space-y-1">
                          <p className="font-medium text-gray-700">🎉 {o.eventType}</p>
                          <p className="text-gray-500">📅 {o.eventDate}{o.deliveryTime ? ` · ⏰ ${o.deliveryTime}` : ""}</p>
                          <p className="text-gray-500">👥 {o.guestCount} personas</p>
                          {items.length > 0 && <p className="text-gray-400 truncate">🛒 {items.join(", ")}</p>}
                        </div>
                        {o.assignedTo && <p className="text-xs text-[#f07097] flex items-center gap-1"><User size={11} /> {o.assignedTo}</p>}
                        {imgs.length > 0 && <p className="text-xs text-gray-400 flex items-center gap-1"><ImageIcon size={11} /> {imgs.length} foto{imgs.length > 1 ? "s" : ""}</p>}
                        <p className="text-xs text-[#f07097] font-medium mt-auto">Ver detalles →</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CATALOG ────────────────────────── */}
        {tab === "catalog" && (
          <div>
            {/* Form */}
            <div ref={formRef} className="bg-white rounded-3xl border border-[#f0e8e0] shadow-sm p-6 mb-8">
              <h2 className="font-display text-xl mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center" style={{ background: BTN }}>
                  {editing ? <Pencil size={13} /> : <Plus size={13} />}
                </span>
                {editing ? "Editando producto" : "Agregar nuevo producto"}
              </h2>
              <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
                <input required placeholder="Nombre del producto" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-[#f0e8e0] bg-[#faf8f5] px-4 py-2.5 text-sm md:col-span-2 focus:outline-none focus:border-[#f07097] transition" />
                <textarea required placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="rounded-xl border border-[#f0e8e0] bg-[#faf8f5] px-4 py-2.5 text-sm md:col-span-2 resize-none focus:outline-none focus:border-[#f07097] transition" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="rounded-xl border border-[#f0e8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input type="number" placeholder="Precio (opcional)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="rounded-xl border border-[#f0e8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition" />
                <div className="md:col-span-2">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-[#f0e8e0]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={clearImage} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"><X size={12} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#f0e8e0] text-gray-400 hover:border-[#f07097]/50 hover:text-[#f07097] transition text-sm">
                      <Plus size={16} /> {uploading ? "Subiendo…" : "Agregar imagen"}
                    </button>
                  )}
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={loading || uploading}
                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50" style={{ background: BTN }}>
                    {loading ? "Guardando…" : editing ? "Guardar cambios" : "Agregar producto"}
                  </button>
                  {editing && <button type="button" onClick={cancelEdit} className="px-6 py-2.5 rounded-xl border border-[#f0e8e0] text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>}
                </div>
              </form>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setCatFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition ${catFilter === "all" ? "text-white border-transparent" : "border-[#f0e8e0] text-gray-500 hover:border-gray-300"}`}
                style={catFilter === "all" ? { background: BTN } : {}}>
                Todos ({products.length})
              </button>
              {CATEGORIES.map(c => {
                const count = products.filter(p => p.category === c.id).length;
                return (
                  <button key={c.id} onClick={() => setCatFilter(c.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition ${catFilter === c.id ? "text-white border-transparent" : "border-[#f0e8e0] text-gray-500 hover:border-gray-300"}`}
                    style={catFilter === c.id ? { background: BTN } : {}}>
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Product grid */}
            <h2 className="font-display text-xl mb-5">Productos <span className="text-gray-400 text-base font-normal">({filteredProducts.length})</span></h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#f0e8e0]"><div className="text-5xl mb-3">🛍️</div><p className="text-gray-500">No hay productos en esta categoría.</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-3xl border border-[#f0e8e0] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.name} className="w-full aspect-[4/3] object-cover" />
                    <div className="p-5">
                      <span className="inline-block text-xs font-semibold text-white px-2.5 py-1 rounded-full mb-2" style={{ background: BTN }}>{catLabel(p.category)}</span>
                      <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                      {p.price != null && <p className="text-sm font-semibold mt-2" style={{ color: "#f07097" }}>RD${p.price.toLocaleString("es-DO")}</p>}
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => editProduct(p)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-[#f0e8e0] hover:bg-[#faf8f5] transition">
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => del(p.id)} className="px-4 py-2 text-sm rounded-xl text-red-400 border border-red-100 hover:bg-red-50 transition"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
