"use client";
// ─────────────────────────────────────────────────────────────
//  /admin/calendario — Vista de Calendario (rediseño)
//
//  • Toggle Mes / Semana / Día con indicador deslizante
//  • Chips de filtro: estado, repostera, entrega + búsqueda
//  • Click en día (vista mes) → panel del día con acciones rápidas
//  • Heat de densidad de 4 niveles con leyenda
//  • Atajos: M / W / D / T / ← / → / Esc
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight,
  Search, Sparkles, Package, AlertCircle, EyeOff,
} from "lucide-react";
import { BakersProvider, useBakers } from "@/components/BakersContext";
import {
  type Order, type CurrentUser, STATUS, ALL_STATUSES, PINK, PINK_SOLID,
  toIso, todayStr, fmtDateShort, fmtDateLong, startOfWeek, addDays, stepCursor,
  HEAT_LEVELS, Kbd,
} from "./calendarShared";
import { MonthView, WeekView, DayView } from "./CalendarViews";
import DayPanel from "./DayPanel";
import OrderPanel from "./OrderPanel";

export default function CalendarioPage() {
  return (
    <BakersProvider>
      <CalendarioInner />
    </BakersProvider>
  );
}

const VIEWS = ["month", "week", "day"] as const;
type ViewId = typeof VIEWS[number];
const VIEW_LABEL: Record<ViewId, string> = { month: "Mes", week: "Semana", day: "Día" };

