import Image from "next/image";
import { Cake, ArrowRight } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { IMAGES } from "@/lib/images";

const services: { title: string; desc: string; img: string; bullets: string[] }[] = [
  {
    title: "Pasteles personalizados",
    desc: "Diseñamos el pastel de tus sueños desde cero — tamaño, sabor, relleno y decoración a tu gusto. Cada detalle pensado para hacer ese momento inolvidable.",
    img: IMAGES.cateringPasteles,
    bullets: ["Diseño exclusivo para ti", "Sabores y rellenos a elección", "Desde una talla hasta varios pisos"],
  },
  {
    title: "Bodas",
    desc: "Mesas dulces personalizadas, pasteles de varios pisos y detalles que marcan el día más importante.",
    img: IMAGES.cateringBodas,
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
  },
  {
    title: "Cumpleaños",
    desc: "Temáticas, sabores y presentaciones únicas para celebrar a quienes amas.",
    img: IMAGES.cateringCumple,
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
  },
  {
    title: "Eventos recreativos (cumpleaños, baby showers, graduaciones, etc.)",
    desc: "Coffee breaks, brunches y catering boutique con atención al detalle.",
    img: IMAGES.cateringEventos,
    bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
  },
];

export default function CateringPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="font-script text-2xl text-rose">para tu evento</p>
        <h1 className="font-display text-4xl md:text-5xl mt-1">
          Catering que <span className="font-script text-gradient-rose italic">enamora</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Diseñamos experiencias dulces a medida de tu evento, con productos artesanales y servicio impecable.
        </p>
      </div>

      <div className="space-y-20">
        {services.map((s, i) => (
          <div key={s.title} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-card">
              <Image src={s.img} alt={s.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-4xl">{s.title}</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">{s.desc}</p>
              <ul className="mt-6 space-y-2 text-muted-foreground">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2"><Cake size={16} className="text-rose" /> {b}</li>
                ))}
              </ul>
              <a
                href={waLink(WA_MESSAGES.catering)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 transition"
              >
                Cotizar Eventos <ArrowRight size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
