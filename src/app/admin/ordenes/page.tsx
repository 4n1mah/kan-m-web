"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  AlertTriangle,
  Clock,
  Package,
} from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";

// ── Types ─────────────────────────────────────────────────────
type CartItem = {
  id: string;
  name: string;
  price: number | null;
  quantity: number;
  category: string;
};

type CartOrder = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMethod: "DINE_IN" | "PICKUP";
  items: CartItem[];
  subtotal: number;
  total: number;
  receiptImageUrl: string;
  status: "PENDING" | "CONFIRMED" | "DENIED" | "SENT";
  externalSyncStatus: "NOT_SENT" | "SENT" | "FAILED";
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "BAKER" | "ASSISTANT";
};

// ── Constants ─────────────────────────────────────────────────
const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

const STATUS_CFG: Record<
  CartOrder["status"],
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING:   { label: "Pendiente",  color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  CONFIRMED: { label: "Confirmada", color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  DENIED:    { label: "Negada",     color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  SENT:      { label: "Enviada",    color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
};

const TABS = [
  { id: "ALL",       label: "Todas" },
  { id: "PENDING",   label: "Pendientes" },
  { id: "CONFIRMED", label: "Confirmadas" },
  { id: "DENIED",    label: "Negadas" },
  { id: "SENT",      label: "Enviadas" },
] as const;

type TabId = typeof TABS[number]["id"];

const METHOD_LABEL: Record<CartOrder["fulfillmentMethod"], string> = {
  DINE_IN: "Consumir en el local",
  PICKUP:  "Pasar a recoger",
};

// ── Helpers ───────────────────────────────────────────────────
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })
  );
}

