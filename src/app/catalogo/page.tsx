"use client";
import { useEffect, useState } from "react";
import ProductCard, { Product } from "@/components/ProductCard";

const CATEGORIES = [
  { id: "all", label: "Todo" },
  { id: "cakes", label: "Pasteles" },
  { id: "desserts", label: "Postres" },
  { id: "events", label: "Mesa de dulces" },
  { id: "picaderas", label: "Picaderas para eventos" },
];

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const visible = active === "all" ? products : products.filter((p) => p.category === active);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="font-script text-2xl text-rose">nuestro catálogo</p>
        <h1 className="font-display text-4xl md:text-5xl mt-1">Creaciones Kan M</h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Explora nuestra colección de pasteles, postres, mesas de dulces y picaderas para eventos.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`px-5 py-2.5 rounded-full text-sm border transition ${
              active === c.id
                ? "bg-gradient-rose text-white border-transparent shadow-soft"
                : "bg-card border-[var(--border)] hover:bg-secondary"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted-foreground">No hay productos en esta categoría aún.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
