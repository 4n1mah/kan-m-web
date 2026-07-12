// ─────────────────────────────────────────────────────────────
//  Tipos, constantes y helpers compartidos del calendario admin
// ─────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────
export type Order = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  eventType: string;
  eventDate: string;
  deliveryTime?: string | null;
  deliveryMethod?: string | null;
  guestCount: string;
  selectedItems?: string[];
  notes?: string;
  internalNote?: string;
  status: string;
  assignedTo?: string | null;
  agreedPrice?: number | null;
  depositAmount?: number | null;
  paymentStatus?: string | null;
  createdAt: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  role: "OWNER" | "BAKER" | "ASSISTANT" | string;
};

// ── Constants ─────────────────────────────────────────────────
export const PINK = "var(--gradient-rose)"; // gradiente de marca (globals.css)
export const PINK_SOLID = "#f07097";

export const STATUS: Record<string, { label: string; color: string; bg: string; dot: string; border: string; emoji: string }> = {
  PENDING:   { label: "Nuevo",       color: "#92400e", bg: "#fef3c7", dot: "#f59e0b", border: "#fcd34d", emoji: "🆕" },
  CONFIRMED: { label: "Activo",      color: "#065f46", bg: "#d1fae5", dot: "#10b981", border: "#6ee7b7", emoji: "✅" },
  NEEDS_INFO:{ label: "Más info",    color: "#5b21b6", bg: "#f3e8ff", dot: "#a855f7", border: "#d8b4fe", emoji: "💬" },
  COMPLETED: { label: "Listo",       color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6", border: "#93c5fd", emoji: "📦" },
  DELIVERED: { label: "Entregado",   color: "#065f46", bg: "#d1fae5", dot: "#059669", border: "#6ee7b7", emoji: "🎉" },
  REJECTED:  { label: "Rechazado",   color: "#991b1b", bg: "#fee2e2", dot: "#ef4444", border: "#fca5a5", emoji: "❌" },
  CANCELLED: { label: "Cancelado",   color: "#374151", bg: "#f3f4f6", dot: "#9ca3af", border: "#d1d5db", emoji: "🚫" },
};

export const ALL_STATUSES = ["PENDING","CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED"] as const;

// Timeline horario (compartido por Semana y Día)
export const HOUR_START = 6;   // 6 AM
export const HOUR_END   = 23;  // 11 PM (última hora visible)
export const HOUR_PX    = 44;  // alto de cada fila de hora en px
export const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

// Heat de densidad — 4 niveles fijos (legible a volúmenes de negocio pequeño)
export const HEAT_LEVELS = [
  { min: 1, max: 2, alpha: 0.06, label: "1–2" },
  { min: 3, max: 4, alpha: 0.13, label: "3–4" },
  { min: 5, max: Infinity, alpha: 0.22, label: "5+" },
] as const;

export function heatColor(count: number): string | null {
  if (count <= 0) return null;
  const lvl = HEAT_LEVELS.find(l => count >= l.min && count <= l.max) ?? HEAT_LEVELS[HEAT_LEVELS.length - 1];
  return `rgba(240, 112, 151, ${lvl.alpha})`;
}

// ── Date helpers ──────────────────────────────────────────────
export const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const todayStr = toIso(new Date());

export function fmt12h(time?: string | null) {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${m}${ampm}`;
}
export function fmtDateLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    weekday: "long", day: "numeric", month: "long",
  });
}
export function fmtDateShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "numeric", month: "short",
  });
}
export function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0,0,0,0);
  return x;
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}
export function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
export function stepCursor(d: Date, view: "month"|"week"|"day", direction: -1 | 1) {
  if (view === "month") {
    const nd = new Date(d);
    nd.setDate(1);
    nd.setMonth(nd.getMonth() + direction);
    return nd;
  }
  if (view === "week") return addDays(d, direction * 7);
  return addDays(d, direction);
}
export function fmtHourLabel(h: number) {
  if (h === 0)  return "12 am";
  if (h === 12) return "12 pm";
  return h < 12 ? `${h} am` : `${h - 12} pm`;
}
export function timeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}
export function daysToEvent(iso: string) {
  return Math.ceil(
    (new Date(iso + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
  );
}

// ── Micro-componentes compartidos ─────────────────────────────
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded border border-[#ede8e0] bg-white text-[10px] font-semibold text-gray-500 shadow-sm align-middle">
      {children}
    </kbd>
  );
}

export function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
        <span className="text-gray-400">{icon}</span> {label}
      </div>
      <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
    </div>
  );
}

export function OrderChip({ order, onClick, compact = false, active = false }: {
  order: Order; onClick: () => void; compact?: boolean; active?: boolean;
}) {
  const s = STATUS[order.status] ?? STATUS.PENDING;
  const time = order.deliveryTime ? fmt12h(order.deliveryTime) : null;
  return (
    <button onClick={onClick}
      className={`group w-full text-left rounded-md sm:rounded-lg border transition-all overflow-hidden hover:shadow-sm hover:-translate-y-px ${
        active ? "ring-2 ring-[#f07097] ring-offset-1" : ""
      }`}
      style={{ background: s.bg, borderColor: s.border }}>
      <div className="flex items-stretch">
        <div className="w-1 shrink-0" style={{ background: s.dot }}/>
        <div className={`flex-1 min-w-0 ${compact ? "px-1.5 py-1" : "px-2 py-1.5"}`}>
          <div className="flex items-center gap-1 flex-wrap">
            {time && (
              <span className={`font-mono font-semibold tabular-nums ${compact ? "text-[10px]" : "text-[11px]"}`}
                style={{ color: s.color }}>
                {time}
              </span>
            )}
            <span className={`font-semibold truncate flex-1 min-w-0 ${compact ? "text-[11px]" : "text-xs"}`}
              style={{ color: s.color }}>
              {order.name.split(" ")[0]}
            </span>
          </div>
          <div className={`truncate ${compact ? "text-[10px]" : "text-[11px]"}`} style={{ color: s.color, opacity: 0.85 }}>
            {order.eventType}
          </div>
        </div>
      </div>
    </button>
  );
}
