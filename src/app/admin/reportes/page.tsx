"use client";
// ─────────────────────────────────────────────────────────────
// TEMPLATE: Reportes y Exportación
// Estado: Preparado — listo para implementar
//
// TODO cuando se active:
//  1. npm install xlsx file-saver
//  2. Implementar exportToExcel() con datos reales
//  3. Agregar filtros de fecha (rango mes/año)
//  4. Agregar gráficas con recharts (ya instalado)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, TrendingUp, Package, Users, DollarSign } from "lucide-react";

type Order = {
  id: string; name: string; phone: string; eventType: string; eventDate: string;
  status: string; assignedTo?: string | null; agreedPrice?: number | null; createdAt: string;
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ReportesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState(today.getMonth());
  const [filterYear, setFilterYear]   = useState(today.getFullYear());

  useEffect(() => {
    fetch("/api/orders").then(r => r.json()).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  // Filter orders for selected month
  const monthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  const delivered  = monthOrders.filter(o => o.status === "DELIVERED").length;
  const confirmed  = monthOrders.filter(o => o.status === "CONFIRMED").length;
  const cancelled  = monthOrders.filter(o => ["CANCELLED","REJECTED"].includes(o.status)).length;
  const revenue    = monthOrders.filter(o => o.agreedPrice).reduce((s, o) => s + (o.agreedPrice ?? 0), 0);
  const byBaker: Record<string, number> = {};
  monthOrders.forEach(o => { if (o.assignedTo) byBaker[o.assignedTo] = (byBaker[o.assignedTo] ?? 0) + 1; });

  // Export to CSV (works without external libs)
  function exportCSV() {
    const headers = ["ID","Cliente","Teléfono","Tipo","Fecha evento","Estado","Repostera","Precio acordado","Recibido"];
    const rows = monthOrders.map(o => [
      o.id.slice(-6).toUpperCase(),
      o.name, o.phone, o.eventType, o.eventDate,
      o.status, o.assignedTo ?? "", o.agreedPrice ?? "",
      new Date(o.createdAt).toLocaleDateString("es-DO"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `kanm-pedidos-${MONTHS[filterMonth]}-${filterYear}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      <header className="sticky top-0 z-40 border-b border-white/20 shadow-sm" style={{ background: PINK }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4" style={{ height: "3.75rem" }}>
          <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/15">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-white" />
            <span className="font-semibold text-sm text-white">Reportes</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Filters + Export */}
        <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm p-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
              className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2 text-sm focus:outline-none focus:border-[#f07097] transition">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
              className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2 text-sm focus:outline-none focus:border-[#f07097] transition">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: PINK }}>
              <Download size={14} /> Exportar CSV
            </button>
            {/* TODO: Agregar botón Excel cuando se instale xlsx */}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total pedidos", value: monthOrders.length, icon: <Package size={20}/>, color: "#f07097" },
            { label: "Entregados",    value: delivered,          icon: <TrendingUp size={20}/>, color: "#059669" },
            { label: "Confirmados",   value: confirmed,          icon: <Users size={20}/>,     color: "#3b82f6" },
            { label: "Ingresos",      value: revenue > 0 ? `RD$${revenue.toLocaleString("es-DO")}` : "—", icon: <DollarSign size={20}/>, color: "#f59e0b" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: k.color }}>{k.icon}</div>
              </div>
              <p className="text-2xl font-bold font-display text-gray-800">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              <p className="text-xs text-gray-400">{MONTHS[filterMonth]} {filterYear}</p>
            </div>
          ))}
        </div>

        {/* By baker */}
        {Object.keys(byBaker).length > 0 && (
          <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm p-5">
            <h3 className="font-display text-lg mb-4">Pedidos por repostera</h3>
            <div className="space-y-3">
              {Object.entries(byBaker).sort((a,b) => b[1]-a[1]).map(([baker, count]) => (
                <div key={baker}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{baker}</span>
                    <span className="text-gray-500">{count} pedido{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 bg-[#f0e8e0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(count/monthOrders.length)*100}%`, background: PINK }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders table */}
        <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ede8e0]">
            <h3 className="font-display text-lg">Pedidos del mes</h3>
            <p className="text-xs text-gray-400 mt-0.5">{monthOrders.length} pedidos en {MONTHS[filterMonth]} {filterYear}</p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando…</div>
          ) : monthOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Sin pedidos este mes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#faf8f5] border-b border-[#ede8e0]">
                  <tr>
                    {["ID","Cliente","Tipo","Fecha evento","Estado","Repostera","Precio"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8e0]">
                  {monthOrders.map(o => (
                    <tr key={o.id} className="hover:bg-[#faf8f5] transition">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{o.id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{o.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{o.eventType}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{o.eventDate}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#374151" }}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{o.assignedTo ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: o.agreedPrice ? "#f07097" : "#9ca3af" }}>
                        {o.agreedPrice ? `RD$${o.agreedPrice.toLocaleString("es-DO")}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
