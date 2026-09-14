"use client";
// ─────────────────────────────────────────────────────────────
//  Empanadoteca — landing sencilla con el menú abajo.
//
//  Al montar activa el tema Empanadoteca (variables CSS en <html>)
//  con un morph gradual de colores; al salir lo revierte igual.
//  Productos y precios viven en src/lib/empanadotecaMenu.ts.
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import Image from "next/image";
import { Instagram, MapPin, ArrowLeft, ArrowDown, Flame, Star } from "lucide-react";
import { useWipe, wipeClickHandler } from "@/components/BrandWipe";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { BUSINESS } from "@/lib/bizInfo";
import { formatRD } from "@/lib/cafeMenu";
import { EMP_FEATURED, EMP_MENU, EMP_MIN_PRICE, EMP_PHOTOS, type EmpGroup } from "@/lib/empanadotecaMenu";

// Empanadoteca comparte local con Kan M, así que el mapa sale de la fuente
// única. La cuenta de Instagram sí es propia de la sub-marca.
const EMP = {
  instagram: "https://instagram.com/empanadotecard",
  maps: BUSINESS.mapsUrl,
};

// Paleta de la sub-marca (espejo de --emp-* en globals.css)
const RED = "#b3282d";
const NAVY = "#22314a";
const MUTED = "#5d6b83";
const CARD_BG = "rgba(255,253,248,0.82)";
const CARD_BORDER = "rgba(34,49,74,0.12)";
const RED_SHADOW = "0 10px 30px -10px rgba(179,40,45,0.55)";

function PriceLeader({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="flex-1 min-w-4 mb-[0.3em] border-b-2 border-dotted"
      style={{ borderColor: color }}
    />
  );
}

