"use client";
import { useState, useEffect } from "react";
import ProductCard, { Product } from "@/components/ProductCard";

export default function RotatingFeatured({ products }: { products: Product[] }) {
  const [page, setPage] = useState(0);
  const [fading, setFading] = useState(false);
  const total = products.length;
  const perPage = 3;
  const pages = Math.ceil(total / perPage);

  useEffect(() => {
    if (pages <= 1) return;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPage((p) => (p + 1) % pages);
        setFading(false);
      }, 300);
    }, 8000);
    return () => clearInterval(id);
  }, [pages]);

  const visible = products.slice(page * perPage, page * perPage + perPage);

  return (
    <div>
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Dot indicators */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setFading(true); setTimeout(() => { setPage(i); setFading(false); }, 300); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? "bg-[var(--rose)] w-6" : "bg-[var(--border)] w-1.5 hover:bg-[var(--rose)]/50"}`}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
