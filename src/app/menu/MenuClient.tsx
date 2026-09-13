"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CakeSlice, CalendarHeart, Coffee, EggFried, MapPin, Sparkles } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import { CAFE_MENU, MENU_HERO_PHOTOS, formatRD, type MenuCategoryId, type MenuGroup, type MenuItem, type MenuPhoto } from "@/lib/cafeMenu";
import { BUSINESS } from "@/lib/bizInfo";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { useLang } from "@/lib/i18n/LanguageProvider";

/**
 * Menú del café: puramente informativo (sin carrito). Los productos y precios
 * viven en src/lib/cafeMenu.ts; el SEO en page.tsx. Las fotos son decorativas
 * (tira por categoría), no van al lado de cada producto.
 */

const CATEGORY_ICONS: Record<MenuCategoryId, typeof Coffee> = {
  brunch: EggFried,
  bebidas: Coffee,
  postres: CakeSlice,
};

// Aspecto de las fotos según cuántas hay en la fila (desktop).
const PHOTO_LAYOUT: Record<number, { cols: string; aspect: string }> = {
  3: { cols: "md:grid-cols-3", aspect: "aspect-[4/3]" },
  4: { cols: "md:grid-cols-4", aspect: "aspect-square" },
  6: { cols: "md:grid-cols-3 lg:grid-cols-6", aspect: "aspect-[4/5]" },
};

