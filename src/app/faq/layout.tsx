import type { Metadata } from "next";

const FAQ_QA = [
  {
    q: "¿Con cuánta anticipación debo hacer mi pedido?",
    a: "Recomendamos hacer tu pedido con al menos 3 días de anticipación. Para eventos grandes (bodas, cumpleaños temáticos), lo ideal es contactarnos con 1 a 2 semanas de anticipación.",
  },
  {
    q: "¿Hacen entregas a domicilio?",
    a: "Sí, hacemos entregas en Santo Domingo y la Zona Colonial. El mínimo de envío es RD$250 y puede aumentar según la distancia. También puedes recoger sin costo adicional.",
  },
  {
    q: "¿Pueden personalizar pasteles con fotos o diseños específicos?",
    a: "Sí, nos especializamos en pasteles personalizados. Puedes compartir referencias de diseño, colores, temáticas o fotos comestibles.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Transferencias bancarias, efectivo y tarjetas de crédito/débito. Para eventos solicitamos un depósito del 50% al confirmar el pedido.",
  },
  {
    q: "¿Tienen opciones para personas con restricciones alimentarias?",
    a: "Sí, tenemos opciones sin gluten y veganas en algunos productos. Contáctanos para orientarte sobre las opciones que mejor se ajusten.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_QA.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export const metadata: Metadata = {
  title: "Preguntas frecuentes (FAQ) — Pedidos, entregas y cotizaciones",
  description:
    "Respuestas a las preguntas más frecuentes sobre pedidos, entregas, métodos de pago, personalización y opciones especiales en Kan M Repostería y Catering.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ Kan M — Preguntas frecuentes",
    description:
      "Pedidos, entregas, métodos de pago, personalización y opciones sin gluten/veganas.",
    url: "/faq",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
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
