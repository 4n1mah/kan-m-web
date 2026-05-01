import Image from "next/image";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number | null;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group bg-card rounded-3xl border border-[var(--border)]/60 shadow-card overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-xl">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {product.description}
        </p>
        {product.price != null && (
          <p className="text-sm font-medium text-rose mt-3">
            Desde RD${product.price.toLocaleString("es-DO")}
          </p>
        )}
        <a
          href={waLink(WA_MESSAGES.product(product.name))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex w-full justify-center px-6 py-2.5 rounded-full bg-gradient-rose text-white text-sm shadow-soft hover:opacity-90 transition"
        >
          Pedir por WhatsApp
        </a>
      </div>
    </article>
  );
}
