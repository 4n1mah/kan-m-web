"use client";
// ─────────────────────────────────────────────────────────────
//  OrderPanel — slide-over de detalle de un pedido con acciones
//  rápidas. Si viene de un DayPanel, muestra "← volver al día".
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon, X, MessageCircle, Phone, MapPin, Clock,
  User as UserIcon, CheckCircle2, Truck, ArrowLeft,
} from "lucide-react";
import { useBakers } from "@/components/BakersContext";
import {
  type Order, type CurrentUser, STATUS, PINK,
  fmt12h, fmtDateLong, todayStr, MetaItem,
} from "./calendarShared";

export default function OrderPanel({ order, onClose, onBack, onPatch, currentUser }: {
  order: Order | null;
  onClose: () => void;
  /** Presente cuando el detalle se abrió desde el panel del día */
  onBack?: () => void;
  onPatch: (id: string, payload: Record<string, unknown>) => Promise<void>;
  currentUser: CurrentUser | null;
}) {
  const { teamMembers } = useBakers();
  const isAssistant = currentUser?.role === "ASSISTANT";

  // A quién puede asignar pedidos este usuario
  const assignableNames: string[] = isAssistant
    ? []
    : currentUser?.role === "BAKER"
    ? [
        currentUser.name,
        ...teamMembers.filter(m => m.role === "ASSISTANT").map(m => m.name),
      ]
    : teamMembers.map(m => m.name); // OWNER ve a todo el equipo

  useEffect(() => {
    if (!order) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (onBack) onBack(); else onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose, onBack]);

  if (!order) return null;

  const s = STATUS[order.status] ?? STATUS.PENDING;
  const time = order.deliveryTime ? fmt12h(order.deliveryTime) : null;
  const isPending = order.status === "PENDING";
  const isActive = order.status === "CONFIRMED" || order.status === "NEEDS_INFO";
  const isCompleted = order.status === "COMPLETED";
  const baker = order.assignedTo || "Kan M";

  // Plantillas de WhatsApp (iguales a las del dashboard)
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
  const dte = Math.ceil(
    (new Date(order.eventDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
  );
  let urgencyLabel: string | null = null;
  if (stillOpen) {
    if (dte < 0)        urgencyLabel = `Atrasado · hace ${Math.abs(dte)} día${Math.abs(dte) === 1 ? "" : "s"}`;
    else if (dte === 0) urgencyLabel = "¡Hoy es el evento!";
    else if (dte === 1) urgencyLabel = "Mañana es el evento";
    else if (dte <= 2)  urgencyLabel = `Faltan ${dte} días`;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" onClick={onClose}/>

      <aside className="drawer-in relative w-full sm:max-w-md bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog" aria-modal="true">
        <div className="px-5 pt-5 pb-4 border-b border-[#ede8e0]" style={{ background: `linear-gradient(180deg, ${s.bg} 0%, transparent 100%)` }}>
          {onBack && (
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#f07097] transition mb-2">
              <ArrowLeft size={13}/> Volver al día
            </button>
          )}
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
    </div>
  );
}