function CalendarioInner() {
  const { bakers } = useBakers();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [view, setView] = useState<ViewId>("month");
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bakerFilter, setBakerFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deliveryFilter, setDeliveryFilter] = useState<"ALL"|"pickup"|"delivery">("ALL");
  const [hideCancelled, setHideCancelled] = useState(true);
  const [showFilters, setShowFilters] = useState(false); // disclosure móvil

  useEffect(() => {
    // /api/auth/me devuelve { user: { id, name, email, role } }
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setCurrentUser(data.user); })
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
      if (selectedOrderId || selectedDay) return; // los paneles manejan Esc
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
  }, [view, selectedOrderId, selectedDay]);

  // ── Filtered orders ─────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => !hideCancelled || !["CANCELLED","REJECTED"].includes(o.status))
      .filter(o => bakerFilter === "ALL"
        || (bakerFilter === "UNASSIGNED" ? !o.assignedTo : o.assignedTo === bakerFilter))
      .filter(o => statusFilter === "ALL" || o.status === statusFilter)
      .filter(o => deliveryFilter === "ALL" || o.deliveryMethod === deliveryFilter)
      .filter(o => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return o.name.toLowerCase().includes(q)
          || o.eventType.toLowerCase().includes(q)
          || o.phone.toLowerCase().includes(q);
      });
  }, [orders, hideCancelled, bakerFilter, statusFilter, deliveryFilter, search]);

  const activeFilterCount =
    (bakerFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0) +
    (deliveryFilter !== "ALL" ? 1 : 0) + (search.trim() ? 1 : 0);

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
    setCursor(stepCursor(cursor, view, direction));
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

  const chipBase = "px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none";
  const chipOff = "chip-glass text-gray-600 hover:text-[#f07097] hover:!border-[#f07097]/40";

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      {/* ── Header ── */}
      <header className="admin-header-glass sticky top-0 z-40 border-b border-white/20 shadow-sm">
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
          <StatCard icon={<Sparkles size={16}/>}      label="Hoy"           value={stats.today}   gradient />
          <StatCard icon={<CalendarIcon size={16}/>}  label="Esta semana"   value={stats.week}    accent="#3b82f6" />
          <StatCard icon={<Package size={16}/>}       label="Este mes"      value={stats.month}   accent="#10b981" />
          <StatCard icon={<AlertCircle size={16}/>}   label="Sin confirmar" value={stats.pending} accent="#f59e0b" />
        </div>

        {/* ── Toolbar: vista + navegación + búsqueda ──
            z-30: el popup del picker debe pintarse sobre las cards siguientes
            (cada .glass crea su propio stacking context por el backdrop-filter) */}
        <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-3 relative z-30">
          {/* Switcher segmentado con indicador deslizante */}
          <div className="relative flex bg-[#faf8f5] rounded-xl p-1 border border-[#ede8e0]">
            <span
              aria-hidden
              className="absolute top-1 bottom-1 rounded-lg shadow-sm transition-transform duration-300 ease-spring"
              style={{
                width: "calc((100% - 0.5rem) / 3)",
                background: PINK,
                transform: `translateX(${VIEWS.indexOf(view) * 100}%)`,
              }}
            />
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`relative z-10 w-[4.5rem] py-1.5 rounded-lg text-xs font-semibold text-center transition-colors ${view===v ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
                aria-label={`Vista ${VIEW_LABEL[v]} (${v[0].toUpperCase()})`}>
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} aria-label="Anterior"
              className="p-1.5 rounded-lg hover:bg-white/70 transition text-gray-500">
              <ChevronLeft size={16}/>
            </button>
            <button onClick={() => navigate(0)}
              className="px-3 py-1 rounded-lg border border-[#ede8e0] bg-white/60 text-xs font-medium text-gray-600 hover:bg-white hover:border-[#f07097] transition">
              Hoy
            </button>
            <button onClick={() => navigate(1)} aria-label="Siguiente"
              className="p-1.5 rounded-lg hover:bg-white/70 transition text-gray-500">
              <ChevronRight size={16}/>
            </button>
          </div>

          <MonthYearPicker cursor={cursor} setCursor={setCursor} label={headerTitle}/>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar cliente o evento…"
              className="pl-8 pr-3 py-1.5 rounded-full border border-[#ede8e0] bg-white/70 text-xs w-full sm:w-44 focus:outline-none focus:border-[#f07097] focus:bg-white transition"/>
          </div>
        </div>

        {/* ── Chips de filtro (colapsables en móvil) ── */}
        <div className="glass rounded-2xl p-3 space-y-2.5">
          <button
            onClick={() => setShowFilters(v => !v)}
            className="sm:hidden w-full flex items-center justify-between text-xs font-semibold text-gray-600">
            <span className="uppercase tracking-widest">
              Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </span>
            <ChevronRight size={14} className={`transition-transform ${showFilters ? "rotate-90" : ""}`}/>
          </button>
          <div className={`space-y-2.5 ${showFilters ? "block" : "hidden"} sm:block !mt-0 sm:!mt-0`}>
          {/* Estado */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-16 shrink-0">Estado</span>
            <button onClick={() => setStatusFilter("ALL")}
              className={`${chipBase} ${statusFilter === "ALL" ? "bg-gradient-rose text-white shadow-glow" : chipOff}`}>
              Todos
            </button>
            {ALL_STATUSES.map(s => {
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(active ? "ALL" : s)}
                  className={`${chipBase} flex items-center gap-1.5 ${active ? "text-white shadow-sm" : chipOff}`}
                  style={active ? { background: STATUS[s].dot } : {}}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "white" : STATUS[s].dot }}/>
                  {STATUS[s].label}
                </button>
              );
            })}
          </div>
          {/* Repostera + entrega + ocultar cancelados */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-16 shrink-0">Filtros</span>
            <button onClick={() => setBakerFilter("ALL")}
              className={`${chipBase} ${bakerFilter === "ALL" ? "bg-gradient-rose text-white shadow-glow" : chipOff}`}>
              👩‍🍳 Todas
            </button>
            <button onClick={() => setBakerFilter(bakerFilter === "UNASSIGNED" ? "ALL" : "UNASSIGNED")}
              className={`${chipBase} ${bakerFilter === "UNASSIGNED" ? "bg-gradient-rose text-white shadow-glow" : chipOff}`}>
              Sin asignar
            </button>
            {bakers.map(b => (
              <button key={b} onClick={() => setBakerFilter(bakerFilter === b ? "ALL" : b)}
                className={`${chipBase} ${bakerFilter === b ? "bg-gradient-rose text-white shadow-glow" : chipOff}`}>
                {b.split(" ")[0]}
              </button>
            ))}
            <span className="w-px h-4 bg-[#e8ddd3] mx-1 hidden sm:block"/>
            <button onClick={() => setDeliveryFilter(deliveryFilter === "pickup" ? "ALL" : "pickup")}
              className={`${chipBase} ${deliveryFilter === "pickup" ? "bg-gradient-rose text-white shadow-glow" : chipOff}`}>
              🏠 Recogida
            </button>
            <button onClick={() => setDeliveryFilter(deliveryFilter === "delivery" ? "ALL" : "delivery")}
              className={`${chipBase} ${deliveryFilter === "delivery" ? "bg-gradient-rose text-white shadow-glow" : chipOff}`}>
              🚗 Delivery
            </button>
            <button onClick={() => setHideCancelled(v => !v)}
              title="Ocultar cancelados / rechazados"
              className={`${chipBase} flex items-center gap-1 ml-auto ${hideCancelled ? "bg-gray-700 text-white" : chipOff}`}>
              <EyeOff size={11}/> Cancelados
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatusFilter("ALL"); setBakerFilter("ALL"); setDeliveryFilter("ALL"); setSearch(""); }}
                className="text-[11px] font-semibold text-[#f07097] hover:underline px-1">
                Limpiar ({activeFilterCount})
              </button>
            )}
          </div>
          </div>
        </div>

        {/* ── Calendar body ── */}
        {loading ? (
          <div className="admin-card rounded-2xl p-12 text-center text-gray-400 text-sm">
            Cargando pedidos…
          </div>
        ) : view === "month" ? (
          <MonthView cursor={cursor} byDate={byDate} onPickOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onPickDay={setSelectedDay}/>
        ) : view === "week" ? (
          <WeekView cursor={cursor} byDate={byDate} onPickOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onPickDay={(iso) => { const d = new Date(iso + "T00:00:00"); setCursor(d); setView("day"); }}/>
        ) : (
          <DayView cursor={cursor} byDate={byDate} onPickOrder={setSelectedOrderId} selectedOrderId={selectedOrderId}/>
        )}

        {/* Leyenda: estados + heat de densidad */}
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Estados</span>
          {ALL_STATUSES.map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS[s].dot }}/>
              {STATUS[s].label}
            </div>
          ))}
          <span className="w-px h-4 bg-[#e8ddd3] hidden sm:block"/>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Densidad</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-4 h-4 rounded border border-[#ede8e0] bg-white shrink-0"/>
            0
          </div>
          {HEAT_LEVELS.map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-4 h-4 rounded border border-[#ede8e0] shrink-0" style={{ background: `rgba(240,112,151,${l.alpha})` }}/>
              {l.label}
            </div>
          ))}
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

      {/* Paneles: detalle de pedido tiene prioridad sobre el panel del día */}
      {selectedOrder ? (
        <OrderPanel
          order={selectedOrder}
          onBack={selectedDay ? () => setSelectedOrderId(null) : undefined}
          onClose={() => { setSelectedOrderId(null); setSelectedDay(null); }}
          onPatch={patchOrder}
          currentUser={currentUser}
        />
      ) : selectedDay ? (
        <DayPanel
          iso={selectedDay}
          orders={byDate[selectedDay] ?? []}
          onClose={() => setSelectedDay(null)}
          onPickOrder={setSelectedOrderId}
          onOpenDayView={() => {
            const d = new Date(selectedDay + "T00:00:00");
            setCursor(d); setView("day"); setSelectedDay(null);
          }}
          onPatch={patchOrder}
          currentUser={currentUser}
        />
      ) : null}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent, gradient = false }: {
  icon: React.ReactNode; label: string; value: number; accent?: string; gradient?: boolean;
}) {
  return (
    <div className="admin-card rounded-2xl p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${gradient ? "bg-gradient-rose shadow-glow" : ""}`}
        style={gradient ? {} : { background: accent }}>
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
    <div className="relative ml-1" data-myp>
      <button onClick={() => setOpen(o => !o)}
        className="font-display text-base sm:text-lg capitalize px-2 py-1 rounded-lg hover:bg-white/70 transition flex items-center gap-1.5 text-gray-800">
        {label}
        <ChevronRight size={14} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}/>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 admin-card rounded-2xl shadow-lg p-3 w-72 modal-pop">
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
