"use client";
import Image from "next/image";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { Plus, Check } from "lucide-react";
import { useCartOptional } from "./CartContext";
import { useState } from "react";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number | null;
  availabilityStatus?: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
};

export default function ProductCard({ product }: { product: Product }) {
  const cart = useCartOptional();
  const [added, setAdded] = useState(false);

  const inCart = cart?.items.find((i) => i.id === product.id);
  const hasPrice = product.price != null;
  const isOutOfStock = product.availabilityStatus === "OUT_OF_STOCK";

  function handleAdd() {
    if (!cart || isOutOfStock) return;

    cart.add({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="group bg-card rounded-3xl border border-[var(--border)]/60 shadow-card overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-soft flex flex-col">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? "brightness-75" : ""}`}
        />
        {isOutOfStock && (
          <div className="absolute top-3 left-3 bg-gray-800/85 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            No disponible
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-xl">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">
          {product.description}
        </p>
        {product.price != null && (
          <p className="text-sm font-medium text-rose mt-3">
            Desde RD${product.price.toLocaleString("es-DO")}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {/* Add to cart button — only shows when product has a price */}
          {hasPrice && !isOutOfStock && (
            <button
              onClick={handleAdd}
              className={`inline-flex w-full justify-center items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                added
                  ? "bg-green-500 text-white"
                  : inCart
                  ? "bg-[#fef7f9] text-[#e85d82] border-2 border-[#f07097]/30 hover:border-[#f07097]"
                  : "bg-gradient-rose text-white shadow-soft hover:opacity-90"
              }`}
              style={
                !added && !inCart
                  ? {
                      background:
                        "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
                    }
                  : {}
              }
            >
              {added ? (
                <><Check size={15} /> ¡Agregado!</>
              ) : inCart ? (
                <><Check size={15} /> En el carrito ({inCart.quantity})</>
              ) : (
                <><Plus size={15} /> Agregar al carrito</>
              )}
            </button>
          )}

          {/* WhatsApp button — always shown */}
          <a
            href={waLink(WA_MESSAGES.product(product.name))}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-full justify-center px-6 py-2.5 rounded-full text-sm transition ${
              hasPrice
                ? "border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)]"
                : "bg-gradient-rose text-white shadow-soft hover:opacity-90"
            }`}
            style={
              !hasPrice
                ? {
                    background:
                      "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
                  }
                : {}
            }
          >
            Preguntar disponibilidad
          </a>
        </div>
      </div>
    </article>
  );
}
