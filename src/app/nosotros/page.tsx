import Image from "next/image";

export default function NosotrosPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-card">
          <Image
            src="https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900"
            alt="Equipo Kan M"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-script text-2xl text-rose">nuestra historia</p>
          <h1 className="font-display text-4xl md:text-5xl mt-1">
            Pasión por lo <span className="font-script text-gradient-rose">artesanal</span>
          </h1>
          <p className="text-muted-foreground mt-6 leading-relaxed">
            Kan M nació del amor por crear momentos memorables a través de la repostería.
            Cada pastel, cada postre, cada mesa dulce es elaborada con ingredientes seleccionados
            y un toque de cariño que se siente en cada bocado.
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Más de 500 eventos endulzados nos respaldan: bodas, cumpleaños, brunches corporativos
            y celebraciones íntimas en toda República Dominicana.
          </p>
          <div className="mt-8 space-y-2 text-sm text-muted-foreground">
            <a href="mailto:kanmreposteriaycatering@gmail.com" className="flex items-center gap-2 hover:text-rose transition-colors">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 7.5-9.75-7.5" /></svg>
              kanmreposteriaycatering@gmail.com
            </a>
            <a href="https://www.instagram.com/kanm.reposteriacafe/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-rose transition-colors">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              @kanm.reposteriacafe
            </a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-20">
        {[
          { t: "Artesanal", d: "Recetas propias, ingredientes frescos." },
          { t: "Personalizado", d: "Diseñamos según tu visión y tema." },
          { t: "Detallista", d: "Cuidamos cada elemento del montaje." },
        ].map((v) => (
          <div key={v.t} className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-7 text-center">
            <h3 className="font-display text-xl">{v.t}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{v.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
