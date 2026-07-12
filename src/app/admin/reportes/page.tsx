"use client";
// ─────────────────────────────────────────────────────────────
//  /admin/reportes — Reportes del mes (rediseño)
//
//  • Selector de mes en pills + stepper de año
//  • KPIs con delta vs mes anterior y sparkline
//  • Gráfica de tendencia diaria (SVG propio, sin librerías)
//  • Export CSV (cotizaciones y órdenes en línea)
//  Todo se computa client-side desde /api/orders y
//  /api/admin/cart-orders (limit=500, envelope {orders,hasMore}).
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, TrendingUp, TrendingDown, Minus, Package,
  Users, DollarSign, ShoppingBag, ChevronLeft, ChevronRight,
} from "lucide-react";

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
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const PINK = "var(--gradient-rose)"; // gradiente de marca definido en globals.css
const LINE = "#e85d82"; // stop oscuro del gradiente — mejor contraste para el trazo

// El API devuelve array plano sin params y {orders,...} con ?limit
function unwrap<T>(data: unknown): { list: T[]; hasMore: boolean } {
  if (Array.isArray(data)) return { list: data as T[], hasMore: false };
  const env = data as { orders?: T[]; hasMore?: boolean };
  return { list: env?.orders ?? [], hasMore: !!env?.hasMore };
}

function inMonth(iso: string, m: number, y: number) {
  const d = new Date(iso);
  return d.getMonth() === m && d.getFullYear() === y;
}

// ── Métricas de un mes (mismo set para actual y anterior) ────
function computeMetrics(orders: Order[], cartOrders: CartOrder[], m: number, y: number) {
  const mo = orders.filter(o => inMonth(o.createdAt, m, y));
  const mc = cartOrders.filter(o => inMonth(o.createdAt, m, y));
  return {
    monthOrders: mo,
    monthCartOrders: mc,
    total: mo.length,
    delivered: mo.filter(o => o.status === "DELIVERED").length,
    confirmed: mo.filter(o => o.status === "CONFIRMED").length,
    revenue: mo.filter(o => o.agreedPrice).reduce((s, o) => s + (o.agreedPrice ?? 0), 0),
    cartTotal: mc.length,
    cartPending: mc.filter(o => o.status === "PENDING").length,
    cartConfirmed: mc.filter(o => o.status === "CONFIRMED").length,
    cartDenied: mc.filter(o => o.status === "DENIED").length,
    cartRevenue: mc.filter(o => o.status === "CONFIRMED" || o.status === "SENT")
      .reduce((s, o) => s + (o.total ?? 0), 0),
  };
}

// ── DeltaChip — comparación vs mes anterior ──────────────────
function DeltaChip({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-400" title="Sin datos del mes anterior">
        <Minus size={11}/> —
      </span>
    );
  }
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) {
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-400"><Minus size={11}/> 0%</span>;
  }
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${up ? "text-emerald-600" : "text-[#e85d82]"}`}
      title="vs mes anterior">
      {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

// ── Sparkline — acento mini en KPIs (misma serie diaria) ─────
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const n = values.length;
  const pts = values.map((v, i) => `${(i / (n - 1)) * 100},${28 - (v / max) * 24 - 2}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" className="w-full h-6 mt-2" aria-hidden preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="rgba(240,112,151,0.5)" strokeWidth="1.5"
        vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── TrendChart — área+línea diaria con tooltip al hover ──────
