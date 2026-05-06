"use client";
import { useRef, useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useCart, CartItem, RecentOrder } from "./CartContext";
import { formatDominicanPhone, validateDominicanPhone } from "@/lib/phone";

type Step = "cart" | "info" | "payment" | "success";

type InfoForm = {
  name: string;
  phone: string;
};

type CartOrderStatus = "PENDING" | "CONFIRMED" | "DENIED" | "SENT";

const STATUS_INFO: Record<CartOrderStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Pendiente de revisión", color: "#92400e", bg: "#fef3c7" },
  CONFIRMED: { label: "Confirmada",            color: "#065f46", bg: "#d1fae5" },
  DENIED:    { label: "No procesada",          color: "#991b1b", bg: "#fee2e2" },
  SENT:      { label: "Enviada",               color: "#1e40af", bg: "#dbeafe" },
};

function RecentOrderCard({
  order,
  onReorder,
}: {
  order: RecentOrder;
  onReorder: (items: CartItem[]) => void;
}) {
  const [status, setStatus] = useState<CartOrderStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusErr, setStatusErr] = useState("");

  async function fetchStatus() {
    setLoadingStatus(true);
    setStatusErr("");
    try {
      const r = await fetch(`/api/cart-orders/status?code=${order.code}`);
      if (r.ok) {
        const data = await r.json();
        setStatus(data.status as CartOrderStatus);
      } else {
        setStatusErr("No se pudo obtener el estado.");
      }
    } catch {
      setStatusErr("Error de conexión.");
    } finally {
      setLoadingStatus(false);
    }
  }

  const date = new Date(order.createdAt).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
  });

  const info = status ? STATUS_INFO[status] : null;

  return (
    <div className="bg-white rounded-2xl border border-[#ede8e0] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono font-bold text-[#e85d82] text-sm tracking-wide">{order.code}</p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-800 text-sm">
            RD${order.total.toLocaleString("es-DO")}
          </p>
          {info ? (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ color: info.color, background: info.bg }}
            >
              {info.label}
            </span>
          ) : (
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="text-xs text-[#f07097] hover:underline mt-1 block ml-auto disabled:opacity-50"
            >
              {loadingStatus ? "Consultando…" : "Ver estado →"}
            </button>
          )}
          {statusErr && (
            <p className="text-xs text-red-400 mt-1">{statusErr}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onReorder(order.items)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
        style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
      >
        Pedir de nuevo
      </button>
    </div>
  );
}

