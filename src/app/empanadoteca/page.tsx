import type { Metadata } from "next";
import EmpanadotecaClient from "./EmpanadotecaClient";

export const metadata: Metadata = {
  title: "Empanadoteca",
  description:
    "Empanadoteca, el otro sabor de Kan M: las mejores empanadas de RD — tradicionales, venezolanas y catibías. Zona Colonial, Santo Domingo.",
  alternates: { canonical: "/empanadoteca" },
  openGraph: {
    title: "Empanadoteca — Las mejores empanadas de RD",
    description:
      "Empanadas tradicionales, venezolanas y catibías. Una empresa de Kan M Repostería y Catering.",
    url: "/empanadoteca",
    images: [{ url: "/logo-empanadoteca.png", width: 512, height: 512, alt: "Empanadoteca" }],
  },
};

export default function EmpanadotecaPage() {
  return <EmpanadotecaClient />;
}
