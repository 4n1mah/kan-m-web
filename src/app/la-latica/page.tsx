import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Sparkles, ArrowRight, Utensils, ShoppingBag } from "lucide-react";
import DeliveryButtons from "@/components/DeliveryButtons";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { LATICA } from "@/lib/bizInfo";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "La Latica — Postres en lata | Kan M Repostería",
  description:
    "La Latica de Kan M: postres en lata fáciles de abrir y comer con cuchara hasta el fondo. El nuevo producto estrella. Pídela por WhatsApp o Uber Eats.",
  alternates: { canonical: "/la-latica" },
  openGraph: {
    title: "La Latica — El nuevo antojo en lata de Kan M",
    description:
      "Postres en lata para comer con cuchara hasta el fondo. Producto estrella de Kan M Repostería y Catering.",
    url: "/la-latica",
  },
};

/**
 * Sección puramente informativa de La Latica (producto estrella).
 * Las fotos viven en IMAGES.laticas; mientras el array esté vacío se muestran
 * placeholders "Foto próximamente" y las fotos reales aparecen solas al pegarlas.
 * El copy lleva marcadores TODO para completar cuando llegue la info final.
 */

// Tile de foto: renderiza <img> si hay URL, si no un placeholder de marca.
function PhotoTile({
  src,
  label,
  aspect = "aspect-square",
  eager = false,
}: {
  src?: string;
  label?: string;
  aspect?: string;
  eager?: boolean;
}) {
  return (
    <div className={`img-shine relative ${aspect} rounded-3xl overflow-hidden shadow-card ring-1 ring-[var(--rose)]/15`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label ?? "La Latica"}
          className="w-full h-full object-cover"
          loading={eager ? "eager" : "lazy"}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/90"
          style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 55%,#e85d82 100%)" }}
        >
          <Camera size={26} className="opacity-90" />
          <span className="text-xs font-medium tracking-wide">Foto próximamente</span>
        </div>
      )}
    </div>
  );
}

export default function LaLaticaPage() {
  const photos = IMAGES.laticas;
  const hasPhotos = photos.length > 0;
  const heroPhoto = photos[0];
  const conceptoPhoto = photos[1] ?? photos[0];
  // Galería: el resto de fotos (sin repetir hero/concepto). Con pocas fotos usa
  // todas; sin fotos, 6 placeholders para mostrar el layout.
  const galleryPhotos = photos.length > 2 ? photos.slice(2) : photos;
  const galleryTiles = hasPhotos
    ? galleryPhotos
    : Array.from({ length: 6 }, () => undefined);

  return (
    <div className="min-h-screen">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-grain">
        {/* Blobs decorativos de marca */}
        <div className="blob-float pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[var(--blush)]/40 blur-3xl" />
        <div className="blob-float-2 pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[var(--rose)]/25 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Texto */}
          <div className="hero-enter relative">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-semibold uppercase tracking-widest shadow-glow bg-gradient-rose">
              <Sparkles size={14} /> Nuevo · producto estrella
            </span>
            <p className="font-script text-2xl md:text-3xl text-rose mt-5">el antojo del momento</p>
            <h1 className="font-display text-5xl md:text-6xl mt-1 leading-[1.05]">
              La <span className="font-script text-gradient-rose">Latica</span>
            </h1>
            <p className="text-[var(--muted-foreground)] mt-5 max-w-md text-lg leading-relaxed">
              {LATICA.tagline}
            </p>

            {/* Precio */}
            <div className="mt-6 inline-flex items-baseline gap-2 glass rounded-2xl px-5 py-3">
              <span className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Precio</span>
              <span className="font-display text-3xl text-rose">{LATICA.priceDisplay}</span>
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={waLink(WA_MESSAGES.product(LATICA.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-md bg-gradient-rose"
              >
                Pídela por WhatsApp <ArrowRight size={18} />
              </a>
            </div>
            <div className="mt-4 max-w-xs">
              <DeliveryButtons variant="card" />
            </div>
          </div>

          {/* Foto destacada */}
          <div className="reveal" data-reveal="right">
            <PhotoTile
              src={heroPhoto}
              label="La Latica"
              aspect="aspect-[4/5]"
              eager
            />
          </div>
        </div>
      </section>

      {/* ═══════════ CONCEPTO ═══════════ */}
      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="reveal" data-reveal="left">
            <PhotoTile
              src={conceptoPhoto}
              label="Postre en lata"
              aspect="aspect-[4/3]"
            />
          </div>
          <div className="reveal" data-reveal="right">
            <p className="font-script text-2xl text-rose">¿qué es?</p>
            <h2 className="font-display text-3xl md:text-4xl mt-1">
              Cuchara hasta el fondo
            </h2>
            <p className="text-[var(--muted-foreground)] mt-5 leading-relaxed">
              {/* TODO: reemplazar por el copy final de La Latica */}
              Postres en lata pensados para disfrutar sin complicaciones: abres, tomas la
              cuchara y llegas hasta el fondo. Capas cremosas, textura suave y ese sabor
              casero de Kan M en un formato listo para llevar.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                { Icon: Utensils, t: "Fáciles de comer", d: "Ábrela y disfruta con cuchara, donde quieras." },
                { Icon: Sparkles, t: "Capas cremosas", d: "Textura suave hasta el último bocado." },
                { Icon: ShoppingBag, t: "Listas para llevar", d: "Perfectas para regalar o darte el gusto." },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-glow"
                    style={{ background: "linear-gradient(135deg,#f9c4d4 0%,#f07097 100%)" }}
                  >
                    <f.Icon size={17} />
                  </span>
                  <span>
                    <span className="font-semibold">{f.t}</span>
                    <span className="block text-sm text-[var(--muted-foreground)] mt-0.5">{f.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════ GALERÍA ═══════════ */}
      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="font-script text-2xl text-rose">para antojarte</p>
          <h2 className="font-display text-3xl md:text-4xl mt-1">Nuestras laticas</h2>
          <p className="text-[var(--muted-foreground)] mt-3">
            {/* TODO: ajustar cuando estén los sabores/fotos finales */}
            Un vistazo a lo que te espera. Pronto más sabores y presentaciones.
          </p>
        </div>

        <div className="stagger-fade grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryTiles.map((src, i) => (
            <PhotoTile key={i} src={src} label={`La Latica ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="glass-pink bg-mesh rounded-3xl p-8 md:p-12 text-center reveal" data-reveal="scale">
          <p className="font-script text-2xl text-rose">no te quedes con las ganas</p>
          <h2 className="font-display text-3xl md:text-4xl mt-1">Pide tu Latica hoy</h2>
          <p className="text-[var(--muted-foreground)] mt-3">
            Solo <span className="font-semibold text-rose">{LATICA.priceDisplay}</span> · disponible por WhatsApp y Uber Eats.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={waLink(WA_MESSAGES.product(LATICA.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-md bg-gradient-rose"
            >
              Pídela por WhatsApp <ArrowRight size={18} />
            </a>
            <Link
              href="/catalogo?cat=laticas"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[var(--rose)] text-[var(--rose)] font-semibold hover:bg-[var(--rose)]/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Ver en el catálogo
            </Link>
          </div>
          <div className="mt-5 max-w-xs mx-auto">
            <DeliveryButtons variant="card" />
          </div>
        </div>
      </section>
    </div>
  );
}
