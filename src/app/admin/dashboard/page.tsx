"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, ClipboardList, LogOut, RefreshCw, Plus, X,
  Pencil, Trash2, ChevronLeft, ChevronRight, Check,
  MessageCircle, User, ShoppingBag, FileText, Download,
  Image as ImageIcon, ChevronDown, AlertTriangle
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type Product = { id: string; name: string; description: string; category: string; imageUrl: string; price: number | null; };
type CakeDetail = { filling: string; masa: string; colors: string; message: string; size: string; };
type Order = {
  id: string; name: string; phone: string; email?: string;
  eventType: string; eventDate: string; deliveryTime?: string; guestCount: string;
  selectedItems: string[]; cakeDetails?: Record<string, CakeDetail>;
  notes?: string; imageUrls: string[];
  status: string; assignedTo?: string | null; createdAt: string;
};

function formatTo12h(time?: string) {
  if (!time) return "No especificada";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string; border: string }> = {
  PENDING:    { label: "En revisión",     color: "#92400e", bg: "#fef3c7", dot: "#f59e0b",  border: "#fcd34d" },
  CONFIRMED:  { label: "Confirmado",      color: "#065f46", bg: "#d1fae5", dot: "#10b981",  border: "#6ee7b7" },
  COMPLETED:  { label: "Completado",      color: "#1e3a5f", bg: "#dbeafe", dot: "#2563eb",  border: "#93c5fd" },
  NEEDS_INFO: { label: "Más información", color: "#5b21b6", bg: "#f3e8ff", dot: "#a855f7",  border: "#d8b4fe" },
  REJECTED:   { label: "No disponible",   color: "#991b1b", bg: "#fee2e2", dot: "#ef4444",  border: "#fca5a5" },
  CANCELLED:  { label: "Cancelado",       color: "#374151", bg: "#f3f4f6", dot: "#9ca3af",  border: "#d1d5db" },
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
const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const ev = new Date(dateStr + "T00:00:00");
  return Math.ceil((ev.getTime() - today.getTime()) / 86400000);
}
function isUrgent(o: Order) {
  const d = daysUntil(o.eventDate);
  return d >= 0 && d <= 2 && !["COMPLETED","CANCELLED","REJECTED"].includes(o.status);
}
function priorityScore(o: Order) {
  if (isUrgent(o)) return 0;
  if (o.status === "PENDING") return 1;
  if (o.status === "CONFIRMED") return 2;
  if (o.status === "NEEDS_INFO") return 3;
  return 4;
}

// ── Baker popup ───────────────────────────────────────────────
function BakerPopup({ onSelect, onClose }: { onSelect: (b: string) => void; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-xl mb-1">Asignar repostera</h3>
        <p className="text-sm text-gray-500 mb-5">¿Quién se encarga de este pedido?</p>
        <div className="space-y-2.5">
          {BAKERS.map(b => (
            <button key={b} onClick={() => onSelect(b)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-[#f0e8e0] hover:border-[#f07097] hover:bg-[#fef7f9] transition text-left group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: PINK }}>{b[0]}</div>
              <span className="font-semibold text-gray-700 group-hover:text-[#f07097] transition">{b}</span>
            </button>
          ))}
          <button onClick={() => onSelect("")} className="w-full px-4 py-3 rounded-2xl border border-dashed border-[#f0e8e0] text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition">
            Sin asignar por ahora
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────
function ImgLightbox({ urls, startIdx, onClose }: { urls: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + urls.length) % urls.length);
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % urls.length);
    };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose, urls.length]);
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.94)" }} onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[idx]} alt="" className="max-h-[78vh] max-w-full mx-auto rounded-2xl object-contain shadow-2xl" />
        {urls.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/30 transition"><ChevronLeft size={20} /></button>
            <button onClick={() => setIdx(i => (i + 1) % urls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/30 transition"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 mt-5">
        <span className="text-white/60 text-sm">{idx + 1} / {urls.length}</span>
        <a href={urls[idx]} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm hover:bg-white/25 transition"><Download size={14} /> Descargar</a>
        <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm hover:bg-white/25 transition"><X size={14} /> Cerrar</button>
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 mt-3">
          {urls.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/40 w-1.5"}`} />)}
        </div>
      )}
    </div>
  );
}

