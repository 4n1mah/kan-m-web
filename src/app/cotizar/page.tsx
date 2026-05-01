"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Users, Cake, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { waLink } from "@/lib/whatsapp";

const EVENT_TYPES = [
  "Cumpleaños",
  "Boda / Compromiso",
  "Baby shower",
  "Corporativo",
  "Graduación",
  "Quinceañera",
  "Otro",
];

const PRODUCT_CATEGORIES = [
  {
    label: "Pasteles",
    items: ["Pastel personalizado", "Naked cake", "Drip cake", "Pastel de bodas"],
  },
  {
    label: "Postres",
    items: ["Macarons", "Brownies", "Alfajores", "Cheesecake"],
  },
  {
    label: "Mesa dulce",
    items: ["Mesa dulce completa", "Mesa de postres mini"],
  },
  {
    label: "Brunch / Catering",
    items: ["Brunch para grupo", "Catering de evento"],
  },
];

type FormState = {
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  selectedItems: string[];
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  eventType: "",
  eventDate: "",
  guestCount: "",
  selectedItems: [],
  notes: "",
};

function CotizarForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill from URL params (deep link from /catering)
  useEffect(() => {
    const eventType = searchParams.get("eventType") ?? "";
    const item = searchParams.get("item") ?? "";
    setForm((prev) => ({
      ...prev,
      eventType: eventType && EVENT_TYPES.includes(eventType) ? eventType : prev.eventType,
      selectedItems: item ? [item] : prev.selectedItems,
    }));
  }, [searchParams]);

  const set = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleItem = (item: string) =>
    setForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(item)
        ? prev.selectedItems.filter((x) => x !== item)
        : [...prev.selectedItems, item],
    }));

  const buildWAMessage = () => {
    // Format date as DD/MM/YYYY instead of YYYY-MM-DD
    const dateFormatted = form.eventDate
      ? new Date(form.eventDate + "T12:00:00").toLocaleDateString("es-DO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

    const lines = [
      `Hola Kan M, quiero cotizar un evento.`,
      ``,
      `*DATOS DEL CLIENTE*`,
      `• Nombre: ${form.name}`,
      `• Teléfono: ${form.phone}`,
      form.email ? `• Email: ${form.email}` : null,
      ``,
      `*DETALLES DEL EVENTO*`,
      `• Tipo de evento: ${form.eventType}`,
      `• Fecha: ${dateFormatted}`,
      `• Cantidad de personas: ${form.guestCount}`,
      ``,
      form.selectedItems.length
        ? `*PRODUCTOS DE INTERÉS*\n${form.selectedItems.map((item) => `• ${item}`).join("\n")}`
        : null,
      form.notes
        ? `\n*NOTAS ADICIONALES*\n${form.notes}`
        : null,
      ``,
      `_Enviado desde kanm.com_`,
    ]
      .filter(Boolean)
      .join("\n");
    return lines;
  };

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitted(true);
  };

  const isValid =
    form.name.trim() &&
    form.phone.trim() &&
    form.eventType &&
    form.eventDate &&
    form.guestCount.trim();

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
        <div className="max-w-md w-full text-center bg-[var(--card)] border border-[var(--border)]/60 rounded-3xl shadow-md p-10">
          <CheckCircle2 size={48} className="text-[var(--rose)] mx-auto mb-4" />
          <h2 className="font-display text-3xl">¡Gracias, {form.name}!</h2>
          <p className="text-[var(--muted-foreground)] mt-3 leading-relaxed">
            Tu solicitud está lista. Envíanosla por WhatsApp y nuestro equipo te responde pronto.
          </p>
          <a
            href={waLink(buildWAMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-md hover:opacity-90 transition"
            style={{ background: "linear-gradient(135deg, #f07097 0%, #d8b375 100%)" }}
          >
            Enviar por WhatsApp <ArrowRight size={18} />
          </a>
          <button
            onClick={() => { setForm(EMPTY); setSubmitted(false); }}
            className="block mt-4 mx-auto text-sm text-[var(--muted-foreground)] hover:text-[var(--rose)] transition"
          >
            Hacer otra cotización
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <section className="relative overflow-hidden py-12 px-6 text-center">
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-[var(--accent)]/40 blur-3xl" />
        <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--rose)]/10 border border-[var(--rose)]/20 text-xs uppercase tracking-widest text-[var(--rose)]">
          <Sparkles size={13} /> Cotización sin compromiso
        </span>
        <h1 className="font-display text-3xl md:text-4xl mt-3 relative">Cotiza tu evento</h1>
        <p className="text-[var(--muted-foreground)] mt-4 max-w-xl mx-auto leading-relaxed relative">
          Cuéntanos qué imaginas. Completa el formulario y te contactamos en menos de 24 horas.
        </p>
      </section>

      {/* Form */}
      <section className="relative max-w-2xl mx-auto px-6 pb-20">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--blush)]/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 -left-20 w-56 h-56 rounded-full bg-[var(--accent)]/30 blur-3xl" />
        <div className="rounded-3xl p-8 md:p-10 space-y-8 border" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderColor: "rgba(255,255,255,0.75)", boxShadow: "0 8px 40px rgba(240,112,151,0.10)" }}>

          {/* Step 1 — Personal data */}
          <div>
            <h2 className="font-display text-xl mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--rose)]/15 text-[var(--rose)] flex items-center justify-center text-sm font-bold">1</span>
              Tus datos
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Nombre completo <span className="text-[var(--rose)]">*</span></span>
                <input type="text" placeholder="Tu nombre" value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">WhatsApp / Teléfono <span className="text-[var(--rose)]">*</span></span>
                <input type="tel" placeholder="+1 809 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition" />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium">Correo electrónico <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span></span>
                <input type="email" placeholder="tu@correo.com" value={form.email} onChange={(e) => set("email", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition" />
              </label>
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50" />

          {/* Step 2 — Event details */}
          <div>
            <h2 className="font-display text-xl mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--rose)]/15 text-[var(--rose)] flex items-center justify-center text-sm font-bold">2</span>
              Tu evento
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Cake size={15} className="text-[var(--rose)]" />
                  Tipo de evento <span className="text-[var(--rose)]">*</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button key={type} type="button" onClick={() => set("eventType", type)}
                      className={`px-4 py-2 rounded-full text-sm border transition ${
                        form.eventType === type
                          ? "bg-[var(--rose)] text-white border-[var(--rose)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)] hover:text-[var(--rose)]"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-[var(--rose)]" />
                    Fecha del evento <span className="text-[var(--rose)]">*</span>
                  </span>
                  <input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Users size={15} className="text-[var(--rose)]" />
                    Número de personas <span className="text-[var(--rose)]">*</span>
                  </span>
                  <input type="number" placeholder="ej. 50" min={1} value={form.guestCount} onChange={(e) => set("guestCount", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition" />
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50" />

          {/* Step 3 — Products */}
          <div>
            <h2 className="font-display text-xl mb-1 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--rose)]/15 text-[var(--rose)] flex items-center justify-center text-sm font-bold">3</span>
              ¿Qué te interesa?
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-5 ml-9">Selecciona todo lo que aplique (opcional)</p>
            <div className="space-y-5">
              {PRODUCT_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <button key={item} type="button" onClick={() => toggleItem(item)}
                        className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
                          form.selectedItems.includes(item)
                            ? "bg-[var(--rose)]/10 text-[var(--rose)] border-[var(--rose)]/40"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)]"
                        }`}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50" />

          {/* Step 4 — Notes */}
          <div>
            <h2 className="font-display text-xl mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--rose)]/15 text-[var(--rose)] flex items-center justify-center text-sm font-bold">4</span>
              Notas adicionales
            </h2>
            <textarea rows={4} placeholder="Cuéntanos tu idea, colores, sabores, inspiración..." value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:border-[var(--rose)] transition" />
          </div>

          <button type="button" onClick={handleSubmit} disabled={!isValid}
            className={`w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 transition shadow-md ${
              isValid ? "hover:opacity-90 cursor-pointer" : "opacity-40 cursor-not-allowed"
            }`}
            style={{ background: "linear-gradient(135deg, #f07097 0%, #d8b375 100%)" }}>
            Revisar y enviar por WhatsApp <ArrowRight size={18} />
          </button>
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Los campos <span className="text-[var(--rose)]">*</span> son obligatorios.
            Al continuar, abrimos WhatsApp con tu solicitud lista para enviar.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CotizarPage() {
  return (
    <Suspense>
      <CotizarForm />
    </Suspense>
  );
}