function MenuCard({ group }: { group: EmpGroup }) {
  const { t } = useLang();
  return (
    <article
      className="rounded-3xl overflow-hidden border backdrop-blur-md"
      style={{
        background: CARD_BG,
        borderColor: CARD_BORDER,
        boxShadow: "0 12px 40px rgba(179,40,45,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <header className="px-6 py-4" style={{ background: NAVY, borderBottom: `4px solid ${RED}` }}>
        <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white">
          {t.empanadoteca.groups[group.id]}
        </h3>
      </header>
      <ul className="px-6 py-5 space-y-3">
        {group.items.map((item) => (
          <li key={item.name} className="flex items-baseline gap-3">
            <span className="font-medium inline-flex items-center gap-1.5" style={{ color: NAVY }}>
              {item.featured && <Star size={14} fill={RED} stroke={RED} className="shrink-0 self-center" />}
              {item.name}
            </span>
            <PriceLeader color="rgba(179,40,45,0.3)" />
            <span className="font-display font-bold whitespace-nowrap" style={{ color: RED }}>
              {formatRD(item.price)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function EmpanadotecaClient() {
  const { navigateWithWipe } = useWipe();
  const { t } = useLang();
  const [tradicional, venezolana, catibias] = EMP_MENU;

  // Tema Empanadoteca con morph gradual de entrada y salida
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("brand-morph", "theme-empanadoteca");
    const t = window.setTimeout(() => html.classList.remove("brand-morph"), 1000);
    return () => {
      window.clearTimeout(t);
      html.classList.add("brand-morph");
      html.classList.remove("theme-empanadoteca");
      window.setTimeout(() => html.classList.remove("brand-morph"), 1000);
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Decoración: blobs en la paleta Empanadoteca */}
      <div className="blob-float pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(179,40,45,0.14)" }} />
      <div className="blob-float-2 pointer-events-none absolute top-[28rem] -right-20 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(34,49,74,0.12)" }} />

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-grain relative max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-12 md:gap-14 items-center">
        <div className="hero-enter min-w-0 text-center md:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-empanadoteca.png"
            alt="Empanadoteca"
            className="float-y w-24 h-24 sm:w-28 sm:h-28 mx-auto md:mx-0 rounded-full"
            style={{ boxShadow: "0 16px 48px -12px rgba(179,40,45,0.45)" }}
          />
          <p className="font-script text-xl min-[400px]:text-2xl sm:text-3xl mt-5" style={{ color: RED }}>
            {t.empanadoteca.heroKicker}
          </p>
          <h1 className="font-display text-4xl min-[400px]:text-5xl sm:text-6xl font-bold tracking-wide mt-1" style={{ color: NAVY }}>
            EMPANADOTECA
          </h1>
          <p className="text-sm uppercase tracking-[0.25em] mt-3" style={{ color: MUTED }}>
            {t.empanadoteca.subtitle}
          </p>
          <p className="text-lg leading-relaxed mt-5 max-w-md mx-auto md:mx-0" style={{ color: MUTED }}>
            {t.empanadoteca.heroText}
          </p>
          <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
            <a
              href="#menu"
              className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold"
              style={{ background: "var(--gradient-emp)", boxShadow: RED_SHADOW }}
            >
              {t.empanadoteca.ctaMenu} <ArrowDown size={18} />
            </a>
            <a
              href={EMP.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold border transition hover:-translate-y-0.5"
              style={{ background: "rgba(255,253,248,0.8)", color: NAVY, borderColor: "rgba(34,49,74,0.25)" }}
            >
              <Instagram size={17} /> @empanadotecard
            </a>
          </div>
        </div>

        {/* Foto + sello de precio */}
        <div className="relative min-w-0 reveal" data-reveal="right">
          <div
            className="img-shine relative aspect-[4/3] md:aspect-[5/4] rounded-[2rem] overflow-hidden"
            style={{ boxShadow: "0 24px 60px -20px rgba(34,49,74,0.45)", outline: `1px solid ${CARD_BORDER}` }}
          >
            <Image
              src={EMP_PHOTOS.hero}
              alt="Empanadas de Empanadoteca"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div
            className="float-y absolute -top-6 -right-2 sm:-right-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-white rotate-12 border-4"
            style={{ background: "var(--gradient-emp)", borderColor: "#f6efe2", boxShadow: RED_SHADOW }}
          >
            <span className="text-[11px] uppercase tracking-widest opacity-90">{t.empanadoteca.fromPrice}</span>
            <span className="font-display font-bold text-xl sm:text-2xl leading-none mt-0.5">{formatRD(EMP_MIN_PRICE)}</span>
          </div>
        </div>
      </section>

      {/* ═══════════ SÚPER PASTELITO — la estrella ═══════════ */}
      <section className="relative px-6 py-16 md:py-20" style={{ background: NAVY }}>
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-60" />
        <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(179,40,45,0.35)" }} />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="relative reveal" data-reveal="left">
            <div className="img-shine relative aspect-[4/3] rounded-[2rem] overflow-hidden ring-4 ring-white/10">
              <Image
                src={EMP_PHOTOS.superPastelito}
                alt="Súper Pastelito"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <span
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-semibold uppercase tracking-widest"
              style={{ background: RED, boxShadow: RED_SHADOW }}
            >
              <Star size={13} fill="white" /> {t.empanadoteca.featuredBadge}
            </span>
          </div>

          <div className="text-center md:text-left reveal" data-reveal="right">
            <p className="font-script text-2xl sm:text-3xl" style={{ color: "#e9a4a6" }}>
              {t.empanadoteca.featuredKicker}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mt-1">
              {t.empanadoteca.featuredTitle}
            </h2>
            <p className="text-white/75 leading-relaxed mt-4 max-w-md mx-auto md:mx-0">
              {t.empanadoteca.featuredText}
            </p>
            <ul className="mt-7 space-y-3 max-w-md mx-auto md:mx-0 text-left">
              {EMP_FEATURED.map((item) => (
                <li key={item.name} className="flex items-baseline gap-3">
                  <span className="font-medium text-white">{item.name}</span>
                  <PriceLeader color="rgba(246,239,226,0.3)" />
                  <span
                    className="font-display font-bold text-lg whitespace-nowrap px-3 py-0.5 rounded-full text-white"
                    style={{ background: RED }}
                  >
                    {formatRD(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════ MENÚ ═══════════ */}
      <section id="menu" className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        <header className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <p className="font-script text-2xl sm:text-3xl" style={{ color: RED }}>{t.empanadoteca.menuKicker}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mt-1" style={{ color: NAVY }}>
            {t.empanadoteca.menuTitle}
          </h2>
          <p className="mt-3" style={{ color: MUTED }}>{t.empanadoteca.menuSubtitle}</p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <MenuCard group={tradicional} />
          <MenuCard group={venezolana} />
          {/* Catibías es la lista más corta: la acompaña una foto para equilibrar columnas */}
          <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6 md:col-span-2 lg:col-span-1 items-start">
            <MenuCard group={catibias} />
            <div
              className="img-shine relative aspect-[4/3] rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 16px 40px -16px rgba(34,49,74,0.35)", outline: `1px solid ${CARD_BORDER}` }}
            >
              <Image
                src={EMP_PHOTOS.empanadas}
                alt="Empanadas con salsas"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="relative max-w-3xl mx-auto px-6 pb-20 text-center">
        <div
          className="rounded-3xl px-8 py-10 backdrop-blur-md border reveal"
          data-reveal="scale"
          style={{
            background: CARD_BG,
            borderColor: "rgba(34,49,74,0.15)",
            boxShadow: "0 12px 40px rgba(179,40,45,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div
            className="float-y w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--gradient-emp)", boxShadow: "0 8px 24px -6px rgba(179,40,45,0.5)" }}
          >
            <Flame size={22} />
          </div>
          <p className="font-script text-2xl mt-4" style={{ color: RED }}>{t.empanadoteca.finalKicker}</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1" style={{ color: NAVY }}>
            {t.empanadoteca.finalTitle}
          </h2>
          <p className="mt-3 leading-relaxed" style={{ color: MUTED }}>{t.empanadoteca.finalText}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={EMP.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
              style={{ background: "var(--gradient-emp)", boxShadow: RED_SHADOW }}
            >
              <Instagram size={17} /> @empanadotecard
            </a>
            <a
              href={EMP.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border transition hover:-translate-y-0.5"
              style={{ background: "rgba(255,253,248,0.8)", color: NAVY, borderColor: "rgba(34,49,74,0.25)" }}
            >
              <MapPin size={17} /> {t.empanadoteca.directions}
            </a>
          </div>
        </div>

        {/* Volver a Kan M — efecto reverso */}
        <a
          href="/"
          onClick={wipeClickHandler(navigateWithWipe, "/", "kanm")}
          className="kanm-link btn-shine inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-full text-white font-semibold"
          style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
        >
          <ArrowLeft size={17} /> {t.empanadoteca.backTo} <span className="font-script text-lg leading-none">Kan M</span>
        </a>
      </section>
    </div>
  );
}
