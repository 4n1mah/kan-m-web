import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de pasteles, postres y catering",
  description:
    "Conoce nuestras creaciones: pasteles personalizados, postres, mesas dulces, picaderas para eventos, brunch y bebidas. Pide en línea o cotiza tu evento.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: "Catálogo Kan M — Pasteles, postres, catering",
    description:
      "Explora pasteles artesanales, postres, mesas dulces y picaderas para eventos. Pasa a recoger en Zona Colonial.",
    url: "/catalogo",
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
