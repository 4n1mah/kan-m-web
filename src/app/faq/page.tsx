"use client";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";

// ─── EDITA AQUÍ TUS PREGUNTAS Y RESPUESTAS ────────────────────────────────────
// Para agregar más, copia un bloque { q: "...", a: "..." } y pégalo al final.
const FAQS = [
  {
    q: "¿Con cuánta anticipación debo hacer mi pedido?",
    a: "Recomendamos hacer tu pedido con al menos 5 días de anticipación para pedidos regulares. Para eventos grandes como bodas o cumpleaños temáticos, lo ideal es contactarnos con 2 a 3 semanas de anticipación para garantizar disponibilidad y tiempo de personalización.",
  },
  {
    q: "¿Hacen entregas a domicilio?",
    a: "Sí, hacemos entregas en Santo Domingo y la Zona Colonial. El costo de entrega varía según la distancia. También puedes recoger tu pedido directamente en nuestra tienda sin costo adicional. Escríbenos por WhatsApp para coordinar.",
  },
  {
    q: "¿Pueden personalizar pasteles con fotos o diseños específicos?",
    a: "¡Absolutamente! Nos especializamos en pasteles completamente personalizados. Puedes compartir referencias de diseño, colores, temáticas o fotos comestibles. Cuéntanos tu idea por WhatsApp y la hacemos realidad.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos transferencias bancarias, pago en efectivo y tarjetas de crédito/débito. Para pedidos de eventos, solicitamos un depósito del 50% al confirmar el pedido y el resto al momento de la entrega.",
  },
  {
    q: "¿Tienen opciones para personas con restricciones alimentarias (sin gluten, vegano, etc.)?",
    a: "Sí, tenemos opciones adaptadas para distintas necesidades. Contamos con preparaciones sin gluten y opciones veganas en algunos de nuestros productos. Contáctanos para que podamos orientarte sobre qué opciones se ajustan mejor a ti.",
  },
  // ── Agrega más preguntas aquí ──────────────────────────────────────────────
  // {
  //   q: "¿Otra pregunta?",
  //   a: "Respuesta aquí.",
  // },
];
// ──────────────────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <section className="relative overflow-hidden py-12 px-6 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-[var(--accent)]/40 blur-3xl" />

        <p className="font-script text-xl text-[var(--rose)] relative">
          Resolvemos tus dudas
        </p>
        <h1 className="font-display text-3xl md:text-4xl mt-2 relative">
          Preguntas frecuentes
        </h1>
        <p className="text-[var(--muted-foreground)] mt-4 max-w-xl mx-auto leading-relaxed relative">
          Todo lo que necesitas saber antes de hacer tu pedido. ¿No encuentras tu respuesta?
          Escríbenos directamente.
        </p>
      </section>

      {/* FAQ accordion */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <div
              key={i}
              className="bg-[var(--card)] border border-[var(--border)]/60 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="font-display text-[length:1.05rem] leading-snug text-[var(--foreground)]">
                  {item.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-[var(--rose)] transition-transform duration-300 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Animated answer panel */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)]/40 pt-4">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-3xl bg-gradient-to-br from-[#f07097]/10 to-[var(--accent)]/30 border border-[var(--border)]/60 p-8 text-center">
          <MessageCircle size={32} className="text-[var(--rose)] mx-auto mb-3" />
          <h2 className="font-display text-2xl">¿Tienes otra pregunta?</h2>
          <p className="text-[var(--muted-foreground)] mt-2 mb-6">
            Nuestro equipo responde rápido por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-md hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg, #f07097 0%, #d8b375 100%)" }}
            >
              Escribir por WhatsApp
            </a>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--rose)] text-[var(--rose)] text-sm font-semibold hover:bg-[var(--rose)]/5 transition"
            >
              Cotizar mi evento
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
