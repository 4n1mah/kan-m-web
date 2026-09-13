import type { Metadata } from "next";
import { FAQS } from "@/lib/bizInfo";

// Las FAQs viven al final de /nosotros (antes /faq). El JSON-LD sale de
// bizInfo, la misma fuente que renderiza la sección y consume el bot.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export const metadata: Metadata = {
  title: "Sobre Kan M — Repostería artesanal en Zona Colonial",
  description:
    "Conoce la historia de Kan M Repostería y Catering: un equipo de reposteras dominicanas dedicado a endulzar bodas, cumpleaños y eventos en Santo Domingo desde la Zona Colonial. Contacto, horario y preguntas frecuentes.",
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: "Sobre Kan M — Repostería y Catering",
    description:
      "Repostería artesanal en Zona Colonial. Más de 500 eventos endulzados con amor.",
    url: "/nosotros",
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