function TrendChart({ days, values, mode, monthLabel }: {
  days: number; values: number[]; mode: "count" | "money"; monthLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640, H = 220, PL = 46, PR = 10, PT = 14, PB = 26;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  // Escala Y con tope "bonito"
  const rawMax = Math.max(1, ...values);
  const niceMax = (() => {
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const norm = rawMax / mag;
    const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return nice * mag;
  })();

  const x = (i: number) => PL + (days === 1 ? plotW / 2 : (i / (days - 1)) * plotW);
  const y = (v: number) => PT + plotH - (v / niceMax) * plotH;

  const linePts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const areaPath = `M ${x(0).toFixed(1)},${y(values[0]).toFixed(1)} ` +
    values.slice(1).map((v, i) => `L ${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(" ") +
    ` L ${x(days - 1).toFixed(1)},${(PT + plotH).toFixed(1)} L ${x(0).toFixed(1)},${(PT + plotH).toFixed(1)} Z`;

  const gridYs = [0.25, 0.5, 0.75, 1].map(f => ({ v: niceMax * f, py: y(niceMax * f) }));
  const xLabels = Array.from({ length: days }, (_, i) => i + 1).filter(d => d === 1 || d === days || d % 5 === 0);

  const fmtVal = (v: number) =>
    mode === "money" ? `RD$${Math.round(v).toLocaleString("es-DO")}` : String(Math.round(v));

  return (
    <div className="relative">
      {/* Tooltip flotante */}
      {hover != null && (
        <div
          className="chip-glass pointer-events-none absolute z-10 -translate-x-1/2 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-gray-700 whitespace-nowrap shadow-md"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `-0.25rem` }}>
          {hover + 1} {monthLabel.toLowerCase().slice(0, 3)} · {fmtVal(values[hover])}
          {mode === "count" ? ` pedido${values[hover] === 1 ? "" : "s"}` : ""}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label={`Tendencia diaria de ${mode === "count" ? "pedidos" : "ingresos"} de ${monthLabel}`}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(240,112,151,0.28)"/>
            <stop offset="100%" stopColor="rgba(240,112,151,0)"/>
          </linearGradient>
        </defs>

        {/* Gridlines + labels Y */}
        {gridYs.map(({ v, py }) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={py} y2={py} stroke="#f0e8e0" strokeWidth="1"/>
            <text x={PL - 6} y={py + 3} textAnchor="end" fontSize="9" fill="#a8a29e">
              {mode === "money" && v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
            </text>
          </g>
        ))}
        {/* Baseline */}
        <line x1={PL} x2={W - PR} y1={PT + plotH} y2={PT + plotH} stroke="#e7ddd3" strokeWidth="1"/>

        {/* Área + línea */}
        <path d={areaPath} fill="url(#trendFill)"/>
        <polyline points={linePts} fill="none" stroke={LINE} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round"/>

        {/* Dots en días con datos */}
        {values.map((v, i) => v > 0 && (
          <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : 3}
            fill={LINE} stroke="#fff" strokeWidth="1.5"/>
        ))}

        {/* Línea guía del hover */}
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1={PT} y2={PT + plotH}
            stroke={LINE} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
        )}

        {/* Labels X */}
        {xLabels.map(d => (
          <text key={d} x={x(d - 1)} y={H - 8} textAnchor="middle" fontSize="9" fill="#a8a29e">{d}</text>
        ))}

        {/* Zonas de hover (una por día, ancho completo) */}
        {values.map((_, i) => (
          <rect key={i}
            x={x(i) - plotW / days / 2} y={PT} width={plotW / days} height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}/>
        ))}
      </svg>
    </div>
  );
}

export default function ReportesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartOrders, setCartOrders] = useState<CartOrder[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"count" | "money">("count");
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState(today.getMonth());
  const [filterYear, setFilterYear]   = useState(today.getFullYear());

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=500").then(r => r.json()),
      fetch("/api/admin/cart-orders?limit=500").then(r => r.json()),
    ]).then(([ord, cart]) => {
      const o = unwrap<Order>(ord);
      const c = unwrap<CartOrder>(cart);
      setOrders(o.list);
      setCartOrders(c.list);
      setHasMore(o.hasMore || c.hasMore);
      setLoading(false);
    });
  }, []);

  // ── Métricas del mes actual y del anterior ──────────────────
  const cur = useMemo(
    () => computeMetrics(orders, cartOrders, filterMonth, filterYear),
    [orders, cartOrders, filterMonth, filterYear]
  );
  const prevMY = filterMonth === 0 ? { m: 11, y: filterYear - 1 } : { m: filterMonth - 1, y: filterYear };
  const prev = useMemo(
    () => computeMetrics(orders, cartOrders, prevMY.m, prevMY.y),
    [orders, cartOrders, prevMY.m, prevMY.y]
  );
  const { monthOrders, monthCartOrders } = cur;

  // ── Serie diaria para la gráfica ────────────────────────────
  const daysInSelMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
  const dailySeries = useMemo(() => {
    const counts = Array(daysInSelMonth).fill(0);
    const money = Array(daysInSelMonth).fill(0);
    monthOrders.forEach(o => {
      const d = new Date(o.createdAt).getDate() - 1;
      counts[d] += 1;
      money[d] += Number(o.agreedPrice) || 0;
    });
    monthCartOrders.forEach(o => {
      const d = new Date(o.createdAt).getDate() - 1;
      counts[d] += 1;
      if (o.status === "CONFIRMED" || o.status === "SENT") money[d] += o.total ?? 0;
    });
    return { counts, money };
  }, [monthOrders, monthCartOrders, daysInSelMonth]);

  // ── Productos más vendidos en órdenes en línea ──────────────
  const topProducts = useMemo(() => {
    const productCounts: Record<string, number> = {};
    monthCartOrders.forEach(o => {
      (o.items || []).forEach(item => {
        productCounts[item.name] = (productCounts[item.name] ?? 0) + item.quantity;
      });
    });
    return Object.entries(productCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
  }, [monthCartOrders]);

  const byBaker = useMemo(() => {
    const acc: Record<string, number> = {};
    monthOrders.forEach(o => { if (o.assignedTo) acc[o.assignedTo] = (acc[o.assignedTo] ?? 0) + 1; });
    return acc;
  }, [monthOrders]);

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

  const monthLabel = `${MONTHS[filterMonth]} ${filterYear}`;
  const quotesTotal = monthOrders.reduce((s, o) => s + (Number(o.agreedPrice) || 0), 0);
  const cartTableTotal = monthCartOrders.reduce((s, o) => s + (o.total ?? 0), 0);

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
        {/* ── Selector de período + export ── */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Stepper de año */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setFilterYear(y => y - 1)} aria-label="Año anterior"
                className="p-1.5 rounded-lg hover:bg-white/70 transition text-gray-500">
                <ChevronLeft size={16}/>
              </button>
              <span className="font-display text-lg font-semibold tabular-nums px-1">{filterYear}</span>
              <button onClick={() => setFilterYear(y => y + 1)} aria-label="Año siguiente"
                className="p-1.5 rounded-lg hover:bg-white/70 transition text-gray-500">
                <ChevronRight size={16}/>
              </button>
            </div>
            {/* Export */}
            <div className="ml-auto flex gap-2 flex-wrap">
              <button onClick={exportCSV}
                className="btn-shine flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-gradient-rose hover:opacity-90 transition">
                <Download size={14} /> Cotizaciones CSV
              </button>
              <button onClick={exportCartCSV}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#f07097]/40 text-[#e85d82] hover:bg-[#fef7f9] transition">
                <Download size={14} /> Órdenes en línea CSV
              </button>
            </div>
          </div>
          {/* Pills de mes */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1">
            {MONTHS_SHORT.map((m, i) => {
              const active = filterMonth === i;
              const isCurrent = i === today.getMonth() && filterYear === today.getFullYear();
              return (
                <button key={m} onClick={() => setFilterMonth(i)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-gradient-rose text-white shadow-glow"
                      : isCurrent
                      ? "chip-glass text-[#e85d82] !border-[#f07097]/40"
                      : "chip-glass text-gray-600 hover:text-[#f07097]"
                  }`}>
                  {m}
                </button>
              );
            })}
          </div>
          {hasMore && (
            <p className="text-[11px] text-gray-400">
              Mostrando los 500 registros más recientes — los meses antiguos pueden estar incompletos.
            </p>
          )}
        </div>

        {/* ── Tendencia diaria ── */}
        <div className="admin-card rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="font-display text-lg">
                {chartMode === "count" ? "Pedidos por día" : "Ingresos por día"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {monthLabel} · cotizaciones + órdenes en línea
              </p>
            </div>
            {/* Toggle de métrica */}
            <div className="flex bg-[#faf8f5] rounded-xl p-1 border border-[#ede8e0]">
              {([["count","Pedidos"],["money","Ingresos"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setChartMode(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    chartMode === id ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={chartMode === id ? { background: PINK } : {}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Cargando…</div>
          ) : (
            <TrendChart
              days={daysInSelMonth}
              values={chartMode === "count" ? dailySeries.counts : dailySeries.money}
              mode={chartMode}
              monthLabel={MONTHS[filterMonth]}
            />
          )}
        </div>

        {/* ── KPI: Cotizaciones ── */}
        <div>
          <h2 className="font-display text-lg text-gray-700 mb-3">Cotizaciones — {monthLabel}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total pedidos", value: cur.total, prevV: prev.total, icon: <Package size={20}/>, gradient: true, spark: true },
              { label: "Entregados",    value: cur.delivered, prevV: prev.delivered, icon: <TrendingUp size={20}/>, color: "#059669" },
              { label: "Confirmados",   value: cur.confirmed, prevV: prev.confirmed, icon: <Users size={20}/>, color: "#3b82f6" },
              { label: "Ingresos", value: cur.revenue, prevV: prev.revenue, icon: <DollarSign size={20}/>, color: "#f59e0b", money: true },
            ].map(k => (
              <div key={k.label} className="admin-card rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 ${k.gradient ? "bg-gradient-rose shadow-glow" : ""}`}
                    style={k.gradient ? {} : { background: k.color }}>{k.icon}</div>
                  <DeltaChip cur={k.value} prev={k.prevV}/>
                </div>
                <p className="text-2xl font-bold font-display text-gray-800">
                  {k.money ? (k.value > 0 ? `RD$${k.value.toLocaleString("es-DO")}` : "—") : k.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                {k.spark && !loading && <Sparkline values={dailySeries.counts}/>}
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI: Órdenes en línea ── */}
        <div>
          <h2 className="font-display text-lg text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#f07097]"/> Órdenes en línea — {monthLabel}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total en línea", value: cur.cartTotal, prevV: prev.cartTotal, color: "#f07097" },
              { label: "Pendientes",     value: cur.cartPending, prevV: prev.cartPending, color: "#f59e0b" },
              { label: "Confirmadas",    value: cur.cartConfirmed, prevV: prev.cartConfirmed, color: "#059669" },
              { label: "Negadas",        value: cur.cartDenied, prevV: prev.cartDenied, color: "#ef4444" },
            ].map(k => (
              <div key={k.label} className="admin-card rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div className="w-2 h-8 rounded-full mb-3" style={{ background: k.color }}/>
                  <DeltaChip cur={k.value} prev={k.prevV}/>
                </div>
                <p className="text-2xl font-bold font-display text-gray-800">{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          {cur.cartRevenue > 0 && (
            <div className="mt-3 admin-card rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "#059669" }}>
                <DollarSign size={20}/>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold font-display text-gray-800">RD${cur.cartRevenue.toLocaleString("es-DO")}</p>
                <p className="text-xs text-gray-500">Ingresos confirmados en órdenes en línea</p>
              </div>
              <DeltaChip cur={cur.cartRevenue} prev={prev.cartRevenue}/>
            </div>
          )}
        </div>

        {/* ── Productos más vendidos (en línea) ── */}
        {topProducts.length > 0 && (
          <div className="admin-card rounded-2xl shadow-sm p-5">
            <h3 className="font-display text-lg mb-4">Productos más vendidos en línea</h3>
            <div className="space-y-3">
              {topProducts.map(([name, count]) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{name}</span>
                    <span className="text-gray-500 shrink-0 ml-2 tabular-nums">{count} unid.</span>
                  </div>
                  <div className="h-2.5 bg-[#f0e8e0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(count/topProducts[0][1])*100}%`, background: PINK }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cotizaciones por repostera ── */}
        {Object.keys(byBaker).length > 0 && (
          <div className="admin-card rounded-2xl shadow-sm p-5">
            <h3 className="font-display text-lg mb-4">Cotizaciones por repostera</h3>
            <div className="space-y-3">
              {Object.entries(byBaker).sort((a,b) => b[1]-a[1]).map(([baker, count]) => (
                <div key={baker}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{baker}</span>
                    <span className="text-gray-500 tabular-nums">{count} pedido{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2.5 bg-[#f0e8e0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(count/monthOrders.length)*100}%`, background: PINK }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabla: Órdenes en línea ── */}
        <div className="admin-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ede8e0]">
            <h3 className="font-display text-lg flex items-center gap-2"><ShoppingBag size={16} className="text-[#f07097]"/> Órdenes en línea del mes</h3>
            <p className="text-xs text-gray-400 mt-0.5">{monthCartOrders.length} órdenes en {monthLabel}</p>
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
                        <td className="px-4 py-3 font-semibold text-[#f07097] tabular-nums">RD${o.total.toLocaleString("es-DO")}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("es-DO")}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-[#ede8e0] bg-[#faf8f5]">
                  <tr>
                    <td className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider" colSpan={3}>Total del mes</td>
                    <td className="px-4 py-3 font-bold text-[#e85d82] tabular-nums">RD${cartTableTotal.toLocaleString("es-DO")}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Tabla: Cotizaciones del mes ── */}
        <div className="admin-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ede8e0]">
            <h3 className="font-display text-lg">Cotizaciones del mes</h3>
            <p className="text-xs text-gray-400 mt-0.5">{monthOrders.length} pedidos en {monthLabel}</p>
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
                      <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: o.agreedPrice ? "#f07097" : "#9ca3af" }}>
                        {o.agreedPrice ? `RD$${o.agreedPrice.toLocaleString("es-DO")}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#ede8e0] bg-[#faf8f5]">
                  <tr>
                    <td className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider" colSpan={6}>Total acordado del mes</td>
                    <td className="px-4 py-3 font-bold text-[#e85d82] tabular-nums">
                      {quotesTotal > 0 ? `RD$${quotesTotal.toLocaleString("es-DO")}` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