// ── Step: Cart items ─────────────────────────────────────────────
function CartStep({
  items,
  subtotal,
  setQuantity,
  remove,
  onNext,
  recentOrders,
  onReorder,
}: {
  items: CartItem[];
  subtotal: number;
  setQuantity: (id: string, qty: number) => void;
  remove: (id: string) => void;
  onNext: () => void;
  recentOrders: RecentOrder[];
  onReorder: (items: CartItem[]) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-y-auto px-5 py-8">
        <div className="flex flex-col items-center text-center mb-8">
          <ShoppingCart size={48} className="text-[#f0dde4] mb-4" />
          <p className="font-display text-xl text-gray-700 mb-2">Tu carrito está vacío</p>
          <p className="text-sm text-gray-400">
            Agrega productos desde el catálogo para comenzar tu pedido.
          </p>
        </div>
        {recentOrders.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Órdenes recientes</p>
            {recentOrders.map((order) => (
              <RecentOrderCard key={order.code} order={order} onReorder={onReorder} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-[#faf8f5] rounded-2xl p-3 border border-[#f0e8e0]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 leading-tight truncate">
                {item.name}
              </p>
              {item.price != null ? (
                <p className="text-xs text-[#f07097] font-medium mt-0.5">
                  RD${item.price.toLocaleString("es-DO")} c/u
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Precio a consultar</p>
              )}
              {item.price != null && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Subtotal: RD${(item.price * item.quantity).toLocaleString("es-DO")}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => remove(item.id)}
                className="text-gray-300 hover:text-red-400 transition"
                aria-label="Eliminar"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-[#ede8e0] flex items-center justify-center hover:border-[#f07097] transition"
                >
                  <Minus size={12} />
                </button>
                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => setQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-[#ede8e0] flex items-center justify-center hover:border-[#f07097] transition"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#f0e8e0] px-5 py-5 space-y-3 bg-white">
        {/* Aviso de recogida */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Las órdenes realizadas por la página son únicamente para pasar a recoger en el local. No tenemos delivery disponible para este tipo de orden.
          </p>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="font-display text-xl font-bold text-gray-900">
            RD${subtotal.toLocaleString("es-DO")}
          </span>
        </div>
        <button
          onClick={onNext}
          className="w-full py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition active:scale-95"
          style={{
            background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
          }}
        >
          Ordenar →
        </button>
      </div>
    </div>
  );
}

// ── Step: Customer info ──────────────────────────────────────────
function InfoStep({
  form,
  setForm,
  onNext,
}: {
  form: InfoForm;
  setForm: (f: InfoForm) => void;
  onNext: () => void;
}) {
  const inputCls =
    "w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-3 text-sm focus:outline-none focus:border-[#f07097] transition";

  const phoneValid = validateDominicanPhone(form.phone);
  const canSubmit = form.name.trim().length >= 2 && phoneValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Pickup-only notice */}
        <div className="flex items-start gap-3 bg-[#fef7f9] border border-[#f9c8d8] rounded-2xl px-4 py-3.5">
          <span className="text-lg shrink-0">🛍️</span>
          <div>
            <p className="text-sm font-semibold text-[#e85d82]">Pasar a recoger en el local</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Las órdenes realizadas por la página son únicamente para pasar a recoger. No tenemos delivery disponible para este tipo de orden.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
              Tu nombre *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre completo"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
              Teléfono *
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatDominicanPhone(e.target.value) })}
              placeholder="809-000-0000"
              maxLength={12}
              className={inputCls}
            />
            {form.phone.length > 0 && !phoneValid && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} />
                Ingresa un número dominicano válido, ejemplo: 809-519-5688.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#f0e8e0] px-5 py-5 bg-white">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition active:scale-95 disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
          }}
        >
          Continuar al pago →
        </button>
      </div>
    </form>
  );
}

// ── Step: Payment + receipt upload ──────────────────────────────
function PaymentStep({
  subtotal,
  receiptUrl,
  uploading,
  uploadErr,
  submitting,
  submitErr,
  fileRef,
  onFileChange,
  onSubmit,
}: {
  subtotal: number;
  receiptUrl: string;
  uploading: boolean;
  uploadErr: string;
  submitting: boolean;
  submitErr: string;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileChange: (file: File) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Total */}
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{
            background: "linear-gradient(135deg,#fef7f9 0%,#fce7f3 100%)",
            border: "1px solid #f9c8d8",
          }}
        >
          <p className="text-xs text-gray-500 mb-1">Total a transferir</p>
          <p className="font-display text-3xl font-bold text-[#e85d82]">
            RD${subtotal.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Transfiere el monto exacto</p>
        </div>

        {/* Bank details */}
        <div className="bg-white rounded-2xl border border-[#ede8e0] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#faf8f5] border-b border-[#ede8e0]">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Transfiere a una de estas cuentas
            </p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Transfiere el monto exacto de tu orden y luego sube el comprobante para que podamos validar tu pedido.
            </p>

            {/* BHD */}
            <div className="border border-[#ede8e0] rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">BHD León</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cuenta de ahorro</span>
                <span className="text-sm font-mono font-bold text-gray-800">23842820013</span>
              </div>
            </div>

            {/* Banreservas */}
            <div className="border border-[#ede8e0] rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Banreservas</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cuenta de ahorro</span>
                <span className="text-sm font-mono font-bold text-gray-800">9606681469</span>
              </div>
            </div>

            {/* Titular */}
            <div className="space-y-1.5 border-t border-[#f0e8e0] pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Titular</span>
                <span className="text-sm font-semibold text-gray-800">Karolyn Sierra</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cédula</span>
                <span className="text-sm font-mono text-gray-700">402-2795-6733</span>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt upload */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Comprobante de pago *
          </p>
          {receiptUrl ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-green-300 bg-green-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptUrl}
                alt="Comprobante"
                className="w-full max-h-48 object-contain"
              />
              <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <CheckCircle2 size={12} /> Subido
                </span>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-2 text-xs text-gray-500 hover:text-[#f07097] transition border-t border-green-200"
              >
                Cambiar imagen
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full py-8 rounded-2xl border-2 border-dashed border-[#ede8e0] flex flex-col items-center gap-2 text-gray-400 hover:border-[#f07097] hover:text-[#f07097] transition disabled:opacity-50"
            >
              <Upload size={24} />
              <span className="text-sm font-medium">
                {uploading ? "Subiendo…" : "Subir foto del comprobante"}
              </span>
              <span className="text-xs">JPG, PNG, HEIC — máx. 10MB</span>
            </button>
          )}
          {uploadErr && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {uploadErr}
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileChange(f);
            }}
          />
        </div>

        {submitErr && (
          <p className="text-red-500 text-xs flex items-center gap-1.5">
            <AlertCircle size={12} /> {submitErr}
          </p>
        )}
      </div>

      <div className="border-t border-[#f0e8e0] px-5 py-5 bg-white">
        <button
          onClick={onSubmit}
          disabled={!receiptUrl || uploading || submitting}
          className="w-full py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition active:scale-95 disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
          }}
        >
          {submitting ? "Enviando orden…" : "Confirmar orden"}
        </button>
      </div>
    </div>
  );
}

