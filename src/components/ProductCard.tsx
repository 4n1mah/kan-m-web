"use client";
import Image from "next/image";
import Link from "next/link";
import { Plus, Check, Sparkles } from "lucide-react";
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

const PINK_GRADIENT =
  "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

const CATEGORY_LABELS: Record<string, string> = {
  cakes: "Pasteles",
  desserts: "Postres",
  events: "Mesa de dulces",
  picaderas: "Picaderas",
  brunch: "Brunch",
  drinks: "Bebidas",
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {isOutOfStock && (
          <div className="absolute top-3 left-3 bg-gray-800/85 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            No disponible
          </div>
        )}
        {CATEGORY_LABELS[product.category] && (
          <div className="absolute top-3 right-3 bg-white/75 backdrop-blur-sm text-[11px] font-medium text-[#3a2a22]/80 px-2.5 py-1 rounded-full border border-white/60 shadow-sm">
            {CATEGORY_LABELS[product.category]}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-xl">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">
          {product.description}
        </p>
        {hasPrice && (
          <p className="mt-3 text-rose">
            <span className="text-xs font-medium align-baseline mr-1">Desde</span>
            <span className="font-display text-lg font-semibold">
              RD${product.price!.toLocaleString("es-DO")}
            </span>
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {hasPrice && !isOutOfStock && (
            cart ? (
              // Dentro del catálogo: agrega al carrito
              <button
                onClick={handleAdd}
                className={`inline-flex w-full justify-center items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  added
                    ? "bg-green-500 text-white"
                    : inCart
                    ? "bg-[#fef7f9] text-[#e85d82] border-2 border-[#f07097]/30 hover:border-[#f07097]"
                    : "text-white shadow-soft hover:opacity-90"
                }`}
                style={!added && !inCart ? { background: PINK_GRADIENT } : {}}
              >
                {added ? (
                  <><Check size={15} /> ¡Agregado!</>
                ) : inCart ? (
                  <><Check size={15} /> En el carrito ({inCart.quantity})</>
                ) : (
                  <><Plus size={15} /> Agregar al carrito</>
                )}
              </button>
            ) : (
              // Fuera del catálogo (ej. home destacados): lleva al catálogo
              <Link
                href={`/catalogo?cat=${encodeURIComponent(product.category)}`}
                className="inline-flex w-full justify-center items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white shadow-soft hover:opacity-90 transition"
                style={{ background: PINK_GRADIENT }}
              >
                <Plus size={15} /> Ordenar en el catálogo
              </Link>
            )
          )}

          {/* Productos sin precio fijo (mesas dulces, eventos personalizados) van a /cotizar */}
          {!hasPrice && (
            <Link
              href={`/cotizar?item=${encodeURIComponent(product.name)}`}
              className="inline-flex w-full justify-center items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white shadow-soft hover:opacity-90 transition"
              style={{ background: PINK_GRADIENT }}
            >
              <Sparkles size={15} /> Solicitar cotización
            </Link>
          )}

          {/* Productos sin stock con precio: mostrar mensaje claro, sin botón */}
          {hasPrice && isOutOfStock && (
            <p className="text-xs text-center text-muted-foreground py-2">
              Vuelve pronto — disponible próximamente
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
