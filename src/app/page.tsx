import Image from "next/image";
import Link from "next/link";
import { Sparkles, Heart, Cake, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { IMAGES } from "@/lib/images";
import DeliveryButtons from "@/components/DeliveryButtons";
import HeroCarousel from "@/components/HeroCarousel";
import RotatingFeatured from "@/components/RotatingFeatured";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.product.findMany({ take: 6, orderBy: { createdAt: "desc" } });

  return (
    <>
      <style>{`
        /* Wave: runs once (1.8s total) then pauses 10s, repeat */
        @keyframes wave {
          0%   { transform: translateY(0); }
          20%  { transform: translateY(-7px); }
          40%  { transform: translateY(3px); }
          60%  { transform: translateY(-3px); }
          80%  { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
        .wave-char {
          display: inline-block;
          /* duration = 1.8s wave + 10s pause = 11.8s cycle, runs 1 wave per cycle */
          animation: wave 11.8s ease-in-out infinite;
        }
        .wave-char:nth-child(1)  { animation-delay: 0s; }
        .wave-char:nth-child(2)  { animation-delay: 0.08s; }
        .wave-char:nth-child(3)  { animation-delay: 0.16s; }
        .wave-char:nth-child(4)  { animation-delay: 0.24s; }
        .wave-char:nth-child(5)  { animation-delay: 0.32s; }
        .wave-char:nth-child(6)  { animation-delay: 0.40s; }
        .wave-char:nth-child(7)  { animation-delay: 0.48s; }
        .wave-char:nth-child(8)  { animation-delay: 0.56s; }
        .wave-char:nth-child(9)  { animation-delay: 0.64s; }
        .wave-char:nth-child(10) { animation-delay: 0.72s; }
        .wave-char:nth-child(11) { animation-delay: 0.80s; }

        @keyframes ribbon-float {
          0%,100% { transform: scaleX(1) translateY(0); }
          50%      { transform: scaleX(1.01) translateY(-3px); }
        }
        .ribbon-section { animation: ribbon-float 4s ease-in-out infinite; }

        @keyframes googleBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
      `}</style>

      {/* HERO */}
      <HeroCarousel images={IMAGES.heroCarousel}>
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-xs uppercase tracking-widest text-white">
              <Sparkles size={14} /> Repostería Artesanal y Café
            </span>

            {/* Title with wave animation on "dias" and "eventos" */}
            <h1 className="font-display text-4xl md:text-6xl leading-[1.1] mt-4 text-white drop-shadow-lg">
              Endulzamos<br />
              tus{" "}
              <span
                className="font-script italic"
                style={{
                  background: "linear-gradient(135deg,#f17097 0%,#f4899e 50%,#e85d82 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >dias</span>
              {" "}y tus{" "}
              <span
                className="font-script italic"
                style={{
                  background: "linear-gradient(135deg,#f17097 0%,#f4899e 50%,#e85d82 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >eventos</span>
            </h1>

            <p className="text-base text-white/85 mt-4 max-w-md leading-relaxed drop-shadow">
              Pasteles artesanales, postres exclusivos y mesas dulces personalizadas para bodas,
              cumpleaños y eventos especiales en todo Santo Domingo. Ubicados en la Zona Colonial.
            </p>

            {/* 3 buttons: Cotizar | Ver catálogo | Contáctanos */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/cotizar"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold shadow-soft hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
              >
                Cotizar <ArrowRight size={18} />
              </Link>
              <Link
                href="/catalogo"
                className="inline-flex items-center px-6 py-3 rounded-full bg-white/15 backdrop-blur-sm border border-white/40 text-white hover:bg-white/25 transition"
              >
                Ver catálogo
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 transition"
              >
                Contáctanos
              </Link>
            </div>
            <DeliveryButtons variant="hero" />
          </div>

          <div className="hidden sm:inline-flex mt-7 items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/30">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}>
              <Heart size={18} />
            </div>
            <div>
              <div className="font-display text-lg leading-none text-white">+500 eventos</div>
              <div className="text-xs text-white/70 mt-1">endulzados con amor</div>
            </div>
          </div>
        </div>
      </HeroCarousel>

      {/* FEATURED */}
      <section className="relative max-w-7xl mx-auto px-6 py-10 reveal">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-script text-xl text-rose">Lo más pedido</p>
            <h2 className="font-display text-2xl md:text-3xl mt-0.5">Nuestras creaciones</h2>
          </div>
          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-all duration-200"
            style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
          >
            Ver todos <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <RotatingFeatured products={featured} />
      </section>

      <div className="section-divider" />

      {/* CATERING */}
      <section className="relative overflow-hidden py-10 px-6">
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[var(--blush)]/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[var(--accent)]/40 blur-3xl" />
        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center reveal">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-card">
            <Image src={IMAGES.homeCatering} alt="Catering Kan M" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="glass rounded-3xl p-6 reveal reveal-delay-1">
            <p className="font-script text-2xl text-rose">para tu evento</p>
            <h2 className="font-display text-2xl md:text-3xl mt-1">
              Catering que{" "}
              <span className="font-script italic text-gradient-rose">
                enamora
              </span>
            </h2>
            <ul className="mt-5 space-y-2.5 text-muted-foreground">
              {["Bodas y compromisos", "Cumpleaños temáticos", "Eventos recreativos"].map((x) => (
                <li key={x} className="flex items-center gap-3"><Cake size={17} className="text-rose shrink-0" /> {x}</li>
              ))}
            </ul>
            <Link
              href="/cotizar"
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white shadow-soft hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
            >
              Cotizar <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* BRUNCH — ribbon/bow style */}
      <section className="relative py-10 px-6 text-center">
        {/* Ribbon background SVG — no overflow-hidden so loops show fully */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <svg viewBox="0 0 800 220" className="w-full max-w-4xl" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
            {/* Left loop */}
            <path d="M400,100 C360,30 210,15 120,62 C55,95 72,152 148,152 C232,152 328,112 400,100 Z" fill="#f07097" />
            {/* Right loop */}
            <path d="M400,100 C440,30 590,15 680,62 C745,95 728,152 652,152 C568,152 472,112 400,100 Z" fill="#f07097" />
            {/* Center knot */}
            <ellipse cx="400" cy="100" rx="30" ry="24" fill="#d8b375" />
            {/* Tails — kept inside viewBox */}
            <path d="M388,116 C362,148 308,178 262,192" stroke="#f07097" strokeWidth="20" fill="none" strokeLinecap="round"/>
            <path d="M412,116 C438,148 492,178 538,192" stroke="#f07097" strokeWidth="20" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[var(--blush)]/20 to-transparent" />

        <div className="ribbon-section relative">
          <p className="font-script text-2xl md:text-4xl text-gradient-rose">
            Brunch todo el dia, todos los dias
          </p>
          <Link
            href="/catalogo?cat=brunch"
            className="group inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-all duration-200"
            style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
          >
            Ver catálogo de Brunch
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      <div className="section-divider" />

      {/* TESTIMONIALS */}
      <section className="bg-secondary/40 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-7 reveal">
            <p className="font-script text-2xl text-rose">testimonios</p>
            <h2 className="font-display text-2xl md:text-3xl mt-1">Experiencias reales de clientes</h2>
            <a href="https://www.google.com/search?q=Kan+M+Reposteria+y+Catering" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-rose transition-colors">
              {/* Google logo */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-medium">Google Reviews</span>
              <span className="text-muted-foreground/60">· Ver todas las reseñas</span>
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { q: "Mi repostería favorita, hacen los mejores bizcochos y postres que he probado.", n: "Rosalis García", r: "⭐⭐⭐⭐⭐ · Hace 2 años" },
              { q: "Maravilloso lugar, los mejores postres de la Zona Colonial, sus galletas, brownies, empanadas son TOP, espero volver pronto.", n: "Miguel Antonio Sierra Castro", r: "⭐⭐⭐⭐⭐ · Local Guide" },
              { q: "Sus dulces son la gloria, especialmente ese bizcocho de Fresa y alfajores 🍓💗 hicieron que nuestra noche fuera mejor, gracias por el excelente servicio y los postres 💗 volveremos sin lugar a dudas 100/5", n: "Franchesca Nicole Romero", r: "⭐⭐⭐⭐⭐ · Local Guide" },
            ].map((t, i) => (
              <a key={i} href="https://www.google.com/maps/search/Kan+M+Reposteria+y+Catering+Santo+Domingo" target="_blank" rel="noopener noreferrer"
                className={`bg-card rounded-2xl border border-[var(--border)]/60 shadow-card p-6 block hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5 reveal reveal-delay-${i + 1}`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-xs font-medium text-muted-foreground">Google Review</span>
                </div>
                <div className="font-display text-2xl leading-none" style={{ color: "#f07097" }}>"</div>
                <p className="text-foreground/80 leading-relaxed mt-1 text-sm">{t.q}</p>
                <div className="border-t border-[var(--border)]/60 mt-5 pt-4">
                  <div className="font-semibold text-sm">{t.n}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* FINAL CTA — full carousel */}
      <section className="relative overflow-hidden reveal">
        {/* Full-width carousel as background */}
        <HeroCarousel images={IMAGES.heroCarousel} autoplayMs={5000}>
          <div className="max-w-4xl mx-auto px-6 py-14 text-center">
            {/* Glass card over the carousel */}
            <div className="glass rounded-3xl px-8 py-12 inline-block w-full">
              <p className="font-script text-2xl text-rose">hagamos algo especial</p>
              <h2 className="font-display text-2xl md:text-4xl mt-2">
                Hagamos juntos <span className="font-script text-gradient-rose">tu evento</span>
              </h2>
              <p className="text-foreground/70 mt-4 max-w-xl mx-auto leading-relaxed">
                Cuéntanos qué imaginas y lo creamos. Cada detalle, cada sabor, hecho a tu medida. Completa la cotización y nuestro equipo te contactará para confirmar disponibilidad.
              </p>
              <Link
                href="/cotizar"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-base shadow-soft hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
              >
                Cotizar <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </HeroCarousel>
      </section>
    </>
  );
}
