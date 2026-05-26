"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, MessageCircle, RefreshCw,
  Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";

const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

type Escalation = {
  id: string;
  phone: string;
  clientName: string;
  motivo: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = { id: string; email: string; name: string; role: string };

function motivoLabel(motivo: string): {
  label: string; color: string; bg: string;
} {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    manual:              { label: "Pidió persona",    color: "#065f46", bg: "#d1fae5" },
    usuario_pidio_humano:{ label: "Pidió persona",    color: "#065f46", bg: "#d1fae5" },
    precio_sin_match:    { label: "Precio",           color: "#1e40af", bg: "#dbeafe" },
    faq_sin_match:       { label: "FAQ sin respuesta", color: "#5b21b6", bg: "#f3e8ff" },
    web_no_disponible:   { label: "Web caída",        color: "#991b1b", bg: "#fee2e2" },
    pedido:              { label: "Quiere ordenar",   color: "#92400e", bg: "#fef3c7" },
    cotizar:             { label: "Quiere cotizar",   color: "#92400e", bg: "#fef3c7" },
    catalogo:            { label: "Vio catálogo",     color: "#1e40af", bg: "#dbeafe" },
    faq:                 { label: "Pregunta FAQ",     color: "#5b21b6", bg: "#f3e8ff" },
  };
  return map[motivo] ?? { label: motivo, color: "#374151", bg: "#f3f4f6" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Ahora mismo";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function AtenderButton({
  phoneClean,
  clientName,
  currentUser,
}: {
  phoneClean: string;
  clientName: string;
  currentUser: { name: string } | null;
}) {
  const nombre = clientName !== "Cliente" ? `, ${clientName}` : "";
  const agente = currentUser?.name ?? "el equipo de Kan M";
  const intro = encodeURIComponent(
    `¡Hola${nombre}! Soy ${agente} de Kan M 🍰 Vi que necesitabas ayuda, cuéntame.`
  );
  const link = `whatsapp://send?phone=${phoneClean}&text=${intro}`;
  return (
    <a
      href={link}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
      style={{ background: "#25D366" }}
    >
      <MessageCircle size={14} />
      Escribir por WhatsApp
    </a>
  );
}

function EscalationCard({
  esc,
  onResolve,
  currentUser,
}: {
  esc: Escalation;
  onResolve: (id: string) => void;
  currentUser: CurrentUser | null;
}) {
  const mt = motivoLabel(esc.motivo);
  const phoneClean = esc.phone.replace(/\D/g, "");
  const mins = Math.floor(
    (Date.now() - new Date(esc.createdAt).getTime()) / 60000
  );
  const isUrgent = mins > 30;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
      isUrgent ? "border-amber-300 ring-1 ring-amber-100" : "border-[#ede8e0]"
    }`}>
      <div className="px-5 py-4 border-b border-[#f0e8e0]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: PINK }}>
              {esc.clientName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">
                  {esc.clientName !== "Cliente"
                    ? esc.clientName
                    : "Cliente sin nombre"}
                </p>
                {isUrgent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={9} /> Esperando +30 min
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {esc.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
            <Clock size={11} />
            {timeAgo(esc.createdAt)}
          </div>
        </div>
        <div className="mt-3">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: mt.color, background: mt.bg }}>
            {mt.label}
          </span>
        </div>
      </div>

      {esc.summary && (
        <div className="px-5 py-3 bg-[#faf8f5] border-b border-[#f0e8e0]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
            Contexto
          </p>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
            {esc.summary}
          </p>
        </div>
      )}

      <div className="px-5 py-4 flex flex-col gap-2">
        <AtenderButton
          phoneClean={phoneClean}
          clientName={esc.clientName}
          currentUser={currentUser}
        />
        <button
          onClick={() => onResolve(esc.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#ede8e0] text-gray-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition"
        >
          <CheckCircle2 size={14} /> Marcar como resuelto
        </button>
      </div>
    </div>
  );
}

export default function WhatsappBandejaPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/whatsapp/escalations");
    if (r.ok) setEscalations(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function handleResolve(id: string) {
    const r = await fetch(`/api/whatsapp/escalations?id=${id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      addToast("Conversación resuelta", "success");
      setEscalations(prev => prev.filter(e => e.id !== id));
    } else {
      addToast("Error al resolver", "error");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="sticky top-0 z-40 border-b border-white/20 shadow-sm"
        style={{ background: PINK }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4"
          style={{ height: "3.75rem" }}>
          <Link href="/admin/dashboard"
            className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/15">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-white" />
            <span className="font-semibold text-sm text-white">
              WhatsApp — Clientes esperando
            </span>
            {escalations.length > 0 && (
              <span className="w-6 h-6 rounded-full bg-white text-[#f07097] text-xs font-bold flex items-center justify-center">
                {escalations.length}
              </span>
            )}
          </div>
          <button onClick={load}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : escalations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#ede8e0]">
            <CheckCircle2 size={48} className="mx-auto text-green-300 mb-3" />
            <p className="font-display text-xl text-gray-700">Todo al día 🎉</p>
            <p className="text-sm text-gray-400 mt-2">
              No hay clientes esperando atención.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 px-1">
              {escalations.length} cliente
              {escalations.length !== 1 ? "s" : ""} esperando ·
              Los botones abren WhatsApp Business directo
            </p>
            {escalations.map(esc => (
              <EscalationCard
                key={esc.id}
                esc={esc}
                onResolve={handleResolve}
                currentUser={currentUser}
              />
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">
              Sin actividad del cliente por 4h → se resuelve solo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
