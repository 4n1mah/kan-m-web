"use client";
import { useState } from "react";
import { Cake, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { IMAGES } from "@/lib/images";

/**
 * ============================================================
 *  PARA CAMBIAR LAS FOTOS DE CATERING:
 *  Edita src/lib/images.ts y cambia las URLs de:
 *    - IMAGES.cateringPasteles  → Pasteles personalizados
 *    - IMAGES.cateringBodas     → Bodas
 *    - IMAGES.cateringCumple    → Cumpleaños
 *    - IMAGES.cateringEventos   → Eventos recreativos
 *  Puedes poner varias fotos por sección usando un array:
 *    cateringBodas: ["url1", "url2", "url3"]
 *  (requiere ajustar el tipo en images.ts también)
 * ============================================================
 */

const services = [
  {
    title: "Pasteles personalizados",
    desc: "Diseñamos el pastel de tus sueños desde cero — tamaño, sabor, relleno y decoración a tu gusto. Cada detalle pensado para hacer ese momento inolvidable.",
    // 👇 Agrega más fotos al array para que se vean en el carrusel de esta sección
    imgs: [IMAGES.cateringPasteles],
    bullets: ["Diseño exclusivo para ti", "Sabores y rellenos a elección", "Desde una talla hasta varios pisos"],
  },
  {
    title: "Bodas",
    desc: "Mesas dulces personalizadas, pasteles de varios pisos y detalles que marcan el día más importante.",
    imgs: [IMAGES.cateringBodas],
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
  },
  {
    title: "Cumpleaños",
    desc: "Temáticas, sabores y presentaciones únicas para celebrar a quienes amas.",
    imgs: [IMAGES.cateringCumple],
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
  },
  {
    title: "Eventos recreativos",
    desc: "Baby showers, graduaciones, coffee breaks y catering boutique con atención al detalle. (cumpleaños, baby showers, graduaciones, etc.)",
    imgs: [IMAGES.cateringEventos],
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
  },
];

function ServiceCarousel({ imgs, title }: { imgs: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  const next = () => setIdx((i) => (i + 1) % imgs.length);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-card bg-black" style={{ aspectRatio: "3/4" }}>
      {/* Images */}
      {imgs.map((src, i) => (
        <div
          key={src + i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
      ))}

      {/* Arrows — only show when more than 1 image */}
      {imgs.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CateringPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="font-script text-2xl text-rose">para tu evento</p>
        <h1 className="font-display text-4xl md:text-5xl mt-1">
          Catering que <span className="font-script text-gradient-rose italic">enamora</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Diseñamos experiencias dulces a medida de tu evento, con productos artesanales y servicio impecable.
        </p>
      </div>

      <div className="space-y-24">
        {services.map((s, i) => (
          <div
            key={s.title}
            className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}
          >
            {/* Image carousel — portrait friendly */}
            <ServiceCarousel imgs={s.imgs} title={s.title} />

            {/* Text */}
            <div>
              <h2 className="font-display text-3xl md:text-4xl">{s.title}</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">{s.desc}</p>
              <ul className="mt-6 space-y-2 text-muted-foreground">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <Cake size={16} className="text-rose shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <a
                href={waLink(WA_MESSAGES.catering)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 transition"
              >
                Cotizar Eventos <ArrowRight size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