// ── Step: Success ─────────────────────────────────────────────
function SuccessStep({ code, total, onClose }: { code: string; total: number | null; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 h-full">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-green-100">
        <CheckCircle2 size={40} className="text-green-500" />
      </div>
      <p className="font-display text-2xl text-gray-900 mb-2">¡Orden recibida!</p>
      <div
        className="my-4 px-6 py-3 rounded-2xl text-2xl font-bold tracking-widest"
        style={{
          background: "linear-gradient(135deg,#fef7f9 0%,#fce7f3 100%)",
          color: "#e85d82",
          border: "1px solid #f9c8d8",
        }}
      >
        {code}
      </div>
      {total != null && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-4 w-full max-w-xs">
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Total confirmado</p>
          <p className="text-xl font-bold text-amber-900">RD${total.toLocaleString("es-DO")}</p>
          <p className="text-xs text-amber-600 mt-0.5">Asegúrate de que tu transferencia sea por este monto exacto.</p>
        </div>
      )}
      <p className="text-sm text-gray-600 leading-relaxed mb-8 max-w-xs">
        Tu código es <strong>{code}</strong>. Revisaremos tu comprobante y te contactaremos si necesitamos confirmar algo.
      </p>
      <button
        onClick={onClose}
        className="px-8 py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition"
        style={{
          background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
        }}
      >
        Cerrar
      </button>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────
export default function CartDrawer() {
  const { items, subtotal, setQuantity, remove, clear, isOpen, close, recentOrders, addRecentOrder, reorder } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState<InfoForm>({ name: "", phone: "" });
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [submitErr, setSubmitErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        if (step !== "success") setStep("cart");
        setForm({ name: "", phone: "" });
        setReceiptUrl("");
        setUploadErr("");
        setSubmitErr("");
        setConfirmedTotal(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, step]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  async function uploadReceipt(file: File) {
    setUploading(true);
    setUploadErr("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/cart-orders/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error al subir" }));
      setUploadErr(err.error ?? "Error al subir el comprobante.");
      return;
    }
    const { url } = await res.json();
    setReceiptUrl(url);
  }

  async function submitOrder() {
    if (!receiptUrl) { setUploadErr("Debes subir el comprobante antes de confirmar."); return; }
    setSubmitting(true);
    setSubmitErr("");
    const res = await fetch("/api/cart-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.name,
        customerPhone: form.phone,
        fulfillmentMethod: "PICKUP",
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: i.category,
        })),
        receiptImageUrl: receiptUrl,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      setSubmitErr(err.error ?? "Error al enviar la orden. Intenta de nuevo.");
      return;
    }
    const data = await res.json();
    setOrderCode(data.code);
    const confirmedTotalVal = data.total ?? null;
    setConfirmedTotal(confirmedTotalVal);
    addRecentOrder({ code: data.code, total: confirmedTotalVal ?? 0, items: [...items], createdAt: Date.now() });
    clear();
    setStep("success");
  }

  function goBack() {
    if (step === "info") setStep("cart");
    if (step === "payment") setStep("info");
  }

  const STEP_TITLES: Record<Step, string> = {
    cart: "Carrito",
    info: "Tu pedido",
    payment: "Pago",
    success: "¡Listo!",
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => { if (step !== "success") close(); }}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white flex flex-col shadow-2xl"
        style={{ animation: "cartSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0e8e0] shrink-0">
          {step !== "cart" && step !== "success" && (
            <button
              onClick={goBack}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {step === "cart" && (
            <ShoppingCart size={18} className="text-[#f07097] shrink-0" />
          )}
          <h2 className="font-display text-xl flex-1">{STEP_TITLES[step]}</h2>
          {step !== "success" && (
            <button
              onClick={close}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step indicator (solo pasos 1-3) */}
        {step !== "success" && (
          <div className="flex items-center gap-1 px-5 py-2 shrink-0">
            {(["cart", "info", "payment"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    s === step
                      ? "bg-[#f07097] w-4"
                      : ["cart", "info", "payment"].indexOf(step) > i
                      ? "bg-[#f07097]"
                      : "bg-[#ede8e0]"
                  }`}
                />
                {i < 2 && <div className="w-4 h-px bg-[#ede8e0]" />}
              </div>
            ))}
          </div>
        )}

        {/* Content (fills remaining height) */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {step === "cart" && (
            <CartStep
              items={items}
              subtotal={subtotal}
              setQuantity={setQuantity}
              remove={remove}
              onNext={() => setStep("info")}
              recentOrders={recentOrders}
              onReorder={(newItems) => { reorder(newItems); }}
            />
          )}
          {step === "info" && (
            <InfoStep form={form} setForm={setForm} onNext={() => setStep("payment")} />
          )}
          {step === "payment" && (
            <PaymentStep
              subtotal={subtotal}
              receiptUrl={receiptUrl}
              uploading={uploading}
              uploadErr={uploadErr}
              submitting={submitting}
              submitErr={submitErr}
              fileRef={fileRef}
              onFileChange={uploadReceipt}
              onSubmit={submitOrder}
            />
          )}
          {step === "success" && (
            <SuccessStep code={orderCode} total={confirmedTotal} onClose={close} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes cartSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
