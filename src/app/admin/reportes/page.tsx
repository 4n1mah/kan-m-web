"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, TrendingUp, Package, Users, DollarSign, ShoppingBag } from "lucide-react";

type Order = {
  id: string; name: string; phone: string; eventType: string; eventDate: string;
  status: string; assignedTo?: string | null; agreedPrice?: number | null; createdAt: string;
};

type CartOrderItem = { id: string; name: string; price: number | null; quantity: number; category: string };
type CartOrder = {
  id: string; code: string; customerName: string; customerPhone: string;
  status: string; total: number; items: CartOrderItem[]; createdAt: string;
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ReportesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartOrders, setCartOrders] = useState<CartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState(today.getMonth());
  const [filterYear, setFilterYear]   = useState(today.getFullYear());

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/admin/cart-orders").then(r => r.json()),
    ]).then(([ord, cart]) => {
      setOrders(Array.isArray(ord) ? ord : []);
      setCartOrders(Array.isArray(cart) ? cart : []);
      setLoading(false);
    });
  }, []);

  // ── Cotizaciones del mes ──────────────────────────────────────
  const monthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  const delivered  = monthOrders.filter(o => o.status === "DELIVERED").length;
  const confirmed  = monthOrders.filter(o => o.status === "CONFIRMED").length;
  const revenue    = monthOrders.filter(o => o.agreedPrice).reduce((s, o) => s + (o.agreedPrice ?? 0), 0);
  const byBaker: Record<string, number> = {};
  monthOrders.forEach(o => { if (o.assignedTo) byBaker[o.assignedTo] = (byBaker[o.assignedTo] ?? 0) + 1; });

  // ── Órdenes en línea del mes ──────────────────────────────────
  const monthCartOrders = cartOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });
  const cartConfirmed = monthCartOrders.filter(o => o.status === "CONFIRMED").length;
  const cartDenied    = monthCartOrders.filter(o => o.status === "DENIED").length;
  const cartPending   = monthCartOrders.filter(o => o.status === "PENDING").length;
  const cartRevenue   = monthCartOrders
    .filter(o => o.status === "CONFIRMED" || o.status === "SENT")
    .reduce((s, o) => s + (o.total ?? 0), 0);

  // Productos más vendidos en órdenes en línea
  const productCounts: Record<string, number> = {};
  monthCartOrders.forEach(o => {
    (o.items || []).forEach(item => {
      productCounts[item.name] = (productCounts[item.name] ?? 0) + item.quantity;
    });
  });
  const topProducts = Object.entries(productCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // ── Export CSV: cotizaciones ──────────────────────────────────
  function exportCSV() {
    const headers = ["ID","Cliente","Teléfono","Tipo","Fecha evento","Estado","Repostera","Precio acordado","Recibido"];
    const rows = monthOrders.map(o => [
      o.id.slice(-6).toUpperCase(),
      o.name, o.phone, o.eventType, o.eventDate,
      o.status, o.assignedTo ?? "", o.agreedPrice ?? "",
      new Date(o.createdAt).toLocaleDateString("es-DO"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    downloadCsv(csv, `kanm-cotizaciones-${MONTHS[filterMonth]}-${filterYear}.csv`);
  }

  // ── Export CSV: órdenes en línea ──────────────────────────────
  function exportCartCSV() {
    const headers = ["Código","Cliente","Teléfono","Estado","Total","Productos","Fecha"];
    const rows = monthCartOrders.map(o => [
      o.code,
      o.customerName, o.customerPhone, o.status,
      `RD$${o.total.toLocaleString("es-DO")}`,
      (o.items||[]).map(i => `${i.name} x${i.quantity}`).join(" | "),
      new Date(o.createdAt).toLocaleDateString("es-DO"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    downloadCsv(csv, `kanm-ordenes-linea-${MONTHS[filterMonth]}-${filterYear}.csv`);
  }

  function downloadCsv(csv: string, filename: string) {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  }

  const statusLabel: Record<string, string> = {
    PENDING: "Pendiente", CONFIRMED: "Confirmada", DENIED: "Negada", SENT: "Enviada",
  };
  const statusColor: Record<string, { color: string; bg: string }> = {
    PENDING:   { color: "#92400e", bg: "#fef3c7" },
    CONFIRMED: { color: "#065f46", bg: "#d1fae5" },
    DENIED:    { color: "#991b1b", bg: "#fee2e2" },
    SENT:      { color: "#1e40af", bg: "#dbeafe" },
  };

  const PINK = "var(--gradient-rose)"; // gradiente de marca definido en globals.css

  return (
    <div className="min-h-screen" style={{ background: "#f7f4f0" }}>
      <header className="admin-header-glass sticky top-0 z-40 border-b border-white/20 shadow-sm">
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
        <div className="admin-card rounded-2xl shadow-sm p-5 flex flex-wrap items-center gap-4">
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
          <div className="ml-auto flex gap-2 flex-wrap">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: PINK }}>
              <Download size={14} /> Cotizaciones CSV
            </button>
            <button onClick={exportCartCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              <Download size={14} /> Órdenes en línea CSV
            </button>
          </div>
        </div>

        {/* ── KPI: Cotizaciones ──────────────────────────────── */}
        <div>
          <h2 className="font-display text-lg text-gray-700 mb-3">Cotizaciones — {MONTHS[filterMonth]} {filterYear}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total pedidos", value: monthOrders.length, icon: <Package size={20}/>, color: "#f07097" },
              { label: "Entregados",    value: delivered,          icon: <TrendingUp size={20}/>, color: "#059669" },
              { label: "Confirmados",   value: confirmed,          icon: <Users size={20}/>,     color: "#3b82f6" },
              { label: "Ingresos",      value: revenue > 0 ? `RD$${revenue.toLocaleString("es-DO")}` : "—", icon: <DollarSign size={20}/>, color: "#f59e0b" },
            ].map(k => (
              <div key={k.label} className="admin-card rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ background: k.color }}>{k.icon}</div>
                <p className="text-2xl font-bold font-display text-gray-800">{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI: Órdenes en línea ─────────────────────────── */}
        <div>
          <h2 className="font-display text-lg text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#f07097]"/> Órdenes en línea — {MONTHS[filterMonth]} {filterYear}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total en línea", value: monthCartOrders.length, color: "#f07097" },
              { label: "Pendientes",     value: cartPending,            color: "#f59e0b" },
              { label: "Confirmadas",    value: cartConfirmed,          color: "#059669" },
              { label: "Negadas",        value: cartDenied,             color: "#ef4444" },
            ].map(k => (
              <div key={k.label} className="admin-card rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-2 h-8 rounded-full mb-3" style={{ background: k.color }}/>
                <p className="text-2xl font-bold font-display text-gray-800">{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          {cartRevenue > 0 && (
            <div className="mt-3 admin-card rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "#059669" }}>
                <DollarSign size={20}/>
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-gray-800">RD${cartRevenue.toLocaleString("es-DO")}</p>
                <p className="text-xs text-gray-500">Ingresos confirmados en órdenes en línea</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Productos más vendidos (en línea) ───────────────── */}
        {topProducts.length > 0 && (
          <div className="admin-card rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <h3 className="font-display text-lg mb-4">Productos más vendidos en línea</h3>
            <div className="space-y-3">
              {topProducts.map(([name, count]) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{name}</span>
                    <span className="text-gray-500 shrink-0 ml-2">{count} unid.</span>
                  </div>
                  <div className="h-2 bg-[#f0e8e0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count/topProducts[0][1])*100}%`, background: PINK }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pedidos por repostera (cotizaciones) ─────────────── */}
        {Object.keys(byBaker).length > 0 && (
          <div className="admin-card rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <h3 className="font-display text-lg mb-4">Cotizaciones por repostera</h3>
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

        {/* ── Tabla: Órdenes en línea ───────────────────────────── */}
        <div className="admin-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ede8e0]">
            <h3 className="font-display text-lg flex items-center gap-2"><ShoppingBag size={16} className="text-[#f07097]"/> Órdenes en línea del mes</h3>
            <p className="text-xs text-gray-400 mt-0.5">{monthCartOrders.length} órdenes en {MONTHS[filterMonth]} {filterYear}</p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando…</div>
          ) : monthCartOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Sin órdenes en línea este mes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-[#ede8e0]">
                  <tr>
                    {["Código","Cliente","Estado","Total","Fecha"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8e0]">
                  {monthCartOrders.map(o => {
                    const sc = statusColor[o.status] ?? { color: "#374151", bg: "#f3f4f6" };
                    return (
                      <tr key={o.id} className="hover:bg-[#fef7f9] transition-colors">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-[#e85d82]">{o.code}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{o.customerName}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: sc.color, background: sc.bg }}>
                            {statusLabel[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#f07097]">RD${o.total.toLocaleString("es-DO")}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("es-DO")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Tabla: Cotizaciones del mes ───────────────────────── */}
        <div className="admin-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ede8e0]">
            <h3 className="font-display text-lg">Cotizaciones del mes</h3>
            <p className="text-xs text-gray-400 mt-0.5">{monthOrders.length} pedidos en {MONTHS[filterMonth]} {filterYear}</p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando…</div>
          ) : monthOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Sin pedidos este mes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-[#ede8e0]">
                  <tr>
                    {["ID","Cliente","Tipo","Fecha evento","Estado","Repostera","Precio"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8e0]">
                  {monthOrders.map(o => (
                    <tr key={o.id} className="hover:bg-[#fef7f9] transition-colors">
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
