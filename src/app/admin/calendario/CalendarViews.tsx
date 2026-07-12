"use client";
// ─────────────────────────────────────────────────────────────
//  Vistas del calendario: Mes (grid 7×6 con heat), Semana y Día
// ─────────────────────────────────────────────────────────────
import { Calendar as CalendarIcon } from "lucide-react";
import {
  type Order, STATUS, PINK_SOLID, heatColor,
  toIso, todayStr, fmt12h, startOfWeek, addDays, startOfMonth, daysInMonth,
  HOURS, HOUR_START, HOUR_END, HOUR_PX, fmtHourLabel, timeToMinutes, daysToEvent,
  OrderChip,
} from "./calendarShared";

// ──────────────────────────────────────────────────────────────
// MonthView — grid 7×6; click en día abre el panel del día
// ──────────────────────────────────────────────────────────────
export function MonthView({ cursor, byDate, onPickOrder, selectedOrderId, onPickDay }: {
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

  return (
    <div className="admin-card rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#ede8e0] bg-[#faf8f5]/80">
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

          // Heat de 4 niveles fijos según volumen del día
          const heatBg = cell.inMonth ? heatColor(dayOrders.length) : null;

          // ¿Urgente? algún pedido del día con evento ≤2 días y aún en curso
          const hasUrgent = dayOrders.some(o => {
            if (["DELIVERED","CANCELLED","REJECTED"].includes(o.status)) return false;
            const diff = daysToEvent(o.eventDate);
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
              } ${isToday ? "ring-2 ring-inset ring-[#f07097] glow-rose" : ""} ${isPast && cell.inMonth ? "opacity-95" : ""} hover:bg-[#fef7f9]/60`}
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
// WeekView — 7 columnas con timeline horario vertical
// ──────────────────────────────────────────────────────────────
export function WeekView({ cursor, byDate, onPickOrder, selectedOrderId, onPickDay }: {
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
    <div className="admin-card rounded-2xl overflow-hidden">
      {/* Top header con días */}
      <div className="grid border-b border-[#ede8e0] bg-[#faf8f5]/80" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
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
export function DayView({ cursor, byDate, onPickOrder, selectedOrderId }: {
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
    <div className="admin-card rounded-2xl overflow-hidden">
      {/* Day header */}
      <div className={`px-5 py-4 border-b border-[#ede8e0] flex items-center justify-between gap-4 ${isToday ? "bg-[#fef7f9]" : "bg-[#faf8f5]/80"}`}>
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
export function DayRow({ order, active, onClick }: { order: Order; active: boolean; onClick: () => void }) {
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