function PhotoStrip({ photos }: { photos: MenuPhoto[] }) {
  const layout = PHOTO_LAYOUT[photos.length] ?? PHOTO_LAYOUT[4];
  return (
    // Móvil: carrusel horizontal con snap; desktop: grilla.
    <div className="-mx-6 px-6 overflow-x-auto md:overflow-visible md:mx-0 md:px-0 snap-x snap-mandatory">
      <div className={`flex gap-4 md:grid ${layout.cols} md:gap-5`}>
        {photos.map((p) => (
          <figure
            key={p.src}
            className={`img-shine group relative ${layout.aspect} w-[72%] sm:w-[45%] md:w-auto shrink-0 snap-start rounded-3xl overflow-hidden shadow-card ring-1 ring-[rgba(241,112,151,0.18)]`}
          >
            <Image
              src={p.src}
              alt={p.caption ?? ""}
              fill
              sizes="(max-width: 768px) 72vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {p.caption && (
              <figcaption className="chip-glass absolute left-3 bottom-3 right-3 w-fit rounded-xl px-3 py-1 text-xs leading-snug font-medium text-foreground">
                {p.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const prices = item.prices ?? [];
  const single = prices.length === 1 && !prices[0].label ? prices[0] : null;
  const sized = single ? [] : prices;

  return (
    <li>
      <div className="flex items-baseline gap-3">
        <span className="font-medium text-foreground">{item.name}</span>
        {single && (
          <>
            <span aria-hidden className="flex-1 min-w-4 mb-[0.3em] border-b-2 border-dotted border-[rgba(241,112,151,0.35)]" />
            <span className="font-display font-semibold text-rose whitespace-nowrap">{formatRD(single.amount)}</span>
          </>
        )}
      </div>
      {item.desc && (
        <p className="text-sm text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
      )}
      {sized.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {sized.map((p) => (
            <span
              key={p.label ?? p.amount}
              className="inline-flex items-baseline gap-1.5 rounded-full bg-[rgba(248,179,197,0.25)] px-3 py-0.5"
            >
              <span className="text-xs text-muted-foreground">{p.label}</span>
              <span className="font-display font-semibold text-rose text-sm">{formatRD(p.amount)}</span>
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function GroupCard({ group }: { group: MenuGroup }) {
  const { t } = useLang();
  return (
    <article className="glass rounded-3xl p-6 md:p-8">
      <header className="flex items-center justify-between gap-3 pb-3 mb-5 border-b border-[rgba(241,112,151,0.2)]">
        <h3 className="font-display text-2xl leading-tight">{t.cafeMenu.groups[group.id]}</h3>
        {group.price != null && (
          <span className="shrink-0 inline-flex items-baseline gap-1 rounded-full px-3.5 py-1 text-white shadow-glow bg-gradient-rose">
            <span className="font-display font-semibold">{formatRD(group.price)}</span>
            <span className="text-xs opacity-85">{t.cafeMenu.eachPrice}</span>
          </span>
        )}
      </header>

      <ul className="space-y-4">
        {group.items.map((item) => (
          <MenuRow key={item.name} item={item} />
        ))}
      </ul>

      {group.toppings && (
        <div className="mt-6 rounded-2xl bg-[rgba(248,179,197,0.2)] border border-[rgba(241,112,151,0.15)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose">{t.cafeMenu.toppingsLabel}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{group.toppings.list}</p>
          <p className="flex items-baseline gap-3 mt-3 text-sm font-medium">
            {t.cafeMenu.extraToppings}
            <span aria-hidden className="flex-1 min-w-4 mb-[0.3em] border-b-2 border-dotted border-[rgba(241,112,151,0.35)]" />
            <span className="font-display font-semibold text-rose">{formatRD(group.toppings.extraPrice)}</span>
          </p>
        </div>
      )}

      {group.id === "latica" && (
        <Link
          href="/la-latica"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-rose hover:gap-2.5 transition-all"
        >
          {t.cafeMenu.laticaLink} <ArrowRight size={15} />
        </Link>
      )}
    </article>
  );
}

export default function MenuClient() {
  const { t } = useLang();
  const [active, setActive] = useState<MenuCategoryId>(CAFE_MENU[0].id);

  // Scroll-spy: resalta en la barra la categoría que está en pantalla.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id as MenuCategoryId);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    CAFE_MENU.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ═══════════ HERO — carrusel de fotos del menú, mismo estilo que el inicio ═══════════ */}
      <HeroCarousel images={MENU_HERO_PHOTOS} autoplayMs={6000} minHeight="70vh" priorityFirst>
        <div className="hero-enter max-w-3xl mx-auto px-6 pt-14 pb-24 md:pt-16 md:pb-28 text-center">
          <Image
            src="/logo-kanm.png"
            alt="Kan M Repostería y Catering"
            width={1531}
            height={1027}
            priority
            className="mx-auto h-24 md:h-32 w-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
          />
          <span className="float-y mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-sm font-medium tracking-wide text-white">
            <Coffee size={15} /> {t.cafeMenu.heroKicker}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[1.05] text-white drop-shadow-lg">
            {t.cafeMenu.heroTitlePre}{" "}
            <span
              className="font-script italic"
              style={{
                background: "linear-gradient(135deg,#f17097 0%,#f4899e 50%,#e85d82 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t.cafeMenu.heroTitleScript}
            </span>
          </h1>
          <p className="text-white/85 mt-5 max-w-xl mx-auto text-base md:text-lg leading-relaxed drop-shadow">
            {t.cafeMenu.heroSubtitle}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-glow bg-gradient-rose">
            <Sparkles size={13} /> {t.cafeMenu.taxIncluded}
          </span>
        </div>
      </HeroCarousel>

      {/* ═══════════ BARRA DE CATEGORÍAS (sticky bajo el navbar) ═══════════ */}
      <nav aria-label={t.cafeMenu.jumpTo} className="sticky top-20 z-40 px-3 py-4">
        <div className="glass-strong mx-auto w-fit max-w-full rounded-full p-1.5 sm:p-2 flex gap-1 sm:gap-2">
          {CAFE_MENU.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            const isActive = active === c.id;
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`flex items-center gap-1.5 sm:gap-2.5 px-3.5 sm:px-7 py-2.5 sm:py-3 rounded-full text-[15px] sm:text-lg font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "text-white shadow-glow bg-gradient-rose"
                    : "text-[var(--muted-foreground)] hover:text-rose hover:bg-white/60"
                }`}
              >
                <Icon className="shrink-0 w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {t.cafeMenu.categories[c.id].title}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ═══════════ CATEGORÍAS ═══════════ */}
      {CAFE_MENU.map((cat, i) => {
        const copy = t.cafeMenu.categories[cat.id];
        const left = cat.groups.slice(0, cat.splitAt);
        const right = cat.groups.slice(cat.splitAt);
        return (
          <div key={cat.id}>
            {i > 0 && <div className="section-divider" />}
            <section id={cat.id} className="scroll-mt-16 max-w-7xl mx-auto px-6 py-12 md:py-16">
              <header className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
                <p className="font-script text-2xl md:text-3xl text-rose">{copy.kicker}</p>
                <h2 className="font-display text-4xl md:text-5xl mt-1">{copy.title}</h2>
                {cat.id === "brunch" && (
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-glow bg-gradient-rose">
                    <CalendarHeart size={14} /> {t.cafeMenu.brunchBadge}
                  </span>
                )}
              </header>

              <PhotoStrip photos={cat.photos} />

              <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-6 items-start">
                {[left, right].map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-6">
                    {col.map((g) => (
                      <GroupCard key={g.id} group={g} />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      })}

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="max-w-5xl mx-auto px-6 pt-4 pb-20">
        <div className="glass-pink bg-mesh rounded-3xl p-8 md:p-12 text-center reveal" data-reveal="scale">
          <p className="font-script text-2xl text-rose">{t.cafeMenu.finalKicker}</p>
          <h2 className="font-display text-3xl md:text-4xl mt-1">{t.cafeMenu.finalTitle}</h2>
          <p className="text-[var(--muted-foreground)] mt-3">{t.cafeMenu.finalText}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-md bg-gradient-rose"
            >
              {t.cafeMenu.ctaWhatsapp} <ArrowRight size={18} />
            </a>
            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[var(--rose)] text-[var(--rose)] font-semibold hover:bg-[rgba(241,112,151,0.05)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <MapPin size={18} /> {t.cafeMenu.ctaDirections}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
