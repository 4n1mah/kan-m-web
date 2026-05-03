"use client";
// ─────────────────────────────────────────────────────────────
//  /admin/calendario — Vista de Calendario
//
//  • Toggle Mes / Semana
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

// ── Constants ─────────────────────────────────────────────────
const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";
const PINK_SOLID = "#f07097";
const BAKERS = ["Karolyn Sierra", "Astrid Sierra"] as const;

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month"|"week"|"day">("month");
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bakerFilter, setBakerFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [hideCancelled, setHideCancelled] = useState(true);

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

          <h2 className="font-display text-base sm:text-lg capitalize ml-1 mr-auto">{headerTitle}</h2>

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
            {BAKERS.map(b => <option key={b} value={b}>{b.split(" ")[0]}</option>)}
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
      <DetailPanel order={selectedOrder} onClose={() => setSelectedOrderId(null)} onPatch={patchOrder}/>

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
// WeekView — 7 columnas, lista cronológica por día
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

  return (
    <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#ede8e0] bg-[#faf8f5]">
        {days.map(d => {
          const isToday = d.iso === todayStr;
          return (
            <button key={d.iso}
              onClick={() => onPickDay(d.iso)}
              className={`py-3 text-center border-r border-[#f0e8e0] last:border-r-0 transition hover:bg-[#fef7f9] ${isToday ? "bg-[#fef7f9]" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                {d.date.toLocaleDateString("es-DO", { weekday: "short" })}
              </div>
              <div className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                isToday ? "text-white shadow-sm" : "text-gray-700"
              }`} style={isToday ? { background: PINK_SOLID } : {}}>
                {d.date.getDate()}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-[480px]">
        {days.map(d => {
          const dayOrders = byDate[d.iso] ?? [];
          const isToday = d.iso === todayStr;
          return (
            <div key={d.iso} className={`border-r border-[#f0e8e0] last:border-r-0 p-2 flex flex-col gap-1.5 ${isToday ? "bg-[#fef7f9]/40" : ""}`}>
              {dayOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[100px]">
                  <span className="text-[10px] text-gray-300">—</span>
                </div>
              ) : (
                dayOrders.map(o => (
                  <OrderChip key={o.id} order={o} onClick={() => onPickOrder(o.id)} active={o.id === selectedOrderId}/>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DayView — timeline vertical por horas, ideal para días con varios pedidos
// ──────────────────────────────────────────────────────────────
function DayView({ cursor, byDate, onPickOrder, selectedOrderId }: {
  cursor: Date;
  byDate: Record<string, Order[]>;
  onPickOrder: (id: string) => void;
  selectedOrderId: string | null;
}) {
  const iso = toIso(cursor);
  const dayOrders = byDate[iso] ?? [];
  const isToday = iso === todayStr;

  // Agrupar por franja horaria (mañana / tarde / noche / sin hora)
  type Bucket = { id: string; label: string; range: string; orders: Order[] };
  const buckets: Bucket[] = [
    { id: "morning",   label: "Mañana",   range: "6:00 am – 12:00 pm", orders: [] },
    { id: "afternoon", label: "Tarde",    range: "12:00 pm – 6:00 pm", orders: [] },
    { id: "evening",   label: "Noche",    range: "6:00 pm – 12:00 am", orders: [] },
    { id: "anytime",   label: "Sin hora", range: "Por confirmar",       orders: [] },
  ];
  for (const o of dayOrders) {
    const t = o.deliveryTime ?? "";
    if (!t) { buckets[3].orders.push(o); continue; }
    const h = parseInt(t.split(":")[0], 10);
    if (h < 12)      buckets[0].orders.push(o);
    else if (h < 18) buckets[1].orders.push(o);
    else             buckets[2].orders.push(o);
  }

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
          <p className="font-display text-2xl" style={{ color: PINK_SOLID }}>{dayOrders.length}</p>
        </div>
      </div>

      {dayOrders.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <CalendarIcon size={36} className="mx-auto text-gray-200" />
          <p className="text-sm text-gray-400 mt-3">No hay pedidos para este día</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f0e8e0]">
          {buckets.filter(b => b.orders.length > 0).map(b => (
            <div key={b.id} className="px-5 py-4">
              <div className="flex items-baseline gap-3 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-700">{b.label}</h4>
                <span className="text-[10px] text-gray-400">{b.range}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{b.orders.length} pedido{b.orders.length === 1 ? "" : "s"}</span>
              </div>
              <div className="space-y-2">
                {b.orders.map(o => (
                  <DayRow key={o.id} order={o} active={o.id === selectedOrderId} onClick={() => onPickOrder(o.id)}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DayRow — fila ancha con info expandida para vista Día
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
function DetailPanel({ order, onClose, onPatch }: {
  order: Order | null; onClose: () => void; onPatch: (id: string, payload: Record<string, unknown>) => Promise<void>;
}) {
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
                <div className="flex items-center gap-1">
                  {BAKERS.filter(b => b !== order.assignedTo).map(b => (
                    <button key={b} onClick={() => onPatch(order.id, { assignedTo: b })}
                      title={`Reasignar a ${b}`}
                      className="text-[10px] px-2 py-1 rounded-lg text-gray-500 hover:text-[#f07097] hover:bg-white transition">
                      ↪ {b.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {BAKERS.map(b => (
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
          {isPending && (
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
          {isActive && (
            <button onClick={() => onPatch(order.id, { status: "COMPLETED", changedBy: order.assignedTo ?? "Admin" })}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
              <CheckCircle2 size={15}/> Marcar listo
            </button>
          )}
          {isCompleted && (
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
