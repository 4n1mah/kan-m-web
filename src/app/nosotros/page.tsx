"use client";
import { IMAGES } from "@/lib/images";
import Image from "next/image";
import { Clock, Cake, Palette, Gem } from "lucide-react";
import ContactoSection from "@/components/ContactoSection";
import { useLang } from "@/lib/i18n/LanguageProvider";

export default function NosotrosPage() {
  const { t } = useLang();
  const valueIcons = [Cake, Palette, Gem];
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative reveal" data-reveal="left">
          {/* Blob decorativo detrás de la foto */}
          <div className="blob-float pointer-events-none absolute -top-8 -left-8 w-64 h-64 rounded-full bg-[var(--blush)]/40 blur-3xl -z-10" />
          <div className="img-shine group relative aspect-[4/5] rounded-3xl overflow-hidden shadow-card ring-1 ring-[var(--rose)]/15">
            <Image
              src={IMAGES.nosotrosTeam}
              alt="Equipo Kan M"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </div>
        <div className="reveal" data-reveal="right">
          <p className="font-script text-2xl text-rose">{t.about.kicker}</p>
          <h1 className="font-display text-4xl md:text-5xl mt-1">
            {t.about.titlePre} <span className="font-script text-gradient-rose">{t.about.titleScript}</span>
          </h1>
          <p className="text-muted-foreground mt-6 leading-relaxed">
            {t.about.p1}
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            {t.about.p2}
          </p>

        </div>
      </div>

      <div className="stagger-fade grid md:grid-cols-3 gap-6 mt-20">
        {t.about.values.map((v, i) => {
          const Icon = valueIcons[i];
          return (
          <div key={v.title} className="card-tilt glass rounded-3xl p-7 text-center">
            <div
              className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-white mb-4 shadow-glow"
              style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 100%)" }}
            >
              <Icon size={22} />
            </div>
            <h3 className="font-display text-xl">{v.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{v.desc}</p>
          </div>
          );
        })}
      </div>

      {/* Horario de atención */}
      <div className="glass-pink rounded-3xl p-7 mt-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 reveal" data-reveal="scale">
        <div
          className="float-y w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-glow"
          style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 100%)" }}
        >
          <Clock size={24} />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
            {t.about.scheduleLabel}
          </p>
          <p className="font-display text-lg mt-1 leading-snug">
            {t.about.scheduleDays1} <span className="text-rose">·</span> 9:00 am – 7:00 pm
            <br />
            {t.about.scheduleDays2} <span className="text-rose">·</span> 9:00 am – 10:00 pm
          </p>
        </div>
      </div>

      {/* Contacto — antes vivía en /nosotros aparte; ahora es la sección final. */}
      <ContactoSection />
    </section>
  );
}
