"use client";
import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Sparkles, ArrowRight } from "lucide-react";
import ProductCard, { Product } from "@/components/ProductCard";
import { CartProvider } from "@/components/CartContext";
import CartFab from "@/components/CartFab";
import CartDrawer from "@/components/CartDrawer";
import { useSiteSettings } from "@/components/useSiteSettings";
import { useLang } from "@/lib/i18n/LanguageProvider";

// Ids de categoría estables (independientes del idioma) para validar el
// parámetro ?cat= de la URL. Las etiquetas visibles vienen del diccionario.
const CATEGORY_IDS = ["all", "cakes", "desserts", "events", "picaderas", "brunch", "drinks", "laticas"];

function CatalogContent({ initialProducts }: { initialProducts: Product[] }) {
  const { t } = useLang();
  const CATEGORIES = t.catalog.categories;
  const [active, setActive]   = useState("all");
  const [gridKey, setGridKey] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat && CATEGORY_IDS.includes(cat)) setActive(cat);
  }, [searchParams]);

  const visible = useMemo(
    () => active === "all" ? initialProducts : initialProducts.filter((p) => p.category === active),
    [active, initialProducts]
  );

  function handleCategory(id: string) {
    setGridKey((k) => k + 1);
    setActive(id);
  }

  return (
    <>
      <div className="sticky top-[5.5rem] z-30 mb-10 -mx-6 px-6 sm:mx-0 sm:px-0">
        {/* Móvil: una sola fila con scroll horizontal; desktop: pills centradas */}
        <div className="glass rounded-full sm:rounded-3xl sm:max-w-fit mx-auto px-2 py-1.5 sm:px-3 sm:py-2 flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategory(c.id)}
              aria-pressed={active === c.id}
              className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                active === c.id
                  ? "text-white shadow-soft sm:scale-[1.04] bg-gradient-rose"
                  : "text-foreground/70 hover:text-[var(--rose)] hover:bg-[var(--rose)]/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20">
          <div className="float-y w-16 h-16 mx-auto rounded-full bg-[var(--rose)]/10 flex items-center justify-center mb-4">
            <Sparkles size={26} className="text-rose" />
          </div>
          <p className="text-muted-foreground">{t.catalog.emptyTitle}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{t.catalog.emptySub}</p>
        </div>
      ) : (
        <div
          key={gridKey}
          className="stagger-fade grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

    </>
  );
}

function OrderHelpBanner() {
  const { quotesEnabled } = useSiteSettings();
  const { t } = useLang();
  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-10">
      <div
        className="glass-pink card-lift rounded-3xl p-5 flex items-start gap-4"
        style={{ borderColor: "rgba(240,112,151,0.25)" }}
      >
        <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-rose shadow-glow">
          <ShoppingCart size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#e85d82] mb-1">
            {t.catalog.bannerOrderTitle}
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {t.catalog.bannerOrderDesc}
          </p>
        </div>
      </div>

      {quotesEnabled && (
      <Link
        href="/cotizar"
        className="glass-pink card-lift rounded-3xl p-5 flex items-start gap-4"
        style={{ borderColor: "rgba(240,112,151,0.25)" }}
      >
        <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-rose shadow-glow">
          <Sparkles size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#e85d82] mb-1 flex items-center gap-1.5">
            {t.catalog.bannerQuoteTitle} <ArrowRight size={12} />
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {t.catalog.bannerQuoteDesc}
          </p>
        </div>
      </Link>
      )}
    </div>
  );
}

export default function CatalogClient({ initialProducts }: { initialProducts: Product[] }) {
  const { t } = useLang();
  return (
    <CartProvider>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10 hero-enter">
          <p className="font-script text-2xl text-rose">{t.catalog.kicker}</p>
          <h1 className="font-display text-4xl md:text-5xl mt-1">{t.catalog.title}</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            {t.catalog.subtitle}
          </p>
        </div>

        <OrderHelpBanner />

        <Suspense fallback={<p className="text-center text-muted-foreground py-10">{t.catalog.loading}</p>}>
          <CatalogContent initialProducts={initialProducts} />
        </Suspense>
      </section>
      <CartFab />
      <CartDrawer />
    </CartProvider>
  );
}
