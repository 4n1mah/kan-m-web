"use client";
import { useState, useEffect } from "react";
import { Cake, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import HeroCarousel from "@/components/HeroCarousel";
import Lightbox from "@/components/Lightbox";

const COTIZAR_MAP: Record<string, string> = {
  "Pasteles personalizados": "Cumpleaños",
  "Bodas":                   "Boda / Compromiso",
  "Mesa de dulces":          "Otro",
  "Cumpleaños":              "Cumpleaños",
  "Eventos recreativos":     "Otro",
};

const HERO_IMAGES = [
  IMAGES.cateringPasteles[0],
  IMAGES.cateringBodas[0],
  IMAGES.mesaDeDulces[0],
  IMAGES.cateringCumple[0],
  IMAGES.cateringEventos[0],
];

const services = [
  {
    title: "Pasteles personalizados",
    desc: "Diseñamos el pastel de tus sueños desde cero: tamaño, sabor, relleno y decoración a tu gusto. Cada detalle pensado para hacer ese momento inolvidable.",
    imgs: IMAGES.cateringPasteles,
    bullets: ["Diseño exclusivo para ti", "Sabores y rellenos a elección", "Desde una talla hasta varios pisos"],
    selectedItem: "Pastel personalizado",
  },
  {
    title: "Bodas",
    desc: "Mesas dulces personalizadas, pasteles de varios pisos y detalles que marcan el día más importante.",
    imgs: IMAGES.cateringBodas,
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
    selectedItem: "Pastel personalizado",
  },
  {
    title: "Mesa de dulces",
    desc: "Postres artesanales y diseños exclusivos que endulzan tus momentos especiales.",
    imgs: IMAGES.mesaDeDulces,
    bullets: ["Variedad gourmet", "Decoración temática", "Montaje incluido"],
    selectedItem: "Mesa dulce completa",
  },
  {
    title: "Cumpleaños",
    desc: "Temáticas, sabores y presentaciones únicas para celebrar a quienes amas.",
    imgs: IMAGES.cateringCumple,
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
    selectedItem: "Pastel personalizado",
  },
  {
    title: "Eventos recreativos",
    desc: "Baby showers, graduaciones, coffee breaks y catering boutique con atención al detalle.",
    imgs: IMAGES.cateringEventos,
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
    selectedItem: "Catering de evento",
  },
];

function ServiceCarousel({ imgs, title }: { imgs: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (imgs.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 4500);
    return () => clearInterval(id);
  }, [imgs.length]);

  return (
    <>
      <div
        className="relative w-full rounded-3xl overflow-hidden shadow-card cursor-zoom-in"
        style={{ aspectRatio: "4/3" }}
        onClick={() => setLightbox(true)}
        title="Clic para ver en grande"
      >
        {imgs.map((src, i) => (
          <div key={src + i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === idx ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={title} className="w-full h-full object-cover object-center" loading="lazy" />
          </div>
        ))}

        {/* Expand hint */}
        <div className="absolute top-3 right-3 bg-black/40 text-white rounded-full px-2.5 py-1 text-xs flex items-center gap-1 opacity-70">
          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M3 3h5M3 3v5M17 3h-5M17 3v5M3 17h5M3 17v-5M17 17h-5M17 17v-5"/>
          </svg>
          Ver
        </div>

        {imgs.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + imgs.length) % imgs.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % imgs.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition z-10"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <Lightbox images={imgs} startIndex={idx} onClose={() => setLightbox(false)} />
      )}
    </>
  );
}

function buildCotizarUrl(service: typeof services[number]) {
  const params = new URLSearchParams();
  const eventType = COTIZAR_MAP[service.title] ?? "";
  if (eventType) params.set("eventType", eventType);
  if (service.selectedItem) params.set("item", service.selectedItem);
  return `/cotizar?${params.toString()}`;
}

export default function CateringPage() {
  return (
    <div>
      {/* Hero carousel */}
      <HeroCarousel images={HERO_IMAGES} autoplayMs={4000} minHeight="46vh">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          {/* Decorative pill */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-xs uppercase tracking-widest text-white/90 mb-6">
            ✦ Repostería artesanal · Eventos · Catering
          </span>

          <p className="font-script text-2xl md:text-3xl drop-shadow" style={{ color: "#f8d5a3" }}>
            para tus eventos
          </p>

          <h1 className="font-display text-4xl md:text-5xl mt-2 text-white drop-shadow-lg leading-[1.1]">
            Catering que{" "}
            <span
              className="font-script italic"
              style={{
                background: "linear-gradient(135deg,#f17097 0%,#f4a050 55%,#d8b375 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontSize: "1.15em",
              }}
            >
              enamora
            </span>
          </h1>

          <p className="text-white/80 mt-4 max-w-xl mx-auto leading-relaxed text-sm drop-shadow">
            Diseñamos experiencias dulces a medida de tu evento,<br className="hidden md:block" />
            con productos artesanales y servicio impecable.
          </p>

          {/* Service quick-links */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["Pasteles", "Bodas", "Mesa de dulces", "Cumpleaños", "Eventos"].map((label) => (
              <span
                key={label}
                className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white/90 text-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </HeroCarousel>

      {/* Services — alternating layout, info in glass box */}
      <section className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {services.map((s, i) => (
          <div
            key={s.title}
            className={`grid md:grid-cols-2 gap-2 md:gap-8 items-center reveal ${i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}
          >
            {/* Carousel */}
            <ServiceCarousel imgs={s.imgs} title={s.title} />

            {/* Glass info box — same style as "catering que enamora" on homepage */}
            <div className="glass rounded-3xl p-6">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold mb-4"
                style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
              >
                {i + 1}
              </span>
              <h2 className="font-display text-xl md:text-2xl">{s.title}</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed text-sm">{s.desc}</p>
              <ul className="mt-3 space-y-1.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cake size={15} className="shrink-0" style={{ color: "#f07097" }} /> {b}
                  </li>
                ))}
              </ul>
              <Link
                href={buildCotizarUrl(s)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition shadow-sm"
                style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
              >
                Cotizar <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
