"use client";
import Link from "next/link";
import { Sparkles, Cake } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { useLang } from "@/lib/i18n/LanguageProvider";

// Página "muy pronto" que se muestra cuando el catálogo o las
// cotizaciones están deshabilitados desde /admin/configuracion.
export default function ComingSoon({ variant }: { variant: "catalog" | "quotes" }) {
  const { t } = useLang();
  const copy =
    variant === "catalog"
      ? { title: t.comingSoon.catalogTitle, message: t.comingSoon.catalogMessage }
      : { title: t.comingSoon.quotesTitle, message: t.comingSoon.quotesMessage };
  const Icon = variant === "catalog" ? Sparkles : Cake;
  return (
    <section className="relative overflow-hidden max-w-2xl mx-auto px-6 py-24">
      <div className="blob-float pointer-events-none absolute -top-10 -left-16 w-64 h-64 rounded-full bg-[var(--blush)]/30 blur-3xl" />
      <div className="blob-float-2 pointer-events-none absolute -bottom-10 -right-16 w-56 h-56 rounded-full bg-[var(--accent)]/40 blur-3xl" />
      <div className="glass-strong relative rounded-3xl p-8 sm:p-12 text-center">
        <div className="float-y w-14 h-14 mx-auto rounded-full bg-gradient-rose shadow-glow flex items-center justify-center text-white">
          <Icon size={24} />
        </div>
        <p className="font-script text-2xl text-rose mt-5">{t.comingSoon.kicker}</p>
        <h1 className="font-display text-3xl md:text-4xl mt-1">{copy.title}</h1>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
          {copy.message}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={waLink(WA_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-soft bg-gradient-rose"
          >
            {t.comingSoon.ctaWhatsapp}
          </a>
          <Link
            href="/nosotros"
            className="chip-glass inline-flex items-center px-6 py-3 rounded-full text-foreground/80 hover:text-rose transition"
          >
            {t.comingSoon.ctaContact}
          </Link>
        </div>
      </div>
    </section>
  );
}
