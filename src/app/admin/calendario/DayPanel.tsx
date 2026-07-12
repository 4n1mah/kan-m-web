"use client";
// ─────────────────────────────────────────────────────────────
//  DayPanel — slide-over con TODOS los pedidos de un día:
//  hora, cliente, monto, estado y acción rápida contextual.
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import {
  X, CheckCircle2, Truck, Calendar as CalendarIcon, ArrowRight,
} from "lucide-react";
import {
  type Order, type CurrentUser, STATUS, fmt12h, fmtDateLong, todayStr,
} from "./calendarShared";

export default function DayPanel({ iso, orders, onClose, onPickOrder, onOpenDayView, onPatch, currentUser }: {
  iso: string;
  orders: Order[];
  onClose: () => void;
  onPickOrder: (id: string) => void;
  onOpenDayView: () => void;
  onPatch: (id: string, payload: Record<string, unknown>) => Promise<void>;
  currentUser: CurrentUser | null;
}) {
  const isAssistant = currentUser?.role === "ASSISTANT";
  const isToday = iso === todayStr;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sorted = [...orders].sort((a, b) => {
    const ta = a.deliveryTime ?? "99:99";
    const tb = b.deliveryTime ?? "99:99";
    return ta.localeCompare(tb);
  });
  const dayTotal = orders.reduce((sum, o) => sum + (Number(o.agreedPrice) || 0), 0);

  // Acción rápida contextual según estado
  function quickAction(o: Order): { label: string; icon: React.ReactNode; next: string; cls: string } | null {
    if (o.status === "PENDING")
      return { label: "Aceptar", icon: <CheckCircle2 size={13}/>, next: "CONFIRMED", cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" };
    if (o.status === "CONFIRMED" || o.status === "NEEDS_INFO")
      return { label: "Listo", icon: <CheckCircle2 size={13}/>, next: "COMPLETED", cls: "bg-blue-100 text-blue-700 hover:bg-blue-200" };
    if (o.status === "COMPLETED")
      return { label: "Entregado", icon: <Truck size={13}/>, next: "DELIVERED", cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" };
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" onClick={onClose}/>

      <aside className="drawer-in relative w-full sm:max-w-md bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog" aria-modal="true">
        {/* Header del día */}
        <div className="glass-pink px-5 pt-5 pb-4 border-b border-[#ede8e0]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
                {isToday ? "Hoy" : "Pedidos del día"}
              </p>
              <h3 className="font-display text-xl leading-tight capitalize mt-0.5">{fmtDateLong(iso)}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="font-semibold text-[#e85d82]">
                  {orders.length} pedido{orders.length === 1 ? "" : "s"}
                </span>
                {dayTotal > 0 && (
                  <span className="text-gray-600 tabular-nums">
                    · RD$ {dayTotal.toLocaleString("es-DO")}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-sm flex items-center justify-center transition shrink-0"
              aria-label="Cerrar">
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon size={36} className="mx-auto text-gray-200" />
              <p className="text-sm text-gray-400 mt-3">No hay pedidos para este día</p>
            </div>
          ) : (
            sorted.map(o => {
              const s = STATUS[o.status] ?? STATUS.PENDING;
              const qa = quickAction(o);
              return (
                <div key={o.id}
                  className="admin-card rounded-2xl p-3 flex items-center gap-3 hover:border-[#f07097]/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onPickOrder(o.id)}>
                  {/* Hora */}
                  <div className="w-14 shrink-0 text-center">
                    <span className="font-mono font-bold tabular-nums text-xs text-gray-700">
                      {o.deliveryTime ? fmt12h(o.deliveryTime) : "—"}
                    </span>
                  </div>
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: s.dot }}/>
                  {/* Cliente + evento */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{o.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {o.eventType}
                      {o.agreedPrice != null && Number(o.agreedPrice) > 0 && (
                        <span className="tabular-nums"> · RD$ {Number(o.agreedPrice).toLocaleString("es-DO")}</span>
                      )}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                      style={{ color: s.color, background: s.bg }}>
                      {s.emoji} {s.label}
                    </span>
                  </div>
                  {/* Acción rápida */}
                  {qa && !isAssistant && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPatch(o.id, { status: qa.next, changedBy: o.assignedTo ?? "Admin" }); }}
                      title={qa.label}
                      className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${qa.cls}`}>
                      {qa.icon} {qa.label}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#ede8e0] bg-white p-4">
          <button onClick={onOpenDayView}
            className="btn-shine w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-rose hover:opacity-90 transition">
            Abrir vista día <ArrowRight size={15}/>
          </button>
        </div>
      </aside>
    </div>
  );
}
