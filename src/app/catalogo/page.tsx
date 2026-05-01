"use client";
import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard, { Product } from "@/components/ProductCard";

const CATEGORIES = [
  { id: "all",       label: "Todo" },
  { id: "cakes",     label: "Pasteles" },
  { id: "desserts",  label: "Postres" },
  { id: "events",    label: "Mesa de dulces" },
  { id: "picaderas", label: "Picaderas para eventos" },
  { id: "brunch",    label: "Brunch" },
  { id: "drinks",    label: "Bebidas" },
];

function CatalogContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [gridKey, setGridKey]   = useState(0); // triggers fade on category change
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat && CATEGORIES.some((c) => c.id === cat)) setActive(cat);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => active === "all" ? products : products.filter((p) => p.category === active),
    [active, products]
  );

  function handleCategory(id: string) {
    setGridKey((k) => k + 1); // remount grid → triggers CSS animation
    setActive(id);
  }

  return (
    <>
      {/* Category pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCategory(c.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              active === c.id
                ? "text-white border-transparent shadow-soft"
                : "bg-card border-[var(--border)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)]"
            }`}
            style={active === c.id ? { background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" } : {}}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-20">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">No hay productos en esta categoría aún.</p>
      ) : (
        /* key change remounts the grid, triggering the CSS fade-in animation */
        <div
          key={gridKey}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ animation: "catalogFadeIn 0.35s ease both" }}
        >
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      <style>{`
        @keyframes catalogFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default function CatalogPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="font-script text-2xl text-rose">nuestro catálogo</p>
        <h1 className="font-display text-4xl md:text-5xl mt-1">Creaciones Kan M</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Explora nuestra colección de pasteles, postres, mesas de dulces y picaderas para eventos.
        </p>
      </div>
      <Suspense fallback={<p className="text-center text-muted-foreground py-10">Cargando…</p>}>
        <CatalogContent />
      </Suspense>
    </section>
  );
}