// ── Order Detail Modal ────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, onDelete }: {
  order: Order; onClose: () => void;
  onUpdate: (id: string, data: Partial<Order>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [status, setStatus]     = useState(order.status);
  const [assigned, setAssigned] = useState(order.assignedTo ?? "");
  const [saving, setSaving]     = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showBakerPopup, setShowBakerPopup] = useState(false);
  const [pendingStatus, setPendingStatus]   = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Safely coerce JSON values to arrays/objects
  const imgs  = Array.isArray(order.imageUrls) ? order.imageUrls.filter(u => typeof u === "string" && u.startsWith("http")) : [];
  const items = Array.isArray(order.selectedItems) ? order.selectedItems : [];
  const cakeDetails = (order.cakeDetails && typeof order.cakeDetails === "object" ? order.cakeDetails : {}) as Record<string, CakeDetail>;

  const st = STATUS[status] ?? STATUS.PENDING;
  const isPending = status === "PENDING";
  const days = daysUntil(order.eventDate);
  const urgent = days >= 0 && days <= 2 && !["COMPLETED","CANCELLED","REJECTED"].includes(status);
  const dateReceived = new Date(order.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !showBakerPopup && lightboxIdx === null) onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose, showBakerPopup, lightboxIdx]);

  const handleAction = (newStatus: string) => {
    setPendingStatus(newStatus); setShowBakerPopup(true);
  };

  // Auto-save when baker is selected from popup
  const handleBakerSelect = async (baker: string) => {
    setShowBakerPopup(false);
    const newStatus = pendingStatus ?? status;
    setStatus(newStatus); setAssigned(baker); setPendingStatus(null);
    setSaving(true);
    await onUpdate(order.id, { status: newStatus, assignedTo: baker || null });
    setSaving(false);
  };

  // Auto-save when baker is changed from buttons (non-pending state)
  const handleBakerButton = async (baker: string) => {
    setAssigned(baker);
    setSaving(true);
    await onUpdate(order.id, { assignedTo: baker || null });
    setSaving(false);
  };

  async function save() {
    setSaving(true);
    await onUpdate(order.id, { status, assignedTo: assigned || null });
    setSaving(false);
  }

  const waMsg = encodeURIComponent(`Hola ${order.name} 👋, somos Kan M. Recibimos tu cotización para *${order.eventType}* el *${order.eventDate}*${order.deliveryTime ? ` a las ${order.deliveryTime}` : ""}. `);

  return (
    <>
      {lightboxIdx !== null && <ImgLightbox urls={imgs} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      {showBakerPopup && <BakerPopup onSelect={handleBakerSelect} onClose={() => { setShowBakerPopup(false); setPendingStatus(null); }} />}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

          {/* Sticky header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0] rounded-t-3xl">
            <div className="flex items-center gap-3">
              {/* Status badge — dashed border when PENDING, clickable dropdown otherwise */}
              {!isPending ? (
                <div className="relative">
                  <button onClick={() => setShowStatusMenu(v => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition"
                    style={{
                      color: st.color, background: st.bg,
                      border: `2px dashed ${st.border}`,
                      outline: "none",
                    }}
                    title="Clic para cambiar estado">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                    {st.label} <ChevronDown size={11} />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#f0e8e0] py-2 z-20 min-w-[190px]">
                      {STATUSES.filter(s => s !== "PENDING").map(s => {
                        const cfg = STATUS[s];
                        return (
                          <button key={s} onClick={() => { setStatus(s); setShowStatusMenu(false); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[#faf8f5] transition ${status === s ? "font-semibold" : ""}`}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                            <span style={{ color: cfg.color }}>{cfg.label}</span>
                            {status === s && <Check size={12} className="ml-auto" style={{ color: cfg.dot }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ color: st.color, background: st.bg, border: `2px dashed ${st.border}` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />{st.label}
                </span>
              )}
              {urgent && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} /> {days === 0 ? "¡Hoy!" : `${days}d`}
                </span>
              )}
              <span className="text-xs text-gray-400">{dateReceived}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><X size={16} /></button>
          </div>

          <div className="p-6 space-y-5">
            {/* Client info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 font-semibold" style={{ background: PINK }}>
                {order.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl leading-tight">{order.name}</h2>
                <div className="flex flex-wrap gap-3 mt-1">
                  <a href={`tel:${order.phone}`} className="text-sm text-gray-500 hover:text-[#f07097] transition">📱 {order.phone}</a>
                  {order.email && <a href={`mailto:${order.email}`} className="text-sm text-gray-500 hover:text-[#f07097] transition truncate">📧 {order.email}</a>}
                </div>
                {assigned && <p className="text-xs text-[#f07097] mt-1.5 flex items-center gap-1 font-medium"><User size={11} /> {assigned}</p>}
              </div>
            </div>

            {/* Event grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { emoji: "🎉", label: "Tipo de evento", value: order.eventType },
                { emoji: "📅", label: "Fecha", value: order.eventDate },
                { emoji: "⏰", label: "Hora de entrega", value: formatTo12h(order.deliveryTime) },
                { emoji: "👥", label: "Personas", value: order.guestCount },
              ].map(({ emoji, label, value }) => (
                <div key={label} className="bg-[#faf8f5] rounded-2xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-semibold text-sm text-gray-800">{emoji} {value}</p>
                </div>
              ))}
            </div>

            {/* Products */}
            {items.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><ShoppingBag size={11} /> Productos</p>
                <div className="space-y-2">
                  {items.map(item => {
                    const cd = cakeDetails[item];
                    return (
                      <div key={item} className={`rounded-xl border p-3 ${cd ? "border-[#f07097]/20 bg-[#fef7f9]" : "border-[#f0e8e0] bg-[#faf8f5]"}`}>
                        <p className="text-sm font-semibold text-gray-800">🎂 {item}</p>
                        {cd && (
                          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
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
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><FileText size={11} /> Notas</p>
                <div className="bg-[#faf8f5] rounded-2xl p-4 text-sm text-gray-600 italic leading-relaxed">"{order.notes}"</div>
              </div>
            )}

            {/* ── PHOTOS — always render section, show placeholder if none ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <ImageIcon size={11} /> Imágenes de referencia
                {imgs.length > 0 && <span className="font-normal normal-case tracking-normal">({imgs.length}) — clic para ampliar y descargar</span>}
              </p>
              {imgs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {imgs.map((url, i) => (
                    <button key={i} onClick={() => setLightboxIdx(i)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#f0e8e0] hover:border-[#f07097] transition cursor-zoom-in group flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Referencia ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ImageIcon size={16} className="text-white drop-shadow" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#faf8f5] border border-dashed border-[#e8ddd3] text-xs text-gray-400">
                  <ImageIcon size={14} /> El cliente no adjuntó imágenes de referencia
                </div>
              )}
            </div>

            {/* ── Admin controls ── */}
            <div className="border-t border-[#f0e8e0] pt-5 space-y-4">

              {/* PENDING → 3 action buttons */}
              {isPending && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Acción</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleAction("CONFIRMED")}
                      className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
                      style={{ background: "#bbf7d0", color: "#065f46" }}>Aceptar</button>
                    <button onClick={() => handleAction("NEEDS_INFO")}
                      className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
                      style={{ background: "#e9d5ff", color: "#5b21b6" }}>Más información</button>
                    <button onClick={() => handleAction("CANCELLED")}
                      className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
                      style={{ background: "#fecaca", color: "#991b1b" }}>Cancelar</button>
                  </div>
                </div>
              )}

              {/* Assign baker (non-pending — auto saves) */}
              {!isPending && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><User size={11} /> Repostera asignada</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleBakerButton("")}
                      className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${!assigned ? "text-white border-transparent" : "border-[#f0e8e0] text-gray-400 hover:border-gray-300"}`}
                      style={!assigned ? { background: PINK } : {}}>Sin asignar</button>
                    {BAKERS.map(b => (
                      <button key={b} onClick={() => handleBakerButton(b)}
                        className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${assigned === b ? "text-white border-transparent" : "border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`}
                        style={assigned === b ? { background: PINK } : {}}>{b}</button>
                    ))}
                    {saving && <span className="text-xs text-gray-400 self-center ml-1">Guardando…</span>}
                  </div>
                </div>
              )}

              {/* Actions row */}
              <div className="flex flex-wrap gap-2">
                <button onClick={save} disabled={saving}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: PINK }}>
                  {saving ? "Guardando…" : <><Check size={14} /> Guardar cambios</>}
                </button>
                <a href={`https://wa.me/${order.phone.replace(/\D/g,"")}?text=${waMsg}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition"
                  style={{ background: "#bbf7d0", color: "#065f46" }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button onClick={() => onDelete(order.id)}
                  className="px-3 py-2.5 rounded-xl border-2 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Order card ────────────────────────────────────────────────
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const st = STATUS[order.status] ?? STATUS.PENDING;
  const imgs = Array.isArray(order.imageUrls) ? order.imageUrls.filter(u => typeof u === "string") : [];
  const items = Array.isArray(order.selectedItems) ? order.selectedItems : [];
  const days = daysUntil(order.eventDate);
  const urgent = isUrgent(order);
  const dateR = new Date(order.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short" });

  return (
    <button onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full cursor-pointer group ${urgent ? "border-red-300 ring-1 ring-red-100" : "border-[#f0e8e0]"}`}>
      {/* Top strip — image or gradient placeholder */}
      {imgs.length > 0 ? (
        <div className="flex h-32 overflow-hidden">
          {imgs.slice(0, 3).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="flex-1 object-cover min-w-0 group-hover:scale-105 transition-transform duration-500"
              style={{ flexBasis: `${100 / Math.min(imgs.length, 3)}%` }} />
          ))}
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#fce7f3 0%,#fdf2f8 100%)" }}>
          <span className="text-3xl">🎂</span>
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Status + urgent + date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: st.color, background: st.bg }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.dot }} />{st.label}
            </span>
            {urgent && (
              <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                <AlertTriangle size={9} /> {days === 0 ? "¡Hoy!" : `${days}d`}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{dateR}</span>
        </div>

        {/* Name + phone */}
        <div>
          <p className="font-display text-base leading-tight text-gray-900">{order.name}</p>
          <p className="text-xs text-gray-400">{order.phone}</p>
        </div>

        {/* Event summary */}
        <div className="bg-[#faf8f5] rounded-xl p-3 text-xs space-y-1">
          <p className="font-medium text-gray-700">🎉 {order.eventType}</p>
          <p className="text-gray-500">📅 {order.eventDate}{order.deliveryTime ? ` · ⏰ ${order.deliveryTime}` : ""}</p>
          {items.length > 0 && <p className="text-gray-400 truncate">🛒 {items.join(", ")}</p>}
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-2">
            {order.assignedTo && <p className="text-xs text-[#f07097] flex items-center gap-0.5 font-medium"><User size={10} /> {order.assignedTo.split(" ")[0]}</p>}
            {imgs.length > 0 && <p className="text-xs text-gray-400 flex items-center gap-0.5"><ImageIcon size={10} /> {imgs.length}</p>}
          </div>
          <span className="text-xs text-[#f07097] font-medium">Ver →</span>
        </div>
      </div>
    </button>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
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
  const [statusFilter, setStatusFilter]   = useState("ALL");

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
      const img = new window.Image(); const ou = URL.createObjectURL(file);
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img,0,0); URL.revokeObjectURL(ou);
        c.toBlob(b => { if(!b){resolve(file);return;} resolve(new File([b], file.name.replace(/\.\w+$/,".jpg"),{type:"image/jpeg"})); },"image/jpeg",0.92);
      };
      img.onerror = () => { URL.revokeObjectURL(ou); resolve(file); }; img.src = ou;
    });
  }
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]; if(!raw) return;
    setUploadError(""); setImagePreview(URL.createObjectURL(raw)); setUploading(true);
    const file = await flattenToJpeg(raw); const fd = new FormData(); fd.append("file",file);
    const res = await fetch("/api/upload",{method:"POST",body:fd}); setUploading(false);
    if(!res.ok){const err=await res.json().catch(()=>({error:"Error al subir"}));setUploadError(err.error??"Error al subir");setImagePreview("");setForm(f=>({...f,imageUrl:""}));return;}
    const {url}=await res.json(); setForm(f=>({...f,imageUrl:url}));
  }
  function clearImage(){setImagePreview("");setUploadError("");setForm(f=>({...f,imageUrl:""}));if(fileInputRef.current)fileInputRef.current.value="";}
  function cancelEdit(){setEditing(null);setForm(empty);setImagePreview("");setUploadError("");if(fileInputRef.current)fileInputRef.current.value="";}
  async function save(e: React.FormEvent){
    e.preventDefault(); if(!form.imageUrl){alert("Por favor selecciona una imagen.");return;}
    setLoading(true);
    const body={name:form.name,description:form.description,category:form.category,imageUrl:form.imageUrl,price:form.price===""?null:Number(form.price)};
    const res=await fetch(editing?`/api/products/${editing}`:"/api/products",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    setLoading(false); if(!res.ok){alert("Error: "+await res.text());return;} cancelEdit(); load();
  }
  function editProduct(p: Product){
    setEditing(p.id);setForm({name:p.name,description:p.description,category:p.category,imageUrl:p.imageUrl,price:p.price?.toString()??""});
    setImagePreview(p.imageUrl);setUploadError("");if(fileInputRef.current)fileInputRef.current.value="";
    formRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function del(id: string){
    if(!confirm("¿Eliminar este producto?"))return;
    const res=await fetch(`/api/products/${id}`,{method:"DELETE"});if(!res.ok){alert("Error al eliminar");return;}load();
  }

  // Orders helpers
  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    await fetch(`/api/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    await loadOrders();
    setSelectedOrder(prev => prev?.id === id ? {...prev,...data} : prev);
  }, []);
  const deleteOrder = useCallback(async (id: string) => {
    if(!confirm("¿Eliminar este pedido?"))return;
    await fetch(`/api/orders/${id}`,{method:"DELETE"});setSelectedOrder(null);loadOrders();
  }, []);

  const pendingCount = orders.filter(o => o.status === "PENDING").length;

  // Sort: urgent first, then PENDING, then others
  const sortedOrders = [...orders].sort((a, b) => priorityScore(a) - priorityScore(b));
  const filteredOrders = statusFilter === "ALL" ? sortedOrders : sortedOrders.filter(o => o.status === statusFilter);
  const filteredProducts = catFilter === "all" ? products : products.filter(p => p.category === catFilter);

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={updateOrder} onDelete={deleteOrder} />}

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-[#ede8e0] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-15 flex items-center justify-between" style={{ height: "3.75rem" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: PINK }}>K</div>
            <div>
              <p className="font-semibold text-sm leading-tight">Kan M</p>
              <p className="text-xs text-gray-400 leading-tight">Panel de administración</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Productos", value: products.length, icon: "🛍️", sub: "en catálogo" },
            { label: "Pedidos", value: orders.length, icon: "📋", sub: "en total" },
            { label: "En revisión", value: pendingCount, icon: "⏳", sub: "sin atender", hot: pendingCount > 0 },
            { label: "Confirmados", value: orders.filter(o=>o.status==="CONFIRMED").length, icon: "✅", sub: "este período" },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl border p-4 shadow-sm ${s.hot ? "border-amber-200 ring-1 ring-amber-100" : "border-[#ede8e0]"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-bold font-display ${s.hot ? "text-[#f07097]" : "text-gray-800"}`}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-white border border-[#ede8e0] rounded-xl p-1 w-fit shadow-sm">
          {[
            { id: "orders", icon: <ClipboardList size={15} />, label: "Pedidos", badge: pendingCount },
            { id: "catalog", icon: <Package size={15} />, label: "Catálogo" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={tab === t.id ? { background: PINK } : {}}>
              {t.icon} {t.label}
              {t.badge ? <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === t.id ? "bg-white text-[#f07097]" : "bg-[#f07097] text-white"}`}>{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* ── ORDERS ─────────────────────────────────── */}
        {tab === "orders" && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="font-display text-xl text-gray-900">Pedidos</h2>
              <button onClick={loadOrders} className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#f07097] transition px-3 py-1.5 rounded-lg border border-[#ede8e0] hover:border-[#f07097]/30 bg-white">
                <RefreshCw size={13} className={ordersLoading?"animate-spin":""}/> Actualizar
              </button>
            </div>

            {/* Status filter — horizontal scroll on mobile */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1" style={{scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
              <button onClick={()=>setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition shrink-0 ${statusFilter==="ALL"?"text-white border-transparent":"border-[#ede8e0] text-gray-500"}`}
                style={statusFilter==="ALL"?{background:PINK}:{}}>
                Todos ({orders.length})
              </button>
              {STATUSES.map(s=>{
                const cfg=STATUS[s]; const count=orders.filter(o=>o.status===s).length;
                return(
                  <button key={s} onClick={()=>setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 shrink-0 ${statusFilter===s?"border-transparent text-white":"border-[#ede8e0]"}`}
                    style={statusFilter===s?{background:PINK}:{color:cfg.color}}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:cfg.dot}}/>{cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Priority notice */}
            {sortedOrders.some(isUrgent) && statusFilter === "ALL" && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-red-700">
                <AlertTriangle size={15} className="shrink-0" />
                <span>Hay pedidos con eventos próximos — aparecen primero en la lista.</span>
              </div>
            )}

            {ordersLoading ? (
              <div className="text-center py-20 text-gray-400">Cargando…</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#ede8e0]">
                <div className="text-4xl mb-2">📋</div><p className="text-gray-500 text-sm">No hay pedidos en este estado.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map(o => <OrderCard key={o.id} order={o} onClick={() => setSelectedOrder(o)} />)}
              </div>
            )}
          </div>
        )}

        {/* ── CATALOG ────────────────────────────────── */}
        {tab === "catalog" && (
          <div>
            <div ref={formRef} className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm p-6 mb-6">
              <h2 className="font-display text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" style={{ background: PINK }}>
                  {editing ? <Pencil size={11} /> : <Plus size={11} />}
                </span>
                {editing ? "Editar producto" : "Nuevo producto"}
              </h2>
              <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
                <input required placeholder="Nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm md:col-span-2 focus:outline-none focus:border-[#f07097] transition" />
                <textarea required placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm md:col-span-2 resize-none focus:outline-none focus:border-[#f07097] transition" />
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input type="number" placeholder="Precio (opcional)" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition" />
                <div className="md:col-span-2">
                  {imagePreview ? (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#ede8e0]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={clearImage} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"><X size={10} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#ede8e0] text-gray-400 hover:border-[#f07097]/50 hover:text-[#f07097] transition text-sm">
                      <Plus size={15} /> {uploading ? "Subiendo…" : "Agregar imagen"}
                    </button>
                  )}
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" disabled={loading||uploading} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50" style={{ background: PINK }}>
                    {loading ? "Guardando…" : editing ? "Guardar cambios" : "Agregar"}
                  </button>
                  {editing && <button type="button" onClick={cancelEdit} className="px-5 py-2.5 rounded-xl border border-[#ede8e0] text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>}
                </div>
              </form>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {[{ id: "all", label: `Todos (${products.length})` }, ...CATEGORIES.map(c => ({ id: c.id, label: `${c.label} (${products.filter(p=>p.category===c.id).length})` }))].map(c => (
                <button key={c.id} onClick={() => setCatFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${catFilter === c.id ? "text-white border-transparent" : "border-[#ede8e0] text-gray-500 hover:border-gray-300"}`}
                  style={catFilter === c.id ? { background: PINK } : {}}>{c.label}</button>
              ))}
            </div>

            <h3 className="font-display text-lg mb-4">Productos <span className="text-gray-400 font-normal text-base">({filteredProducts.length})</span></h3>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#ede8e0]"><div className="text-4xl mb-2">🛍️</div><p className="text-gray-500 text-sm">Sin productos aquí.</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.name} className="w-full aspect-[4/3] object-cover" />
                    <div className="p-4">
                      <span className="inline-block text-xs font-semibold text-white px-2 py-0.5 rounded-full mb-1.5" style={{ background: PINK }}>{catLabel(p.category)}</span>
                      <h3 className="font-display text-base leading-tight">{p.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                      {p.price != null && <p className="text-sm font-semibold mt-1.5" style={{ color: "#f07097" }}>RD${p.price.toLocaleString("es-DO")}</p>}
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => editProduct(p)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-[#ede8e0] hover:bg-[#faf8f5] transition"><Pencil size={11} /> Editar</button>
                        <button onClick={() => del(p.id)} className="px-3 py-1.5 text-xs rounded-lg text-red-400 border border-red-100 hover:bg-red-50 transition"><Trash2 size={11} /></button>
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
