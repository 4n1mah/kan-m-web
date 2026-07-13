"use client";
// Banner del home que presenta Empanadoteca (segundo negocio) con el
// botón "Picaderas" que absorbe los colores del logo al hover y hace
// el wipe de cambio de marca al click.
import { ArrowRight } from "lucide-react";
import { useWipe, wipeClickHandler } from "@/components/BrandWipe";

export default function EmpanadotecaBanner() {
  const { navigateWithWipe } = useWipe();

  return (
    <section className="relative overflow-hidden py-12 px-6 bg-grain" style={{ background: "#f6efe2" }}>
      {/* Acentos decorativos rojo/navy */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(179,40,45,0.12)" }} />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(34,49,74,0.1)" }} />

      <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-6 sm:gap-10 reveal" data-reveal="scale">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-empanadoteca.png"
          alt="Empanadoteca"
          className="float-y w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-lg shrink-0"
          style={{ boxShadow: "0 12px 36px -10px rgba(179,40,45,0.4)" }}
        />
        <div className="flex-1 text-center sm:text-left">
          <p className="font-script text-2xl" style={{ color: "#b3282d" }}>¿antojo de empanadas?</p>
          <h2 className="font-display text-2xl md:text-3xl mt-1" style={{ color: "#22314a" }}>
            Conoce <span className="font-bold tracking-wide">EMPANADOTECA</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "#5d6b83" }}>
            Tradicionales, venezolanas y catibías — nuestro otro sabor, en la Zona Colonial.
          </p>
        </div>
        <a
          href="/picaderas"
          onClick={wipeClickHandler(navigateWithWipe, "/picaderas", "empanadoteca")}
          className="empanadoteca-link group inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shrink-0"
          style={{ background: "#22314a" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-empanadoteca.png" alt="" aria-hidden className="emp-mini-logo h-5 rounded-full" />
          Picaderas
          <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </section>
  );
}
