"use client";
// ─────────────────────────────────────────────────────────────
//  /admin/configuracion — Configuración del sitio (solo OWNER)
//
//  • Switches del sitio público: catálogo en línea y cotizaciones
//  • Acceso a gestión de usuarios
//  • Actividad reciente del panel
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Settings, Shield, AlertCircle, ChevronRight,
  ShoppingBag, FileText, Package, Cake, User as UserIcon, History,
} from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";

const PINK = "var(--gradient-rose)"; // gradiente de marca definido en globals.css

type SettingsRow = {
  catalogEnabled: boolean;
  quotesEnabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  userName: string;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  "order.create": "Creó un pedido",
  "order.update": "Actualizó un pedido",
  "order.status": "Cambió el estado de un pedido",
  "order.delete": "Eliminó un pedido",
  "product.create": "Agregó un producto",
  "product.update": "Editó un producto",
  "product.delete": "Eliminó un producto",
  "user.create": "Creó un usuario",
  "user.update": "Editó un usuario",
  "user.deactivate": "Desactivó un usuario",
  "user.login": "Inició sesión",
  "settings.update": "Cambió la configuración del sitio",
  "cart_order.update": "Actualizó una orden del catálogo",
};

function activityIcon(action: string) {
  if (action.startsWith("order.")) return <Package size={14} />;
  if (action.startsWith("product.")) return <Cake size={14} />;
  if (action.startsWith("user.")) return <UserIcon size={14} />;
  if (action.startsWith("settings.")) return <Settings size={14} />;
  return <History size={14} />;
}

// Switch CSS-only con el gradiente de marca
function Toggle({ checked, disabled, onChange }: {
  checked: boolean; disabled?: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className={`relative inline-flex items-center shrink-0 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-gradient-rose transition-colors
        after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5
        after:bg-white after:rounded-full after:shadow after:transition-transform
        peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#f07097]/50" />
    </label>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const [forbidden, setForbidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  const loadSettings = useCallback(async () => {
    const r = await fetch("/api/admin/settings");
    if (r.status === 403) { setForbidden(true); return; }
    if (r.status === 401) { router.push("/"); return; }
    if (r.ok) setSettings(await r.json());
  }, [router]);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) { router.push("/"); return; }
      const data = await r.json();
      if (data.user?.role !== "OWNER") { setForbidden(true); return; }
      setReady(true);
      loadSettings();
      fetch("/api/activity?limit=15")
        .then((res) => (res.ok ? res.json() : []))
        .then((rows) => setActivity(Array.isArray(rows) ? rows : []))
        .catch(() => {});
    });
  }, [router, loadSettings]);

  async function toggle(key: "catalogEnabled" | "quotesEnabled", value: boolean) {
    if (!settings) return;
    const prev = settings;
    setSettings({ ...settings, [key]: value }); // optimista
    setSaving(key);
    const r = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(null);
    if (!r.ok) {
      setSettings(prev); // revertir
      const err = await r.json().catch(() => ({}));
      addToast(err.error || "No se pudo guardar", "error");
      return;
    }
    const updated = await r.json();
    setSettings(updated);
    addToast(
      value ? "Sección visible en la web" : "Sección oculta de la web",
      "success"
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f7f4f0" }}>
        <div className="bg-white border border-[#ede8e0] rounded-3xl shadow-md p-10 max-w-md text-center">
          <AlertCircle size={36} className="mx-auto text-amber-500 mb-3" />
          <h2 className="font-display text-xl text-gray-800">Acceso restringido</h2>
          <p className="text-sm text-gray-500 mt-2">Solo el admin del panel puede ver la configuración.</p>
          <Link href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: PINK }}>
            <ArrowLeft size={14} /> Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  const rows: { key: "catalogEnabled" | "quotesEnabled"; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      key: "catalogEnabled",
      icon: <ShoppingBag size={17} />,
      title: "Catálogo en línea",
      desc: "Los clientes ven el catálogo y pueden ordenar con el carrito. Apagado, la web muestra \"muy pronto\" y solo información.",
    },
    {
      key: "quotesEnabled",
      icon: <FileText size={17} />,
      title: "Cotizaciones en línea",
      desc: "El formulario público de cotizar acepta solicitudes. Apagado, los botones Cotizar llevan a WhatsApp. Agendar en persona sigue funcionando.",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="admin-header-glass sticky top-0 z-40 border-b border-white/20 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 flex items-center gap-4" style={{ height: "3.75rem" }}>
          <Link href="/admin/dashboard"
            className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/15">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-white" />
            <span className="font-semibold text-sm text-white">Configuración</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Sitio público ── */}
        <div className="admin-card rounded-2xl p-5">
          <h2 className="font-display text-lg text-gray-900">Sitio público</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Controla qué secciones de la web están activas. Ideal para lanzar
            solo con información y activar el resto cuando estés lista.
          </p>
          <div className="divide-y divide-[#f0e8e0]">
            {rows.map((row) => {
              const value = settings?.[row.key] ?? true;
              return (
                <div key={row.key} className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-rose">
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-800">{row.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        value ? "bg-[#d1fae5] text-[#065f46]" : "bg-gray-200 text-gray-500"
                      }`}>
                        {value ? "Visible" : "Oculto"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{row.desc}</p>
                  </div>
                  <Toggle
                    checked={value}
                    disabled={!settings || saving === row.key || !ready}
                    onChange={(v) => toggle(row.key, v)}
                  />
                </div>
              );
            })}
          </div>
          {settings?.updatedBy && (
            <p className="text-[11px] text-gray-400 mt-2">
              Última actualización por {settings.updatedBy}
              {settings.updatedAt
                ? ` · ${new Date(settings.updatedAt).toLocaleDateString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
          )}
        </div>

        {/* ── Equipo ── */}
        <Link href="/admin/usuarios"
          className="admin-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 hover:border-[#f07097]/30 transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-rose">
            <Shield size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Gestión de usuarios</p>
            <p className="text-xs text-gray-500 mt-0.5">Crea, edita y administra el acceso de tu equipo al panel.</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-[#f07097] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* ── Actividad reciente ── */}
        <div className="admin-card rounded-2xl p-5">
          <h2 className="font-display text-lg text-gray-900 flex items-center gap-2">
            <History size={16} className="text-[#f07097]" /> Actividad reciente
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 mt-4 text-center py-6">Sin actividad reciente.</p>
          ) : (
            <div className="divide-y divide-[#f0e8e0] mt-2">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#fef7f9] text-[#e85d82] flex items-center justify-center shrink-0">
                    {activityIcon(a.action)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {ACTION_LABELS[a.action] ?? a.action}
                    </p>
                    <p className="text-[11px] text-gray-400">{a.userName}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                    {new Date(a.createdAt).toLocaleDateString("es-DO", { day: "numeric", month: "short" })}{" "}
                    {new Date(a.createdAt).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
