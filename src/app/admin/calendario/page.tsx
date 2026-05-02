"use client";
// ─────────────────────────────────────────────────────────────
// TEMPLATE: Vista de Calendario
// Estado: Preparado — listo para implementar
//
// TODO cuando se active:
//  1. Instalar: npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
//  2. Reemplazar el placeholder con <FullCalendar events={events} />
//  3. Conectar con /api/orders para obtener pedidos por fecha
//  4. Al clicar un día, mostrar pedidos de ese día en panel lateral
//  5. Colores por estado: PENDING=amber, CONFIRMED=green, COMPLETED=blue, DELIVERED=emerald
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Package } from "lucide-react";

type Order = { id: string; name: string; eventDate: string; eventType: string; status: string; assignedTo?: string | null; };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", CONFIRMED: "#10b981", NEEDS_INFO: "#a855f7",
  COMPLETED: "#3b82f6", DELIVERED: "#059669", CANCELLED: "#9ca3af", REJECTED: "#ef4444",
};

export default function CalendarioPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders").then(r => r.json()).then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  // Group orders by date
  const byDate: Record<string, Order[]> = {};
  orders.filter(o => !["CANCELLED","REJECTED"].includes(o.status)).forEach(o => {
    if (!byDate[o.eventDate]) byDate[o.eventDate] = [];
    byDate[o.eventDate].push(o);
  });

  // Simple monthly calendar
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  const todayStr = today.toISOString().split("T")[0];

  const selectedOrders = selectedDate ? (byDate[selectedDate] ?? []) : [];

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      <header className="sticky top-0 z-40 border-b border-[#ede8e0] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4" style={{ height: "3.75rem" }}>
          <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <Calendar size={18} style={{ color: "#f07097" }} />
            <span className="font-semibold text-sm">Calendario de pedidos</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ede8e0]">
              <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600">‹</button>
              <h2 className="font-display text-lg capitalize">{monthName}</h2>
              <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600">›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#ede8e0]">
              {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square border-r border-b border-[#f0e8e0]" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const dayOrders = byDate[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`aspect-square border-r border-b border-[#f0e8e0] p-1 flex flex-col items-center transition hover:bg-[#fef7f9] ${isSelected ? "bg-[#fef7f9] ring-2 ring-inset ring-[#f07097]" : ""}`}>
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#f07097] text-white" : "text-gray-700"}`}>{day}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {dayOrders.slice(0, 3).map((o, idx) => (
                        <span key={idx} className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[o.status] ?? "#9ca3af" }} />
                      ))}
                      {dayOrders.length > 3 && <span className="text-[9px] text-gray-400">+{dayOrders.length - 3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm p-5">
            {selectedDate ? (
              <>
                <h3 className="font-display text-lg mb-1">{new Date(selectedDate + "T00:00:00").toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" })}</h3>
                <p className="text-xs text-gray-400 mb-4">{selectedOrders.length} pedido{selectedOrders.length !== 1 ? "s" : ""}</p>
                {selectedOrders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin pedidos este día</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrders.map(o => (
                      <div key={o.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#f0e8e0] bg-[#faf8f5]">
                        <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: STATUS_COLORS[o.status] }} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{o.name}</p>
                          <p className="text-xs text-gray-500">{o.eventType}</p>
                          {o.assignedTo && <p className="text-xs text-[#f07097] mt-0.5">{o.assignedTo.split(" ")[0]}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">Selecciona un día para ver los pedidos</p>
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-[#f0e8e0]">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Estados</p>
              <div className="space-y-1.5">
                {Object.entries(STATUS_COLORS).map(([s, color]) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    {{ PENDING:"Nuevo", CONFIRMED:"Activo", NEEDS_INFO:"Más info", COMPLETED:"Listo", DELIVERED:"Entregado", CANCELLED:"Cancelado", REJECTED:"Rechazado" }[s]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