// ── Lightbox ──────────────────────────────────────────────────
function ImgLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.94)" }}
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Comprobante"
          className="max-h-[78vh] max-w-full mx-auto rounded-2xl object-contain shadow-2xl"
        />
      </div>
      <div className="flex items-center gap-4 mt-5">
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm hover:bg-white/25 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={14} /> Descargar
        </a>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm hover:bg-white/25 transition"
        >
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: CartOrder;
  onClose: () => void;
  onUpdateStatus: (id: string, status: CartOrder["status"]) => Promise<void>;
}) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [saving, setSaving] = useState(false);
  const st = STATUS_CFG[order.status];

  const items = Array.isArray(order.items) ? (order.items as CartItem[]) : [];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !showLightbox) onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose, showLightbox]);

  async function handleAction(newStatus: CartOrder["status"]) {
    setSaving(true);
    await onUpdateStatus(order.id, newStatus);
    setSaving(false);
    onClose();
  }

  const waMsg = encodeURIComponent(
    `Hola ${order.customerName}, te escribimos de Kan M sobre tu orden ${order.code}. Necesitamos confirmar algunos detalles de tu pago/orden.`
  );
  const waLink = `https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${waMsg}`;

  return (
    <>
      {showLightbox && (
        <ImgLightbox url={order.receiptImageUrl} onClose={() => setShowLightbox(false)} />
      )}

      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0] rounded-t-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ color: st.color, background: st.bg }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                {st.label}
              </span>
              <span className="font-display text-xl ml-1">{order.code}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Client info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Cliente", value: order.customerName },
                { label: "Teléfono", value: order.customerPhone },
                { label: "Método", value: METHOD_LABEL[order.fulfillmentMethod] },
                { label: "Fecha", value: fmtDateTime(order.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#faf8f5] rounded-2xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {/* Items */}
            {items.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Productos
                </p>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-[#faf8f5] rounded-xl px-4 py-2.5 border border-[#f0e8e0]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Cantidad: {item.quantity}
                          {item.price != null && ` · RD${item.price.toLocaleString("es-DO")} c/u`}
                        </p>
                      </div>
                      {item.price != null && (
                        <span className="text-sm font-bold text-[#f07097]">
                          RD${(item.price * item.quantity).toLocaleString("es-DO")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center rounded-2xl border border-[#f0e8e0] px-5 py-3.5">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-display text-2xl font-bold text-[#e85d82]">
                RD${order.total.toLocaleString("es-DO")}
              </span>
            </div>

            {/* Receipt */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Comprobante de pago
              </p>
              <button
                onClick={() => setShowLightbox(true)}
                className="relative w-full rounded-2xl overflow-hidden border-2 border-[#f0e8e0] hover:border-[#f07097] transition cursor-zoom-in group"
                style={{ maxHeight: 220 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.receiptImageUrl}
                  alt="Comprobante"
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{ maxHeight: 220 }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    Ampliar
                  </span>
                </div>
              </button>
            </div>

            {/* External sync status */}
            {order.externalSyncStatus !== "NOT_SENT" && (
              <div
                className={`text-xs px-3 py-2 rounded-xl flex items-center gap-2 ${
                  order.externalSyncStatus === "SENT"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {order.externalSyncStatus === "SENT" ? (
                  <><CheckCircle2 size={12} /> Enviada al sistema externo</>
                ) : (
                  <><AlertTriangle size={12} /> Falló el envío al sistema externo (la orden está guardada)</>
                )}
              </div>
            )}

            {/* Actions */}
            {order.status === "PENDING" && (
              <div className="border-t border-[#f0e8e0] pt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Acción sobre la orden
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleAction("CONFIRMED")}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                    style={{ background: "#bbf7d0", color: "#065f46" }}
                  >
                    <CheckCircle2 size={15} /> Confirmar pago
                  </button>
                  <button
                    onClick={() => handleAction("DENIED")}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                    style={{ background: "#fecaca", color: "#991b1b" }}
                  >
                    <XCircle size={15} /> Negar
                  </button>
                </div>
              </div>
            )}

            {/* WhatsApp button */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border-2 border-green-200 text-green-700 text-sm font-semibold hover:bg-green-50 transition"
            >
              <MessageCircle size={16} /> WhatsApp al cliente
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Order Card ────────────────────────────────────────────────
function OrderCard({
  order,
  onClick,
}: {
  order: CartOrder;
  onClick: () => void;
}) {
  const st = STATUS_CFG[order.status];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#f0e8e0] shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Receipt thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={order.receiptImageUrl}
        alt="Comprobante"
        className="w-full h-28 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />

      <div className="p-4 space-y-2.5">
        {/* Code + status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold text-gray-900">{order.code}</span>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ color: st.color, background: st.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
        </div>

        {/* Client */}
        <div>
          <p className="font-semibold text-gray-800">{order.customerName}</p>
          <p className="text-xs text-gray-500">{order.customerPhone}</p>
        </div>

        {/* Method + total */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">
            {order.fulfillmentMethod === "DINE_IN" ? "🏠 Local" : "🛍️ Recoger"}
          </span>
          <span className="font-bold text-[#f07097]">
            RD${order.total.toLocaleString("es-DO")}
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400">
          <Clock size={10} className="inline mr-1" />
          {fmtDateTime(order.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function OrdenesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("PENDING");
  const [selected, setSelected] = useState<CartOrder | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/cart-orders");
    if (r.ok) setOrders(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) { router.push("/admin/login"); return; }
      const data = await r.json();
      if (data.user) setCurrentUser(data.user);
    });
    loadOrders();
  }, [loadOrders, router]);

  const updateStatus = useCallback(
    async (id: string, status: CartOrder["status"]) => {
      const res = await fetch(`/api/admin/cart-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        addToast("Error al actualizar la orden", "error");
        return;
      }
      addToast(
        status === "CONFIRMED" ? "Orden confirmada" : "Orden actualizada",
        "success"
      );
      await loadOrders();
    },
    [loadOrders, addToast]
  );

  const filtered =
    tab === "ALL" ? orders : orders.filter((o) => o.status === tab);

  const tabCounts = {
    ALL:       orders.length,
    PENDING:   orders.filter((o) => o.status === "PENDING").length,
    CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
    DENIED:    orders.filter((o) => o.status === "DENIED").length,
    SENT:      orders.filter((o) => o.status === "SENT").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={async (id, status) => {
            await updateStatus(id, status);
            setSelected(null);
          }}
        />
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/20 shadow-sm"
        style={{ background: PINK }}
      >
        <div
          className="max-w-7xl mx-auto px-6 flex items-center gap-4"
          style={{ height: "3.75rem" }}
        >
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition text-sm"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <Package size={18} className="text-white" />
            <div>
              <p className="font-semibold text-sm text-white leading-tight">Órdenes del catálogo</p>
              {currentUser && (
                <p className="text-xs text-white/70 leading-tight">{currentUser.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={loadOrders}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",      value: orders.length,         emoji: "📦" },
            { label: "Pendientes", value: tabCounts.PENDING,     emoji: "⏳", hot: tabCounts.PENDING > 0 },
            { label: "Confirmadas",value: tabCounts.CONFIRMED,   emoji: "✅" },
            { label: "Negadas",    value: tabCounts.DENIED,      emoji: "❌" },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-white rounded-2xl border p-4 shadow-sm ${
                s.hot ? "border-amber-200 ring-1 ring-amber-100" : "border-[#ede8e0]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-bold font-display ${s.hot ? "text-[#f07097]" : "text-gray-800"}`}>
                    {s.value}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
                </div>
                <span className="text-2xl">{s.emoji}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm mb-5">
          <div className="flex flex-wrap border-b border-[#ede8e0]">
            {TABS.map((t) => {
              const active = tab === t.id;
              const count = tabCounts[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex-1 justify-center sm:flex-none ${
                    active
                      ? "border-[#f07097] text-[#f07097]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                  <span
                    className={`min-w-[1.2rem] h-5 px-1 rounded-full text-xs flex items-center justify-center font-bold ${
                      active ? "bg-[#f07097] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#ede8e0]">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-gray-500 text-sm">No hay órdenes en este estado.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
