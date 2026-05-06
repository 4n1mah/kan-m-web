"use client";
// ─────────────────────────────────────────────────────────────
//  /admin/calendario — Vista de Calendario
//
//  • Toggle Mes / Semana / Día
//  • Hora + cliente + tipo de evento en cada celda
//  • Slide-over lateral con detalles y acciones rápidas
//  • Filtros: repostera, estado, búsqueda
//  • Stats: hoy / semana / mes
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight,
  X, Search, MessageCircle, Phone, MapPin, Clock, User as UserIcon,
  CheckCircle2, Truck, Sparkles, Package, AlertCircle,
} from "lucide-react";
import { BakersProvider, useBakers } from "@/components/BakersContext";

// ── Types ─────────────────────────────────────────────────────
type Order = {
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

type CurrentUser = { userId: string; name: string; email?: string; role: string };

// ── Constants ─────────────────────────────────────────────────
const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";
const PINK_SOLID = "#f07097";

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string; border: string; emoji: string }> = {
  PENDING:   { label: "Nuevo",       color: "#92400e", bg: "#fef3c7", dot: "#f59e0b", border: "#fcd34d", emoji: "🆕" },
  CONFIRMED: { label: "Activo",      color: "#065f46", bg: "#d1fae5", dot: "#10b981", border: "#6ee7b7", emoji: "✅" },
  NEEDS_INFO:{ label: "Más info",    color: "#5b21b6", bg: "#f3e8ff", dot: "#a855f7", border: "#d8b4fe", emoji: "💬" },
  COMPLETED: { label: "Listo",       color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6", border: "#93c5fd", emoji: "📦" },
  DELIVERED: { label: "Entregado",   color: "#065f46", bg: "#d1fae5", dot: "#059669", border: "#6ee7b7", emoji: "🎉" },
  REJECTED:  { label: "Rechazado",   color: "#991b1b", bg: "#fee2e2", dot: "#ef4444", border: "#fca5a5", emoji: "❌" },
  CANCELLED: { label: "Cancelado",   color: "#374151", bg: "#f3f4f6", dot: "#9ca3af", border: "#d1d5db", emoji: "🚫" },
};

const ALL_STATUSES = ["PENDING","CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED"] as const;

// ── Helpers ───────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayStr = toIso(new Date());

function fmt12h(time?: string | null) {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${m}${ampm}`;
}
function fmtDateLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    weekday: "long", day: "numeric", month: "long",
  });
}
function fmtDateShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "numeric", month: "short",
  });
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function stepCursor(d: Date, view: "month"|"week"|"day", direction: -1 | 1) {
  if (view === "month") {
    const nd = new Date(d);
    nd.setDate(1);
    nd.setMonth(nd.getMonth() + direction);
    return nd;
  }
  if (view === "week") return addDays(d, direction * 7);
  return addDays(d, direction);
}

// ── Component ─────────────────────────────────────────────────
export default function CalendarioPage() {
  return (
    <BakersProvider>
      <CalendarioInner />
    </BakersProvider>
  );
}

function CalendarioInner() {
  const { bakers } = useBakers();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [view, setView] = useState<"month"|"week"|"day">("month");
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bakerFilter, setBakerFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [hideCancelled, setHideCancelled] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u?.userId) setCurrentUser(u); })
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/orders", { cache: "no-store" });
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadOrders error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Re-fetch every 60s, paused when tab is hidden
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadOrders();
    }, 60_000);
    return () => clearInterval(t);
  }, [loadOrders]);

  // ── Atajos de teclado ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // No interferir con inputs / selects
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (selectedOrderId) return; // dejarle el control al panel cuando esté abierto
      switch (e.key.toLowerCase()) {
        case "m": setView("month"); break;
        case "w": setView("week");  break;
        case "d": setView("day");   break;
        case "t": {
          const today = new Date(); today.setHours(0,0,0,0);
          setCursor(today);
          break;
        }
        case "arrowleft":  setCursor(prev => stepCursor(prev, view, -1)); break;
        case "arrowright": setCursor(prev => stepCursor(prev, view, 1));  break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, selectedOrderId]);

  // ── Filtered orders ─────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => !hideCancelled || !["CANCELLED","REJECTED"].includes(o.status))
      .filter(o => bakerFilter === "ALL"
        || (bakerFilter === "UNASSIGNED" ? !o.assignedTo : o.assignedTo === bakerFilter))
      .filter(o => statusFilter === "ALL" || o.status === statusFilter)
      .filter(o => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return o.name.toLowerCase().includes(q)
          || o.eventType.toLowerCase().includes(q)
          || o.phone.toLowerCase().includes(q);
      });
  }, [orders, hideCancelled, bakerFilter, statusFilter, search]);

  // ── Group by date ───────────────────────────────────────────
  const byDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    filteredOrders.forEach(o => {
      if (!map[o.eventDate]) map[o.eventDate] = [];
      map[o.eventDate].push(o);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => {
      const ta = a.deliveryTime ?? "99:99";
      const tb = b.deliveryTime ?? "99:99";
      return ta.localeCompare(tb);
    }));
    return map;
  }, [filteredOrders]);

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = todayStr;
    const wkStart = startOfWeek(new Date());
    const wkEnd = addDays(wkStart, 6);
    const wkStartIso = toIso(wkStart);
    const wkEndIso = toIso(wkEnd);
    const monthY = cursor.getFullYear();
    const monthM = cursor.getMonth();
    const inThisMonth = (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      return d.getFullYear() === monthY && d.getMonth() === monthM;
    };
    const active = (o: Order) => !["CANCELLED","REJECTED"].includes(o.status);
    return {
      today: orders.filter(o => active(o) && o.eventDate === today).length,
      week:  orders.filter(o => active(o) && o.eventDate >= wkStartIso && o.eventDate <= wkEndIso).length,
      month: orders.filter(o => active(o) && inThisMonth(o.eventDate)).length,
      pending: orders.filter(o => o.status === "PENDING").length,
    };
  }, [orders, cursor]);

  const selectedOrder = useMemo(
    () => orders.find(o => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  // ── Quick actions ───────────────────────────────────────────
  async function patchOrder(id: string, payload: Record<string, unknown>) {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadOrders();
    } catch (e) {
      console.error("patchOrder error", e);
    }
  }

  // ── Navigation ──────────────────────────────────────────────
  function navigate(direction: -1 | 0 | 1) {
    if (direction === 0) {
      const t = new Date(); t.setHours(0,0,0,0);
      setCursor(t);
      return;
    }
    if (view === "month") {
      const d = new Date(cursor);
      d.setDate(1);
      d.setMonth(d.getMonth() + direction);
      setCursor(d);
    } else if (view === "week") {
      setCursor(addDays(cursor, direction * 7));
    } else {
      setCursor(addDays(cursor, direction));
    }
  }

  // ── Render ──────────────────────────────────────────────────
  const headerTitle = view === "month"
    ? cursor.toLocaleDateString("es-DO", { month: "long", year: "numeric" })
    : view === "week"
    ? (() => {
        const ws = startOfWeek(cursor);
        const we = addDays(ws, 6);
        return `${fmtDateShort(toIso(ws))} – ${fmtDateShort(toIso(we))}, ${we.getFullYear()}`;
      })()
    : fmtDateLong(toIso(cursor));

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/20 shadow-sm" style={{ background: PINK }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4" style={{ height: "3.75rem" }}>
          <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/15">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-white" />
            <span className="font-semibold text-sm text-white">Calendario de pedidos</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Sparkles size={16}/>}      label="Hoy"          value={stats.today}   accent={PINK_SOLID} />
          <StatCard icon={<CalendarIcon size={16}/>}  label="Esta semana"  value={stats.week}    accent="#3b82f6" />
          <StatCard icon={<Package size={16}/>}       label="Este mes"     value={stats.month}   accent="#10b981" />
          <StatCard icon={<AlertCircle size={16}/>}   label="Sin confirmar" value={stats.pending} accent="#f59e0b" />
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm p-3 flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-[#faf8f5] rounded-xl p-1 border border-[#ede8e0]">
            {(["month","week","day"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view===v ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                style={view===v ? { background: PINK } : {}}
                aria-label={v === "month" ? "Vista mes (M)" : v === "week" ? "Vista semana (W)" : "Vista día (D)"}>
                {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
              </button>
            ))}
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} aria-label="Anterior"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <ChevronLeft size={16}/>
            </button>
            <button onClick={() => navigate(0)}
              className="px-3 py-1 rounded-lg border border-[#ede8e0] text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#f07097] transition">
              Hoy
            </button>
            <button onClick={() => navigate(1)} aria-label="Siguiente"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <ChevronRight size={16}/>
            </button>
          </div>

          <MonthYearPicker cursor={cursor} setCursor={setCursor} label={headerTitle}/>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar cliente o evento…"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[#ede8e0] bg-[#faf8f5] text-xs w-44 focus:outline-none focus:border-[#f07097] focus:bg-white transition"/>
          </div>

          {/* Baker filter */}
          <select value={bakerFilter} onChange={e=>setBakerFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#ede8e0] bg-[#faf8f5] text-xs font-medium text-gray-600 focus:outline-none focus:border-[#f07097] focus:bg-white transition cursor-pointer">
            <option value="ALL">👩‍🍳 Todas</option>
            <option value="UNASSIGNED">Sin asignar</option>
            {bakers.map(b => <option key={b} value={b}>{b.split(" ")[0]}</option>)}
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#ede8e0] bg-[#faf8f5] text-xs font-medium text-gray-600 focus:outline-none focus:border-[#f07097] focus:bg-white transition cursor-pointer">
            <option value="ALL">Todos los estados</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS[s].emoji} {STATUS[s].label}</option>)}
          </select>
        </div>

        {/* ── Calendar body ── */}
        {loading ? (
          <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm p-12 text-center text-gray-400 text-sm">
            Cargando pedidos…
          </div>
        ) : view === "month" ? (
          <MonthView cursor={cursor} byDate={byDate} onPickOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onPickDay={(iso) => { const d = new Date(iso + "T00:00:00"); setCursor(d); setView("day"); }}/>
        ) : view === "week" ? (
          <WeekView cursor={cursor} byDate={byDate} onPickOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onPickDay={(iso) => { const d = new Date(iso + "T00:00:00"); setCursor(d); setView("day"); }}/>
        ) : (
          <DayView cursor={cursor} byDate={byDate} onPickOrder={setSelectedOrderId} selectedOrderId={selectedOrderId}/>
        )}

        {/* Legend */}
        <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Estados</span>
          {ALL_STATUSES.map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS[s].dot }}/>
              {STATUS[s].label}
            </div>
          ))}
          <label className="flex items-center gap-2 text-xs text-gray-500 ml-auto cursor-pointer select-none">
            <input type="checkbox" checked={hideCancelled} onChange={e=>setHideCancelled(e.target.checked)}
              className="rounded border-[#ede8e0] text-[#f07097] focus:ring-[#f07097] cursor-pointer"/>
            Ocultar cancelados / rechazados
          </label>
        </div>

        {/* Atajos de teclado (desktop) */}
        <div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-400 px-1">
          <span className="font-semibold uppercase tracking-widest text-gray-400">Atajos</span>
          <span><Kbd>M</Kbd> Mes</span>
          <span><Kbd>W</Kbd> Semana</span>
          <span><Kbd>D</Kbd> Día</span>
          <span><Kbd>T</Kbd> Hoy</span>
          <span><Kbd>←</Kbd> <Kbd>→</Kbd> Navegar</span>
          <span><Kbd>Esc</Kbd> Cerrar panel</span>
        </div>
      </div>

      {/* Slide-over detail panel */}
      <DetailPanel order={selectedOrder} onClose={() => setSelectedOrderId(null)} onPatch={patchOrder} currentUser={currentUser}/>

      {/* Animaciones globales del calendario */}
      <style jsx global>{`
        @keyframes pulseUrgent {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-gray-400 truncate">{label}</p>
        <p className="font-display text-xl leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MonthView — grid 7×6
// ──────────────────────────────────────────────────────────────
function MonthView({ cursor, byDate, onPickOrder, selectedOrderId, onPickDay }: {
  cursor: Date;
  byDate: Record<string, Order[]>;
  onPickOrder: (id: string) => void;
  selectedOrderId: string | null;
  onPickDay: (iso: string) => void;
}) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstDow = startOfMonth(y, m).getDay();
  const numDays = daysInMonth(y, m);

  type Cell = { date: Date; iso: string; inMonth: boolean };
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(y, m, -i);
    cells.push({ date: d, iso: toIso(d), inMonth: false });
  }
  for (let day = 1; day <= numDays; day++) {
    const d = new Date(y, m, day);
    cells.push({ date: d, iso: toIso(d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = addDays(last, 1);
    cells.push({ date: d, iso: toIso(d), inMonth: false });
    if (cells.length >= 42) break;
  }

  // Pico de actividad para el "heat" sutil
  const maxOrdersInMonth = Math.max(
    1,
    ...cells.filter(c => c.inMonth).map(c => (byDate[c.iso] ?? []).length)
  );

  return (
    <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#ede8e0] bg-[#faf8f5]">
        {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {cells.map((cell, idx) => {
          const dayOrders = byDate[cell.iso] ?? [];
          const isToday = cell.iso === todayStr;
          const isPast = cell.iso < todayStr;
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          const visible = dayOrders.slice(0, 3);
          const hidden = dayOrders.length - visible.length;

          // Heat: tint rosa muy sutil proporcional al volumen del día
          const heatStrength = cell.inMonth && dayOrders.length > 0
            ? Math.min(0.18, (dayOrders.length / maxOrdersInMonth) * 0.18)
            : 0;
          const heatBg = heatStrength > 0
            ? `rgba(240, 112, 151, ${heatStrength.toFixed(3)})`
            : null;

          // ¿Urgente? algún pedido del día con evento ≤2 días y aún en curso
          const hasUrgent = dayOrders.some(o => {
            if (["DELIVERED","CANCELLED","REJECTED"].includes(o.status)) return false;
            const diff = Math.ceil(
              (new Date(o.eventDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
            );
            return diff >= 0 && diff <= 2;
          });

          return (
            <div key={idx}
              onClick={(e) => {
                // Solo si clic fue en el espacio vacío de la celda, no en un chip
                if ((e.target as HTMLElement).closest("button")) return;
                if (cell.inMonth) onPickDay(cell.iso);
              }}
              className={`group min-h-[112px] sm:min-h-[120px] border-r border-b border-[#f0e8e0] p-1.5 sm:p-2 flex flex-col gap-1 transition cursor-pointer relative ${
                cell.inMonth ? (isWeekend ? "bg-[#fdfcfa]" : "bg-white") : "bg-[#faf8f5]"
              } ${isToday ? "ring-2 ring-inset ring-[#f07097]" : ""} ${isPast && cell.inMonth ? "opacity-95" : ""} hover:bg-[#fef7f9]/60`}
              style={heatBg ? { backgroundColor: heatBg } : {}}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "text-white shadow-sm" : cell.inMonth ? "text-gray-700" : "text-gray-300"
                }`} style={isToday ? { background: PINK_SOLID } : {}}>
                  {cell.date.getDate()}
                </span>
                {dayOrders.length > 0 && (
                  <span className={`text-[10px] font-medium ${hasUrgent ? "text-[#f07097]" : "text-gray-400"}`}>
                    {hasUrgent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f07097] mr-1 align-middle animate-[pulseUrgent_1.4s_ease-in-out_infinite]"/>}
                    {dayOrders.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {visible.map(o => (
                  <OrderChip key={o.id} order={o} compact onClick={() => onPickOrder(o.id)} active={o.id === selectedOrderId}/>
                ))}
                {hidden > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); onPickDay(cell.iso); }}
                    className="text-[10px] text-gray-500 hover:text-[#f07097] font-semibold pl-1 text-left transition">
                    +{hidden} más →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Configuración del timeline horario (compartido por Semana y Día)
// ──────────────────────────────────────────────────────────────
const HOUR_START = 6;   // 6 AM
const HOUR_END   = 23;  // 11 PM (última hora visible)
const HOUR_PX    = 44;  // alto de cada fila de hora en px
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function fmtHourLabel(h: number) {
  if (h === 0)  return "12 am";
  if (h === 12) return "12 pm";
  return h < 12 ? `${h} am` : `${h - 12} pm`;
}
function timeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// ──────────────────────────────────────────────────────────────
// WeekView — 7 columnas con timeline horario vertical
// ──────────────────────────────────────────────────────────────
function WeekView({ cursor, byDate, onPickOrder, selectedOrderId, onPickDay }: {
  cursor: Date;
  byDate: Record<string, Order[]>;
  onPickOrder: (id: string) => void;
  selectedOrderId: string | null;
  onPickDay: (iso: string) => void;
}) {
  const ws = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(ws, i);
    return { date: d, iso: toIso(d) };
  });
  const totalGridHeight = HOURS.length * HOUR_PX;

  // Línea de "ahora" si la semana incluye hoy
  const now = new Date();
  const todayInWeek = days.some(d => d.iso === todayStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffsetPx = ((nowMinutes / 60) - HOUR_START) * HOUR_PX;
  const nowVisible = todayInWeek && nowMinutes >= HOUR_START * 60 && nowMinutes <= (HOUR_END + 1) * 60;

  return (
    <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm overflow-hidden">
      {/* Top header con días */}
      <div className="grid border-b border-[#ede8e0] bg-[#faf8f5]" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        <div/>
        {days.map(d => {
          const isToday = d.iso === todayStr;
          return (
            <button key={d.iso}
              onClick={() => onPickDay(d.iso)}
              className={`py-3 text-center border-l border-[#f0e8e0] transition hover:bg-[#fef7f9] ${isToday ? "bg-[#fef7f9]" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                {d.date.toLocaleDateString("es-DO", { weekday: "short" })}
              </div>
              <div className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                isToday ? "text-white shadow-sm" : "text-gray-700"
              }`} style={isToday ? { background: PINK_SOLID } : {}}>
                {d.date.getDate()}
              </div>
              {(byDate[d.iso]?.length ?? 0) > 0 && (
                <div className="text-[10px] text-gray-400 mt-0.5">{byDate[d.iso]!.length} pedido{byDate[d.iso]!.length === 1 ? "" : "s"}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Banda "Sin hora" arriba del timeline */}
      {(() => {
        const noTimeAcrossWeek = days.map(d => ({
          iso: d.iso,
          orders: (byDate[d.iso] ?? []).filter(o => !o.deliveryTime),
        }));
        const anyNoTime = noTimeAcrossWeek.some(d => d.orders.length > 0);
        if (!anyNoTime) return null;
        return (
          <div className="grid border-b border-[#ede8e0] bg-[#fefcf7]" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-2 py-2 text-right border-r border-[#f0e8e0]">
              Sin hora
            </div>
            {noTimeAcrossWeek.map(({ iso, orders }) => (
              <div key={iso} className="px-1 py-1.5 border-l border-[#f0e8e0] flex flex-col gap-1 min-h-[34px]">
                {orders.map(o => (
                  <OrderChip key={o.id} order={o} compact onClick={() => onPickOrder(o.id)} active={o.id === selectedOrderId}/>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Timeline grid */}
      <div className="relative grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", height: totalGridHeight }}>
        {/* Columna de horas */}
        <div className="border-r border-[#f0e8e0] bg-[#faf8f5]/50 relative">
          {HOURS.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 px-2 text-right" style={{ top: i * HOUR_PX, height: HOUR_PX }}>
              <span className="text-[10px] font-medium text-gray-400 tabular-nums">{fmtHourLabel(h)}</span>
            </div>
          ))}
        </div>

        {/* Columnas de días con eventos */}
        {days.map(d => {
          const dayOrders = (byDate[d.iso] ?? []).filter(o => !!o.deliveryTime);
          const isToday = d.iso === todayStr;
          return (
            <div key={d.iso} className={`relative border-l border-[#f0e8e0] ${isToday ? "bg-[#fef7f9]/30" : ""}`}>
              {/* Líneas horarias */}
              {HOURS.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 border-t border-[#f5efe7]" style={{ top: i * HOUR_PX }}/>
              ))}

              {/* Línea de "ahora" */}
              {isToday && nowVisible && (
                <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffsetPx }}>
                  <div className="relative">
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full" style={{ background: PINK_SOLID, boxShadow: "0 0 0 3px #fef7f9" }}/>
                    <div className="border-t-2" style={{ borderColor: PINK_SOLID }}/>
                  </div>
                </div>
              )}

              {/* Eventos */}
              {dayOrders.map(o => {
                const min = timeToMinutes(o.deliveryTime)!;
                const top = ((min / 60) - HOUR_START) * HOUR_PX;
                if (top < 0 || top > totalGridHeight) return null;
                return (
                  <div key={o.id} className="absolute left-1 right-1" style={{ top, minHeight: HOUR_PX - 4 }}>
                    <OrderChip order={o} onClick={() => onPickOrder(o.id)} active={o.id === selectedOrderId}/>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DayView — timeline de un solo día con horas a la izquierda
// ──────────────────────────────────────────────────────────────
function DayView({ cursor, byDate, onPickOrder, selectedOrderId }: {
  cursor: Date;
  byDate: Record<string, Order[]>;
  onPickOrder: (id: string) => void;
  selectedOrderId: string | null;
}) {
  const iso = toIso(cursor);
  const allDayOrders = byDate[iso] ?? [];
  const isToday = iso === todayStr;
  const totalGridHeight = HOURS.length * HOUR_PX;

  const timed = allDayOrders.filter(o => !!o.deliveryTime);
  const untimed = allDayOrders.filter(o => !o.deliveryTime);

  // Posiciones con detección de overlaps para que se rendericen lado a lado
  const positioned = timed.map(o => {
    const min = timeToMinutes(o.deliveryTime)!;
    const top = ((min / 60) - HOUR_START) * HOUR_PX;
    return { order: o, top, minutes: min, lane: 0 };
  }).sort((a, b) => a.minutes - b.minutes);

  // Asignación simple de "lanes" para overlaps (cada pedido ocupa ~75 min visualmente)
  const VISUAL_DURATION = 75;
  positioned.forEach((p, i) => {
    let lane = 0;
    while (true) {
      const conflict = positioned.slice(0, i).some(other =>
        other.lane === lane && Math.abs(p.minutes - other.minutes) < VISUAL_DURATION
      );
      if (!conflict) break;
      lane++;
    }
    p.lane = lane;
  });
  const maxLane = positioned.reduce((m, p) => Math.max(m, p.lane), 0);
  const totalLanes = maxLane + 1;

  // Línea de ahora
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffsetPx = ((nowMinutes / 60) - HOUR_START) * HOUR_PX;
  const nowVisible = isToday && nowMinutes >= HOUR_START * 60 && nowMinutes <= (HOUR_END + 1) * 60;

  return (
    <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm overflow-hidden">
      {/* Day header */}
      <div className={`px-5 py-4 border-b border-[#ede8e0] flex items-center justify-between gap-4 ${isToday ? "bg-[#fef7f9]" : "bg-[#faf8f5]"}`}>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
            {isToday ? "Hoy" : cursor.toLocaleDateString("es-DO", { weekday: "long" })}
          </p>
          <h3 className="font-display text-xl capitalize mt-0.5">
            {cursor.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Pedidos</p>
          <p className="font-display text-2xl" style={{ color: PINK_SOLID }}>{allDayOrders.length}</p>
        </div>
      </div>

      {allDayOrders.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <CalendarIcon size={36} className="mx-auto text-gray-200" />
          <p className="text-sm text-gray-400 mt-3">No hay pedidos para este día</p>
        </div>
      ) : (
        <>
          {/* Banda de pedidos sin hora */}
          {untimed.length > 0 && (
            <div className="border-b border-[#ede8e0] bg-[#fefcf7] px-5 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
                Sin hora confirmada · {untimed.length}
              </p>
              <div className="flex flex-col gap-2">
                {untimed.map(o => (
                  <DayRow key={o.id} order={o} active={o.id === selectedOrderId} onClick={() => onPickOrder(o.id)}/>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="grid" style={{ gridTemplateColumns: "70px 1fr" }}>
            {/* Columna de horas */}
            <div className="border-r border-[#f0e8e0] bg-[#faf8f5]/50 relative" style={{ height: totalGridHeight }}>
              {HOURS.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 px-3 text-right" style={{ top: i * HOUR_PX }}>
                  <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{fmtHourLabel(h)}</span>
                </div>
              ))}
            </div>

            {/* Lienzo del día */}
            <div className="relative" style={{ height: totalGridHeight }}>
              {/* Líneas horarias */}
              {HOURS.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 border-t border-[#f5efe7]" style={{ top: i * HOUR_PX }}>
                  {/* Marcadores de media hora */}
                  <div className="absolute left-0 right-0 border-t border-dashed border-[#faf6ef]" style={{ top: HOUR_PX / 2 }}/>
                </div>
              ))}

              {/* Línea de "ahora" */}
              {nowVisible && (
                <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffsetPx }}>
                  <div className="relative">
                    <div className="absolute -left-2 -top-2 w-4 h-4 rounded-full" style={{ background: PINK_SOLID, boxShadow: "0 0 0 4px #fef7f9" }}/>
                    <div className="border-t-2" style={{ borderColor: PINK_SOLID }}/>
                    <div className="absolute right-2 -top-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: PINK_SOLID, color: "white" }}>
                      {now.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" }).toLowerCase()}
                    </div>
                  </div>
                </div>
              )}

              {/* Eventos posicionados */}
              {positioned.map(({ order, top, lane }) => {
                if (top < 0 || top > totalGridHeight) return null;
                const widthPct = 100 / totalLanes;
                return (
                  <div key={order.id} className="absolute"
                    style={{
                      top,
                      left: `calc(${lane * widthPct}% + 8px)`,
                      width: `calc(${widthPct}% - 16px)`,
                    }}>
                    <DayEventCard order={order} active={order.id === selectedOrderId} onClick={() => onPickOrder(order.id)}/>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DayEventCard — tarjeta posicionada absolutamente en el timeline
// ──────────────────────────────────────────────────────────────
function DayEventCard({ order, active, onClick }: { order: Order; active: boolean; onClick: () => void }) {
  const s = STATUS[order.status] ?? STATUS.PENDING;
  const time = order.deliveryTime ? fmt12h(order.deliveryTime) : "—";
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all overflow-hidden hover:shadow-md hover:-translate-y-px ${
        active ? "ring-2 ring-[#f07097] ring-offset-1 shadow-md" : "shadow-sm"
      }`}
      style={{ background: s.bg, borderColor: s.border }}>
      <div className="flex items-stretch">
        <div className="w-1 shrink-0" style={{ background: s.dot }}/>
        <div className="flex-1 min-w-0 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold tabular-nums text-[11px] shrink-0" style={{ color: s.color }}>{time}</span>
            <span className="font-semibold text-xs truncate" style={{ color: s.color }}>{order.name}</span>
          </div>
          <p className="text-[11px] truncate capitalize" style={{ color: s.color, opacity: 0.85 }}>
            {order.eventType}
          </p>
        </div>
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// DayRow — fila ancha (usado en banda "Sin hora")
// ──────────────────────────────────────────────────────────────
function DayRow({ order, active, onClick }: { order: Order; active: boolean; onClick: () => void }) {
  const s = STATUS[order.status] ?? STATUS.PENDING;
  const time = order.deliveryTime ? fmt12h(order.deliveryTime) : "—";
  const items = Array.isArray(order.selectedItems) ? order.selectedItems : [];
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all overflow-hidden hover:shadow-sm hover:-translate-y-px ${
        active ? "ring-2 ring-[#f07097] ring-offset-1" : ""
      }`}
      style={{ background: s.bg, borderColor: s.border }}>
      <div className="flex items-stretch">
        <div className="w-1.5 shrink-0" style={{ background: s.dot }}/>
        <div className="flex-1 min-w-0 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono font-bold tabular-nums text-sm shrink-0" style={{ color: s.color }}>{time}</span>
            <span className="font-semibold text-sm truncate" style={{ color: s.color }}>{order.name}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60" style={{ color: s.color }}>
              {s.emoji} {s.label}
            </span>
            {order.assignedTo && (
              <span className="text-[10px] text-gray-600 ml-auto bg-white/60 px-2 py-0.5 rounded-full">
                👩‍🍳 {order.assignedTo.split(" ")[0]}
              </span>
            )}
          </div>
          <p className="text-xs mt-1 capitalize" style={{ color: s.color, opacity: 0.85 }}>
            {order.eventType} · {order.guestCount} invitado{order.guestCount === "1" ? "" : "s"}
            {order.deliveryMethod ? ` · ${order.deliveryMethod === "delivery" ? "Delivery" : "Recogida"}` : ""}
          </p>
          {items.length > 0 && (
            <p className="text-[11px] mt-1.5 truncate" style={{ color: s.color, opacity: 0.75 }}>
              {items.slice(0, 4).join(" · ")}{items.length > 4 ? ` · +${items.length - 4}` : ""}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// OrderChip
// ──────────────────────────────────────────────────────────────
function OrderChip({ order, onClick, compact = false, active = false }: {
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

// ──────────────────────────────────────────────────────────────
// DetailPanel — slide-over con info + acciones rápidas
// ──────────────────────────────────────────────────────────────
function DetailPanel({ order, onClose, onPatch, currentUser }: {
  order: Order | null; onClose: () => void; onPatch: (id: string, payload: Record<string, unknown>) => Promise<void>;
  currentUser: CurrentUser | null;
}) {
  const { bakers, teamMembers } = useBakers();
  const isAssistant = currentUser?.role === "ASSISTANT";

  // Compute who this user can assign orders to
  const assignableNames: string[] = isAssistant
    ? []
    : currentUser?.role === "BAKER"
    ? [
        currentUser.name,
        ...teamMembers.filter(m => m.role === "ASSISTANT").map(m => m.name),
      ]
    : teamMembers.map(m => m.name); // OWNER sees everyone
  useEffect(() => {
    if (!order) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const s = STATUS[order.status] ?? STATUS.PENDING;
  const time = order.deliveryTime ? fmt12h(order.deliveryTime) : null;
  const isPending = order.status === "PENDING";
  const isActive = order.status === "CONFIRMED" || order.status === "NEEDS_INFO";
  const isCompleted = order.status === "COMPLETED";
  const baker = order.assignedTo || "Kan M";

  // WhatsApp message templates (igual a las del dashboard)
  const detalles = `*${order.eventType}* el *${order.eventDate}*${time ? ` a las ${time}` : ""}`;
  const intro = `Hola ${order.name}! Te habla ${baker} de Kan M Repostería y Catering 🎂. Te escribo referente al pedido que solicitaste desde nuestra página: ${detalles}.`;
  let waBody: string;
  if (order.status === "COMPLETED")       waBody = `${intro} ¿Nos puedes confirmar que toda la información está correcta?`;
  else if (order.status === "NEEDS_INFO") waBody = `${intro} Necesitaría más información para poder empezar a trabajar con su pedido, ¿tiene disponibilidad ahora?`;
  else if (order.status === "REJECTED")   waBody = `${intro} Por el momento no trabajamos con este producto.`;
  else                                    waBody = `Hola ${order.name} 👋, somos Kan M. Sobre tu cotización para ${detalles}: `;
  const waHref = `https://wa.me/${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(waBody)}`;

  const items = Array.isArray(order.selectedItems) ? order.selectedItems : [];

  // ¿Cuán urgente es?
  const stillOpen = !["DELIVERED","CANCELLED","REJECTED"].includes(order.status);
  const daysToEvent = Math.ceil(
    (new Date(order.eventDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
  );
  let urgencyLabel: string | null = null;
  if (stillOpen) {
    if (daysToEvent < 0)        urgencyLabel = `Atrasado · hace ${Math.abs(daysToEvent)} día${Math.abs(daysToEvent) === 1 ? "" : "s"}`;
    else if (daysToEvent === 0) urgencyLabel = "¡Hoy es el evento!";
    else if (daysToEvent === 1) urgencyLabel = "Mañana es el evento";
    else if (daysToEvent <= 2)  urgencyLabel = `Faltan ${daysToEvent} días`;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" onClick={onClose}/>

      <aside className="relative w-full sm:max-w-md bg-white shadow-2xl flex flex-col animate-[slideInRight_.25s_cubic-bezier(.2,.8,.2,1)] overflow-hidden"
        role="dialog" aria-modal="true">
        <div className="px-5 pt-5 pb-4 border-b border-[#ede8e0]" style={{ background: `linear-gradient(180deg, ${s.bg} 0%, transparent 100%)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2"
                style={{ background: "white", color: s.color, border: `1px solid ${s.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }}/>
                {s.emoji} {s.label}
              </div>
              <h3 className="font-display text-xl leading-tight truncate">{order.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{order.eventType}</p>
              {urgencyLabel && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ background: "#fff4e6", color: "#9a3412", borderColor: "#fed7aa" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-[pulseUrgent_1.4s_ease-in-out_infinite]"/>
                  {urgencyLabel}
                </div>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-sm flex items-center justify-center transition shrink-0"
              aria-label="Cerrar">
              <X size={16}/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={<CalendarIcon size={14}/>} label="Fecha del evento" value={fmtDateLong(order.eventDate)}/>
            {time && <MetaItem icon={<Clock size={14}/>} label="Hora" value={time}/>}
            <MetaItem icon={<UserIcon size={14}/>} label="Invitados" value={String(order.guestCount)}/>
            {order.deliveryMethod && (
              <MetaItem icon={<MapPin size={14}/>} label="Entrega"
                value={order.deliveryMethod === "delivery" ? "Delivery / Envío" : "Recogida en tienda"}/>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Contacto</p>
            <a href={`tel:${order.phone}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#f07097] transition py-1">
              <Phone size={14} className="text-gray-400"/> {order.phone}
            </a>
            {order.email && (
              <p className="text-sm text-gray-500 break-all">{order.email}</p>
            )}
          </div>

          {items.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Productos solicitados</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#faf8f5] border border-[#ede8e0] text-gray-700">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          )}

          {order.notes && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Notas del cliente</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-[#faf8f5] border border-[#ede8e0] rounded-xl p-3">
                {order.notes}
              </p>
            </div>
          )}

          {order.internalNote && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Nota interna</p>
              <p className="text-sm text-amber-900 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-3">
                {order.internalNote}
              </p>
            </div>
          )}

          {/* Repostera */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Repostera</p>
            {order.assignedTo ? (
              <div className="flex items-center justify-between gap-2 bg-[#faf8f5] border border-[#ede8e0] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: PINK }}>
                    {order.assignedTo.split(" ").map(s => s[0]).join("")}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{order.assignedTo}</span>
                </div>
                {!isAssistant && (
                  <div className="flex items-center gap-1">
                    {assignableNames.filter(b => b !== order.assignedTo).map(b => (
                      <button key={b} onClick={() => onPatch(order.id, { assignedTo: b })}
                        title={`Reasignar a ${b}`}
                        className="text-[10px] px-2 py-1 rounded-lg text-gray-500 hover:text-[#f07097] hover:bg-white transition">
                        ↪ {b.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : isAssistant ? (
              <p className="text-sm text-gray-400 italic px-1">Sin asignar</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {assignableNames.map(b => (
                  <button key={b} onClick={() => onPatch(order.id, { assignedTo: b })}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-[#ede8e0] text-xs font-medium text-gray-500 hover:text-[#f07097] hover:border-[#f07097] hover:bg-[#fef7f9] transition">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: PINK }}>
                      {b.split(" ").map(s => s[0]).join("")}
                    </span>
                    {b.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(order.agreedPrice || order.depositAmount) && (
            <div className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] p-3 space-y-1.5">
              {order.agreedPrice != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio acordado</span>
                  <span className="font-semibold tabular-nums">RD$ {Number(order.agreedPrice).toLocaleString("es-DO")}</span>
                </div>
              )}
              {order.depositAmount != null && order.depositAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Depositado</span>
                  <span className="font-semibold tabular-nums text-emerald-700">RD$ {Number(order.depositAmount).toLocaleString("es-DO")}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#ede8e0] bg-white p-4 space-y-2">
          {isPending && !isAssistant && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => onPatch(order.id, { status: "CONFIRMED", changedBy: order.assignedTo ?? "Admin" })}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                <CheckCircle2 size={15}/> Aceptar
              </button>
              <button onClick={() => onPatch(order.id, { status: "NEEDS_INFO", changedBy: order.assignedTo ?? "Admin" })}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-semibold text-xs hover:opacity-90 transition"
                style={{ background: "#f3e8ff", color: "#5b21b6" }}>
                <MessageCircle size={15}/> Más info
              </button>
              <button onClick={() => onPatch(order.id, { status: "REJECTED", changedBy: order.assignedTo ?? "Admin" })}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-semibold text-xs hover:opacity-90 transition"
                style={{ background: "#fecaca", color: "#991b1b" }}>
                <X size={15}/> Rechazar
              </button>
            </div>
          )}
          {isActive && !isAssistant && (
            <button onClick={() => onPatch(order.id, { status: "COMPLETED", changedBy: order.assignedTo ?? "Admin" })}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
              <CheckCircle2 size={15}/> Marcar listo
            </button>
          )}
          {isCompleted && !isAssistant && (
            <button onClick={() => onPatch(order.id, { status: "DELIVERED", changedBy: order.assignedTo ?? "Admin" })}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
              <Truck size={15}/> Marcar entregado
            </button>
          )}
          <div className="flex gap-2">
            <a href={waHref} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
              style={{ background: "#bbf7d0", color: "#065f46" }}>
              <MessageCircle size={14}/> WhatsApp
            </a>
            <Link href="/admin/dashboard"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-[#ede8e0] hover:bg-gray-50 transition">
              Ver completo
            </Link>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MonthYearPicker — botón que abre un panel para saltar a cualquier mes/año
// ──────────────────────────────────────────────────────────────
function MonthYearPicker({ cursor, setCursor, label }: {
  cursor: Date; setCursor: (d: Date) => void; label: string;
}) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(cursor.getFullYear());

  // Cerrar con click afuera
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-myp]")) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setPickerYear(cursor.getFullYear());
  }, [open, cursor]);

  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const todayY = new Date().getFullYear();
  const todayM = new Date().getMonth();

  return (
    <div className="relative ml-1 mr-auto" data-myp>
      <button onClick={() => setOpen(o => !o)}
        className="font-display text-base sm:text-lg capitalize px-2 py-1 rounded-lg hover:bg-[#fef7f9] transition flex items-center gap-1.5 text-gray-800">
        {label}
        <ChevronRight size={14} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}/>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 bg-white rounded-2xl border border-[#ede8e0] shadow-lg p-3 w-72 animate-[fadeIn_.12s_ease-out]">
          {/* Year header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setPickerYear(y => y - 1)} aria-label="Año anterior"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <ChevronLeft size={15}/>
            </button>
            <span className="font-display text-lg font-semibold tabular-nums">{pickerYear}</span>
            <button onClick={() => setPickerYear(y => y + 1)} aria-label="Año siguiente"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <ChevronRight size={15}/>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {months.map((m, idx) => {
              const isCurrent = pickerYear === cursor.getFullYear() && idx === cursor.getMonth();
              const isToday = pickerYear === todayY && idx === todayM;
              return (
                <button key={m} onClick={() => {
                    const d = new Date(pickerYear, idx, 1);
                    setCursor(d);
                    setOpen(false);
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition ${
                    isCurrent ? "text-white shadow-sm"
                    : isToday ? "text-[#f07097] bg-[#fef7f9] border border-[#f07097]/40"
                    : "text-gray-600 hover:bg-[#fef7f9]"
                  }`}
                  style={isCurrent ? { background: PINK_SOLID } : {}}>
                  {m}
                </button>
              );
            })}
          </div>

          {/* Quick links */}
          <div className="mt-3 pt-3 border-t border-[#ede8e0] flex justify-between items-center text-[11px]">
            <button onClick={() => {
                const d = new Date(); d.setHours(0,0,0,0);
                setCursor(d); setOpen(false);
              }}
              className="text-[#f07097] font-semibold hover:underline">
              Ir a hoy
            </button>
            <span className="text-gray-400">Año actual: {todayY}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Kbd — pequeña tecla decorativa para atajos
// ──────────────────────────────────────────────────────────────
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded border border-[#ede8e0] bg-white text-[10px] font-semibold text-gray-500 shadow-sm align-middle">
      {children}
    </kbd>
  );
}

// ──────────────────────────────────────────────────────────────
// MetaItem
// ──────────────────────────────────────────────────────────────
function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
        <span className="text-gray-400">{icon}</span> {label}
      </div>
      <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
    </div>
  );
}
