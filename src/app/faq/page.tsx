"use client";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { FAQS as FAQ_SOURCE, LINKS, BUSINESS } from "@/lib/bizInfo";
import { useSiteSettings } from "@/components/useSiteSettings";

// Las FAQs viven en src/lib/bizInfo.ts (fuente única de verdad consumida
// también por el bot externo de WhatsApp). Para editar el contenido, ir
// a bizInfo.ts. Acá sólo proyectamos { q, a } para el render.
const FAQS: { q: string; a: string }[] = FAQ_SOURCE.map(({ q, a }) => ({ q, a }));

// El texto de bizInfo se guarda plano (el bot lo auto-enlaza en WhatsApp).
// En la web convertimos URLs y el teléfono en hipervínculos, con etiquetas
// amables para los links conocidos, preservando los saltos de línea (\n).
const WA_LINK = `https://wa.me/${BUSINESS.phoneTel.replace(/[^\d]/g, "")}`;
const LINK_LABELS: Record<string, string> = {
  [LINKS.uberEats]: "Uber Eats",
  [BUSINESS.mapsUrl]: "Google Maps",
  [LINKS.catalogo]: "nuestro catálogo",
  [LINKS.cotizar]: "cotización online",
};
const LINK_CLASS =
  "text-[var(--rose)] font-medium underline underline-offset-2 decoration-[var(--rose)]/40 hover:decoration-[var(--rose)] transition-colors";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderAnswer(text: string): Array<string | JSX.Element> {
  const phone = BUSINESS.phoneDisplay;
  const re = new RegExp(`(https?:\\/\\/[^\\s]+|${escapeRegExp(phone)})`, "g");
  const out: Array<string | JSX.Element> = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    let token = m[0];
    let trailing = "";
    if (token !== phone) {
      const t = token.match(/[.,;:)\]}]+$/);
      if (t) {
        trailing = t[0];
        token = token.slice(0, -trailing.length);
      }
    }
    if (token === phone) {
      out.push(
        <a key={key++} href={WA_LINK} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {phone}
        </a>,
      );
    } else {
      out.push(
        <a key={key++} href={token} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {LINK_LABELS[token] ?? token}
        </a>,
      );
    }
    if (trailing) out.push(trailing);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);
  const { quotesEnabled } = useSiteSettings();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <section className="relative overflow-hidden py-12 md:py-16 px-6 text-center bg-grain">
        {/* Decorative blobs */}
        <div className="blob-float pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl" />
        <div className="blob-float-2 pointer-events-none absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-[var(--accent)]/40 blur-3xl" />

        <div className="hero-enter relative">
          <p className="font-script text-xl md:text-2xl text-[var(--rose)]">
            Resolvemos tus dudas
          </p>
          <h1 className="font-display text-3xl md:text-4xl mt-2">
            Preguntas frecuentes
          </h1>
          <p className="text-[var(--muted-foreground)] mt-4 max-w-xl mx-auto leading-relaxed">
            Todo lo que necesitas saber antes de hacer tu pedido. ¿No encuentras tu respuesta?
            Escríbenos directamente.
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="stagger-fade space-y-3">
          {FAQS.map((item, i) => (
            <div
              key={i}
              className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
                open === i
                  ? "!border-[var(--rose)]/40 shadow-glow"
                  : "hover:shadow-glow hover:!border-[var(--rose)]/25"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="font-display text-[length:1.05rem] leading-snug text-[var(--foreground)]">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    open === i ? "bg-[var(--rose)] text-white rotate-180" : "bg-[var(--rose)]/10 text-[var(--rose)]"
                  }`}
                >
                  <ChevronDown size={17} />
                </span>
              </button>

              {/* Animated answer panel */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)]/40 pt-4 whitespace-pre-line">
                    {renderAnswer(item.a)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-3xl glass-pink bg-mesh p-8 text-center reveal" data-reveal="scale">
          <MessageCircle size={32} className="float-y text-[var(--rose)] mx-auto mb-3" />
          <h2 className="font-display text-2xl">¿Tienes otra pregunta?</h2>
          <p className="text-[var(--muted-foreground)] mt-2 mb-6">
            Nuestro equipo responde rápido por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-md"
              style={{ background: "linear-gradient(135deg, #f07097 0%, #d8b375 100%)" }}
            >
              Escribir por WhatsApp
            </a>
            {quotesEnabled && (
              <Link
                href="/cotizar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--rose)] text-[var(--rose)] text-sm font-semibold hover:bg-[var(--rose)]/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Cotizar mi evento
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
