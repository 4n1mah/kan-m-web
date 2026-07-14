"use client";
import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import {
  CAKE_MENU, SIZE_LABELS, CAKE_MENU_NOTE, EMPTY_CAKE_DETAIL,
  estimateCakePrice, formatRD, normalizeSize,
  type CakeDetail, type CakeSizeId,
} from "@/lib/cakeMenu";

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
      className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? "text-white border-transparent bg-gradient-rose shadow-glow" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)] hover:text-[var(--rose)]"}`}>
      {label}{sub && <span className={`ml-1.5 text-[11px] font-semibold ${active ? "text-white/85" : "text-[var(--rose)]"}`}>{sub}</span>}
    </button>
  );

  const cake = CAKE_MENU.find(x => x.name === d.flavor);

  const sizeOptions: { id: CakeSizeId; price: number | undefined }[] =
    (["1/2", "1"] as CakeSizeId[]).map(id => ({ id, price: cake?.prices[id] }));

  const price = estimateCakePrice(d);
  const valid = !!(d.flavor && d.size);

  const confirm = () => {
    onSave({ ...d, estimatedPrice: estimateCakePrice(d) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="modal-pop bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] rounded-t-3xl">
          <div><h3 className="font-display text-xl">Detalles del pastel</h3><p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item}</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-5">

          {/* Pastel del menú */}
          <div>
            <p className="text-sm font-semibold mb-2">🍰 Pastel <span className="text-[var(--rose)]">*</span></p>
            <div className="flex flex-wrap gap-2">
              {CAKE_MENU.map(c => <Pill key={c.name} label={c.name} active={d.flavor === c.name} onClick={() => s("flavor", d.flavor === c.name ? "" : c.name)}/>)}
            </div>
            {cake && <p className="text-xs text-[var(--muted-foreground)] mt-2 italic">{cake.description}.</p>}
          </div>

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
          </div>

          <div><p className="text-sm font-semibold mb-2">🎨 Colores para decoración (2 máximo)</p>
            <input type="text" placeholder="ej. rosa, dorado…" value={d.colors} onChange={e => s("colors", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>
          <div><p className="text-sm font-semibold mb-2">✍️ Mensaje <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span></p>
            <input type="text" placeholder="ej. Feliz cumpleaños…" value={d.message} onChange={e => s("message", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>

          {/* Precio estimado — aparece apenas hay pastel + tamaño */}
          {price != null ? (
            <div className="rounded-2xl px-4 py-3 text-sm border bg-[var(--rose)]/5 border-[var(--rose)]/20">
              <p className="font-semibold text-[var(--rose)] text-base">💰 Precio estimado: {formatRD(price)}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{CAKE_MENU_NOTE}</p>
            </div>
          ) : valid ? (
            <div className="rounded-2xl px-4 py-3 text-sm border bg-amber-50 border-amber-200">
              <p className="font-semibold text-amber-700">Esta combinación se cotiza — te confirmamos el precio por WhatsApp.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{CAKE_MENU_NOTE}</p>
            </div>
          ) : null}

          <button type="button" disabled={!valid} onClick={confirm}
            className="btn-shine w-full py-3.5 rounded-2xl text-white font-semibold bg-gradient-rose hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <CheckCircle2 size={18}/> Confirmar detalles
          </button>
        </div>
      </div>
    </div>
  );
}
