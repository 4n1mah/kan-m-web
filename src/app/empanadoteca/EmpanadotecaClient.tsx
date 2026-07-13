"use client";
// ─────────────────────────────────────────────────────────────
//  Empanadoteca — esqueleto de la sección (V1: "estamos cocinando").
//
//  Al montar activa el tema Empanadoteca (variables CSS en <html>)
//  con un morph gradual de colores; al salir lo revierte igual.
//  Las secciones comentadas abajo son la estructura para llenar
//  después (menú, horario, galería...).
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Instagram, MapPin, ArrowLeft, Flame } from "lucide-react";
import { useWipe, wipeClickHandler } from "@/components/BrandWipe";

const EMP = {
  instagram: "https://instagram.com/empanadotecard",
  maps: "https://maps.app.goo.gl/BJYk1J1fWJonbhzF7",
};

export default function EmpanadotecaClient() {
  const { navigateWithWipe } = useWipe();

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
      <div className="blob-float-2 pointer-events-none absolute top-1/3 -right-20 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(34,49,74,0.12)" }} />

      {/* HERO — estamos cocinando */}
      <section className="bg-grain relative max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center">
        <div className="hero-enter">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-empanadoteca.png"
            alt="Empanadoteca"
            className="float-y w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full shadow-xl"
            style={{ boxShadow: "0 16px 48px -12px rgba(179,40,45,0.45)" }}
          />
          <p className="font-script text-2xl mt-6" style={{ color: "var(--emp-red)" }}>
            las mejores empanadas de RD
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wide mt-1" style={{ color: "var(--emp-navy)" }}>
            EMPANADOTECA
          </h1>
          <p className="text-sm uppercase tracking-[0.25em] mt-2" style={{ color: "var(--muted-foreground)" }}>
            Tradicionales · Venezolanas · Catibías
          </p>

          {/* Card "cocinando" */}
          <div
            className="mt-10 rounded-3xl px-8 py-10 backdrop-blur-md border"
            style={{
              background: "rgba(255,253,248,0.75)",
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
            <h2 className="font-display text-2xl sm:text-3xl mt-4" style={{ color: "var(--emp-navy)" }}>
              Estamos cocinando esta página…
            </h2>
            <p className="mt-3 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              🥟 ¡Mantente al tanto! Muy pronto podrás ver nuestro menú de
              empanadas aquí mismo. Mientras tanto, síguenos y visítanos.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={EMP.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
                style={{ background: "var(--gradient-emp)", boxShadow: "0 10px 30px -10px rgba(179,40,45,0.55)" }}
              >
                <Instagram size={17} /> @empanadotecard
              </a>
              <a
                href={EMP.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border transition hover:-translate-y-0.5"
                style={{ background: "rgba(255,253,248,0.8)", color: "var(--emp-navy)", borderColor: "rgba(34,49,74,0.25)" }}
              >
                <MapPin size={17} /> Cómo llegar
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
            <ArrowLeft size={17} /> Volver a <span className="font-script text-lg leading-none">Kan M</span>
          </a>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          Estructura futura de la sección (esqueleto):

          {/* MENÚ — próximamente: grid de empanadas por tipo
              (tradicionales / venezolanas / catibías) con precios *\/}

          {/* HORARIO — próximamente: card con horario del local *\/}

          {/* GALERÍA — próximamente: fotos / reels destacados *\/}

          {/* BAR — próximamente: bebidas y cocteles *\/}
         ──────────────────────────────────────────────────────── */}
    </div>
  );
}
