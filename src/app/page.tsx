import Image from "next/image";
import Link from "next/link";
import { Sparkles, Heart, Cake, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { IMAGES } from "@/lib/images";
import DeliveryButtons from "@/components/DeliveryButtons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.product.findMany({ take: 3, orderBy: { createdAt: "desc" } });

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-soft">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-[var(--border)]/60 text-xs uppercase tracking-widest">
              <Sparkles size={14} className="text-rose" /> Repostería Artesanal y Café
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.1] mt-6">
              Endulzamos<br />tu evento
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-md leading-relaxed">
              Pasteles artesanales, postres únicos y mesas dulces curadas con amor para los momentos que más importan.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={waLink(WA_MESSAGES.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 transition"
              >
                Pedir por WhatsApp <ArrowRight size={18} />
              </a>
              <Link
                href="/catalogo"
                className="inline-flex items-center px-6 py-3 rounded-full bg-card border border-[var(--border)] hover:bg-secondary transition"
              >
                Ver catálogo
              </Link>
            </div>

            <DeliveryButtons variant="hero" />
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-rose opacity-20 blur-3xl rounded-3xl" />
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-soft">
              <Image
                src={IMAGES.heroProduct}
                alt="Pastel artesanal Kan M"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="hidden sm:flex absolute -bottom-6 -left-6 items-center gap-3 bg-card rounded-2xl shadow-card px-5 py-4 border border-[var(--border)]/60">
              <div className="w-10 h-10 rounded-full bg-gradient-rose flex items-center justify-center text-white">
                <Heart size={18} />
              </div>
              <div>
                <div className="font-display text-lg leading-none">+500 eventos</div>
                <div className="text-xs text-muted-foreground mt-1">endulzados con amor</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-script text-2xl text-rose">Lo más pedido</p>
            <h2 className="font-display text-3xl md:text-4xl mt-1">Nuestras creaciones</h2>
          </div>
          <Link href="/catalogo" className="text-rose hover:underline text-sm">Ver todos →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CATERING */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-card">
          <Image
            src={IMAGES.homeCatering}
            alt="Catering Kan M"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-script text-2xl text-rose">para tu evento</p>
          <h2 className="font-display text-3xl md:text-4xl mt-1">
            Catering que <span className="font-script text-gradient-rose italic">enamoran</span>
          </h2>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            {["Bodas y compromisos", "Cumpleaños temáticos", "Eventos recreativos"].map((x) => (
              <li key={x} className="flex items-center gap-3">
                <Cake size={18} className="text-rose" /> {x}
              </li>
            ))}
          </ul>
          <a
            href={waLink(WA_MESSAGES.catering)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 transition"
          >
            Cotizar mi evento <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-secondary/40 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="font-script text-2xl text-rose">testimonios</p>
            <h2 className="font-display text-3xl md:text-4xl mt-1">Clientes felices</h2>
            <a
              href="https://www.google.com/search?q=Kan+M+Reposteria+y+Catering"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-muted-foreground hover:text-rose transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Ver todas las reseñas en Google
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: "Mi repostería favorita, hacen los mejores bizcochos y postres que he probado.", n: "Rosalis García", r: "⭐⭐⭐⭐⭐ · Hace 2 años", link: "https://www.google.com/maps/search/Kan+M+Reposteria+y+Catering+Santo+Domingo" },
              { q: "Maravilloso lugar, los mejores postres de la Zona Colonial, sus galletas, brownies, empanadas son TOP, espero volver pronto.", n: "Miguel Antonio Sierra Castro", r: "⭐⭐⭐⭐⭐ · Local Guide", link: "https://www.google.com/maps/search/Kan+M+Reposteria+y+Catering+Santo+Domingo" },
              { q: "Sus dulces son la gloria, especialmente ese bizcocho de Fresa y alfajores 🍓💗 hicieron que nuestra noche fuera mejor, gracias por el excelente servicio y los postres 💗 volveremos sin lugar a dudas 100/5", n: "Franchesca Nicole Romero", r: "⭐⭐⭐⭐⭐ · Local Guide", link: "https://www.google.com/maps/search/Kan+M+Reposteria+y+Catering+Santo+Domingo" },
            ].map((t, i) => (
              <a key={i} href={t.link} target="_blank" rel="noopener noreferrer" className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-7 block hover:shadow-soft transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-xs text-muted-foreground">Google Review</span>
                </div>
                <div className="font-display text-2xl text-rose leading-none">"</div>
                <p className="text-foreground/80 leading-relaxed mt-2">{t.q}</p>
                <div className="border-t border-[var(--border)]/60 mt-6 pt-4">
                  <div className="font-semibold text-sm">{t.n}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

            {/* FINAL CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl">
            Hagamos juntos <span className="font-script text-gradient-rose">tu evento</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
            Cuéntanos qué imaginas y lo creamos. Cada detalle, cada sabor, hecho a tu medida.
          </p>
          <a
            href={waLink(WA_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-rose text-white text-lg shadow-soft hover:opacity-90 transition"
          >
            Hablar por WhatsApp <ArrowRight size={20} />
          </a>
        </div>
      </section>
    </>
  );
}
