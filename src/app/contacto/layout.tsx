import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contáctanos — WhatsApp, Instagram y ubicación en Zona Colonial",
  description:
    "Encuéntranos en C. Espaillat 58, Zona Colonial, Santo Domingo. Contáctanos por WhatsApp 829-610-7064, Instagram @kanm.reposteriacafe o pide a domicilio por Uber Eats y PedidosYa.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contáctanos — Kan M Repostería y Catering",
    description:
      "C. Espaillat 58, Zona Colonial. WhatsApp 829-610-7064. Pide a domicilio en Uber Eats y PedidosYa.",
    url: "/contacto",
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
