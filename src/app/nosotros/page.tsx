import { IMAGES } from "@/lib/images";
import Image from "next/image";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";

export default function NosotrosPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-card">
          <Image
            src={IMAGES.nosotrosTeam}
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

          {/* Contact & location info */}
          <div className="mt-8 space-y-3">
            <a
              href="https://maps.app.goo.gl/RRVXx7NSkbYMwDgQA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 text-sm text-muted-foreground hover:text-rose transition-colors group"
            >
              <MapPin size={17} className="shrink-0 mt-0.5 text-rose" />
              <span>
                <span className="font-medium text-foreground">C. Espaillat 58</span>
                <span className="block text-xs mt-0.5">Zona Colonial, Santo Domingo</span>
              </span>
            </a>
            <a
              href="tel:+18296107064"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-rose transition-colors"
            >
              <Phone size={17} className="shrink-0 text-rose" />
              <span>
                <span className="font-medium text-foreground">+1 (829) 610-7064</span>
              </span>
            </a>
            <a
              href="mailto:kanmreposteriaycatering@gmail.com"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-rose transition-colors"
            >
              <Mail size={17} className="shrink-0 text-rose" />
              kanmreposteriaycatering@gmail.com
            </a>
            <a
              href="https://www.instagram.com/kanm.reposteriacafe/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-rose transition-colors"
            >
              <Instagram size={17} className="shrink-0 text-rose" />
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
