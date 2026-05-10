import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Kan M — Repostería artesanal en Zona Colonial",
  description:
    "Conoce la historia de Kan M Repostería y Catering: un equipo de reposteras dominicanas dedicado a endulzar bodas, cumpleaños y eventos en Santo Domingo desde la Zona Colonial.",
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: "Sobre Kan M — Repostería y Catering",
    description:
      "Repostería artesanal en Zona Colonial. Más de 500 eventos endulzados con amor.",
    url: "/nosotros",
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
