"use client";
import DeliveryButtons from "@/components/DeliveryButtons";
import Link from "next/link";
import { Phone, Mail, Instagram, MapPin, ArrowRight } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { BUSINESS } from "@/lib/bizInfo";
import { useSiteSettings } from "@/components/useSiteSettings";

export default function ContactoPage() {
  const { quotesEnabled } = useSiteSettings();
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <section className="relative overflow-hidden py-10 px-6 text-center bg-mesh">
        <div className="blob-float pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl" />
        <div className="blob-float-2 pointer-events-none absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-[var(--accent)]/40 blur-3xl" />
        <div className="hero-enter relative">
          <p className="font-script text-xl text-rose">conversemos</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2">Contáctanos</h1>
          <p className="text-[var(--muted-foreground)] mt-4 max-w-xl mx-auto">
            Estamos aquí para hacer tu evento especial. Encuéntranos en tus plataformas favoritas.
          </p>
        </div>
      </section>

      {/* 3-column layout: redes | divider "o" | cotizar */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="flex flex-col md:flex-row items-stretch gap-0">

          {/* LEFT — redes sociales y delivery */}
          <div className="flex-1 space-y-2 md:pr-10 reveal" data-reveal="left">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
              Encuéntranos aquí
            </p>

            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card-lift glass rounded-2xl p-3 flex items-center gap-3 group block"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform duration-200 group-hover:scale-110" style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 100%)" }}>
                <MapPin size={16} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Ubicación</div>
                <div className="font-semibold text-sm mt-0.5">{BUSINESS.address}</div>
              </div>
            </a>

            <a
              href={`tel:${BUSINESS.phoneTel}`}
              className="card-lift glass rounded-2xl p-3 flex items-center gap-3 group block"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform duration-200 group-hover:scale-110" style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 100%)" }}>
                <Phone size={16} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Teléfono</div>
                <div className="font-semibold text-sm mt-0.5">{BUSINESS.phoneDisplay}</div>
              </div>
            </a>

            <a
              href={`mailto:${BUSINESS.email}`}
              className="card-lift glass rounded-2xl p-3 flex items-center gap-3 group block"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform duration-200 group-hover:scale-110" style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 100%)" }}>
                <Mail size={16} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Email</div>
                <div className="font-semibold text-sm mt-0.5">{BUSINESS.email}</div>
              </div>
            </a>

            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="card-lift glass rounded-2xl p-3 flex items-center gap-3 group block"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#25D366] text-white transition-transform duration-200 group-hover:scale-110">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">WhatsApp</div>
                <div className="font-semibold text-sm mt-0.5">Escríbenos directo</div>
              </div>
            </a>

            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="card-lift glass rounded-2xl p-3 flex items-center gap-3 group block"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform duration-200 group-hover:scale-110" style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                <Instagram size={16} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Instagram</div>
                <div className="font-semibold text-sm mt-0.5">@kanm.reposteriacafe</div>
              </div>
            </a>

            <a
              href={BUSINESS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="card-lift glass rounded-2xl p-3 flex items-center gap-3 group block"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white bg-black transition-transform duration-200 group-hover:scale-110">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">TikTok</div>
                <div className="font-semibold text-sm mt-0.5">@kanmreposteriacafe</div>
              </div>
            </a>

            {/* Delivery */}
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                Pide a domicilio
              </p>
              <DeliveryButtons variant="card" />
            </div>
          </div>

          {/* CENTER divider — "o" — height matches sibling content, not viewport */}
          <div className="hidden md:flex flex-col items-center px-4 self-stretch gap-0">
            <div className="flex-1 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" style={{ minHeight: "3rem" }} />
            <span className="shrink-0 w-9 h-9 rounded-full border-2 border-[var(--border)] bg-[var(--background)] flex items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] my-2">
              o
            </span>
            <div className="flex-1 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" style={{ minHeight: "3rem" }} />
          </div>
          {/* Mobile: horizontal divider */}
          <div className="md:hidden flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            <span className="shrink-0 w-9 h-9 rounded-full border-2 border-[var(--border)] bg-[var(--background)] flex items-center justify-center text-sm font-semibold text-[var(--muted-foreground)]">
              o
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          </div>

          {/* RIGHT — cotizar CTA */}
          <div className="flex-1 flex flex-col justify-center md:pl-10 reveal" data-reveal="right">
            <div className="glass-pink rounded-3xl p-6 text-center flex flex-col items-center gap-4">
              {/* Decorative icon */}
              <div className="float-y w-12 h-12 rounded-xl flex items-center justify-center text-white text-3xl bg-gradient-rose shadow-glow">
                🎂
              </div>
              <div>
                <p className="font-script text-xl text-rose">sin compromiso</p>
                <h2 className="font-display text-xl md:text-2xl mt-1 leading-tight">
                  ¡Mejor dinos qué quieres y cotiza desde ahora!
                </h2>
                <p className="text-[var(--muted-foreground)] mt-2 text-sm leading-relaxed">
                  Completa el formulario en menos de 2 minutos y nuestro equipo te respondera para endulzar tu proximo evento.
                </p>
              </div>
              {quotesEnabled ? (
                <Link
                  href="/cotizar"
                  className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-md text-sm bg-gradient-rose"
                >
                  Cotizar ahora <ArrowRight size={17} />
                </Link>
              ) : (
                <a
                  href={waLink(WA_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-md text-sm bg-gradient-rose"
                >
                  Escríbenos por WhatsApp <ArrowRight size={17} />
                </a>
              )}
              <p className="text-xs text-[var(--muted-foreground)]">
                Respuesta en menos de 24 horas · Sin compromiso
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
