"use client";
import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import {
  MASAS, FILLINGS, DECORATIONS, CLASSIC_CAKES, SPECIALTY_FLAVORS,
  SPECIALTY_PRICES, SIZE_LABELS, CAKE_MENU_NOTE, EMPTY_CAKE_DETAIL,
  estimateCakePrice, formatRD, normalizeSize,
  type CakeDetail, type CakeSizeId,
} from "@/lib/cakeMenu";

const BTN = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

const CAKE_TYPES: { id: CakeDetail["cakeType"]; label: string }[] = [
  { id: "tradicional", label: "Tradicional" },
  { id: "clasico", label: "Clásicos" },
  { id: "especialidad", label: "Especialidades" },
];

export default function CakePopup({ item, initial, onSave, onClose }: {
  item: string;
  initial?: CakeDetail | null;
  onSave: (d: CakeDetail) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<CakeDetail>(initial ?? EMPTY_CAKE_DETAIL);
  const s = (k: keyof CakeDetail, v: string) => setD(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  const Pill = ({ label, active, onClick, sub }: { label: string; active: boolean; onClick: () => void; sub?: string }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? "text-white border-transparent" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)] hover:text-[var(--rose)]"}`}
      style={active ? { background: BTN } : {}}>
      {label}{sub && <span className={`ml-1.5 text-[11px] font-semibold ${active ? "text-white/85" : "text-[var(--rose)]"}`}>{sub}</span>}
    </button>
  );

  const setType = (t: CakeDetail["cakeType"]) =>
    setD(p => ({ ...EMPTY_CAKE_DETAIL, cakeType: t, colors: p.colors, message: p.message }));

  const deco = DECORATIONS.find(x => x.label === d.decoration);
  const classic = CLASSIC_CAKES.find(x => x.name === d.flavor);

  // Tamaños disponibles según el tipo elegido (con su precio del menú).
  const sizeOptions: { id: CakeSizeId; price: number | undefined }[] =
    d.cakeType === "tradicional"
      ? (["1/4", "1/2", "1"] as CakeSizeId[]).map(id => ({ id, price: deco?.prices[id] }))
      : (["1/2", "1"] as CakeSizeId[]).map(id => ({
          id,
          price: d.cakeType === "clasico" ? classic?.prices[id] : (d.flavor ? SPECIALTY_PRICES[id] : undefined),
        }));

  const menuSizeSelected = normalizeSize(d.size) !== null;
  const price = estimateCakePrice(d);

  const valid = d.cakeType === "tradicional"
    ? !!(d.masa && d.filling && d.decoration && d.size)
    : !!(d.flavor && d.size);

  const confirm = () => {
    onSave({ ...d, estimatedPrice: estimateCakePrice(d) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] rounded-t-3xl">
          <div><h3 className="font-display text-xl">Detalles del pastel</h3><p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item}</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-5">

          {/* Tipo de pastel */}
          <div>
            <p className="text-sm font-semibold mb-2">🎂 Tipo de pastel <span className="text-[var(--rose)]">*</span></p>
            <div className="flex flex-wrap gap-2">
              {CAKE_TYPES.map(t => <Pill key={t.id} label={t.label} active={d.cakeType === t.id} onClick={() => setType(t.id)}/>)}
            </div>
          </div>

          {d.cakeType === "tradicional" && (
            <>
              <div><p className="text-sm font-semibold mb-2">🥣 Masa <span className="text-[var(--rose)]">*</span></p>
                <div className="flex flex-wrap gap-2">{MASAS.map(m => <Pill key={m} label={m} active={d.masa === m} onClick={() => s("masa", d.masa === m ? "" : m)}/>)}</div>
              </div>
              <div><p className="text-sm font-semibold mb-2">🍮 Relleno <span className="text-[var(--rose)]">*</span></p>
                <div className="flex flex-wrap gap-2">{FILLINGS.map(f => <Pill key={f} label={f} active={d.filling === f} onClick={() => s("filling", d.filling === f ? "" : f)}/>)}</div>
              </div>
              <div><p className="text-sm font-semibold mb-2">🧁 Decoración <span className="text-[var(--rose)]">*</span></p>
                <div className="flex flex-wrap gap-2">{DECORATIONS.map(x => <Pill key={x.id} label={x.label} active={d.decoration === x.label} onClick={() => s("decoration", d.decoration === x.label ? "" : x.label)}/>)}</div>
              </div>
            </>
          )}

          {d.cakeType === "clasico" && (
            <div>
              <p className="text-sm font-semibold mb-2">🍰 Pastel clásico <span className="text-[var(--rose)]">*</span></p>
              <div className="flex flex-wrap gap-2">
                {CLASSIC_CAKES.map(c => <Pill key={c.name} label={c.name} active={d.flavor === c.name} onClick={() => s("flavor", d.flavor === c.name ? "" : c.name)}/>)}
              </div>
              {classic?.description && <p className="text-xs text-[var(--muted-foreground)] mt-2 italic">{classic.description}.</p>}
            </div>
          )}

          {d.cakeType === "especialidad" && (
            <div>
              <p className="text-sm font-semibold mb-2">✨ Especialidad de la casa <span className="text-[var(--rose)]">*</span></p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_FLAVORS.map(f => <Pill key={f} label={f} active={d.flavor === f} onClick={() => s("flavor", d.flavor === f ? "" : f)}/>)}
              </div>
            </div>
          )}

          {/* Tamaño */}
          <div>
            <p className="text-sm font-semibold mb-2">⚖️ Tamaño <span className="text-[var(--rose)]">*</span></p>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map(o => (
                <Pill key={o.id} label={SIZE_LABELS[o.id]}
                  sub={o.price != null ? formatRD(o.price) : undefined}
                  active={normalizeSize(d.size) === o.id}
                  onClick={() => s("size", normalizeSize(d.size) === o.id ? "" : SIZE_LABELS[o.id])}/>
              ))}
            </div>
            <input
              type="text"
              placeholder="¿Más grande? Escribe el tamaño y te lo cotizamos…"
              value={menuSizeSelected ? "" : d.size}
              onChange={e => s("size", e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"
            />
          </div>

          <div><p className="text-sm font-semibold mb-2">🎨 Colores para decoración (2 máximo)</p>
            <input type="text" placeholder="ej. rosa, dorado…" value={d.colors} onChange={e => s("colors", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>
          <div><p className="text-sm font-semibold mb-2">✍️ Mensaje <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span></p>
            <input type="text" placeholder="ej. Feliz cumpleaños…" value={d.message} onChange={e => s("message", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>

          {/* Precio según menú */}
          {valid && (
            <div className={`rounded-2xl px-4 py-3 text-sm border ${price != null ? "bg-[var(--rose)]/5 border-[var(--rose)]/20" : "bg-amber-50 border-amber-200"}`}>
              {price != null ? (
                <p className="font-semibold text-[var(--rose)]">Precio según menú: {formatRD(price)}</p>
              ) : (
                <p className="font-semibold text-amber-700">Esta combinación se cotiza — te confirmamos el precio por WhatsApp.</p>
              )}
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{CAKE_MENU_NOTE}</p>
            </div>
          )}

          <button type="button" disabled={!valid} onClick={confirm}
            className="w-full py-3.5 rounded-2xl text-white font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: BTN }}>
            <CheckCircle2 size={18}/> Confirmar detalles
          </button>
        </div>
      </div>
    </div>
  );
}
