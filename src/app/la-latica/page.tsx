import type { Metadata } from "next";
import LaLaticaClient from "./LaLaticaClient";

export const metadata: Metadata = {
  title: "La Latica — Postres en lata | Kan M Repostería",
  description:
    "La Latica de Kan M: postres en lata fáciles de abrir y comer con cuchara hasta el fondo. El nuevo producto estrella. Pídela por WhatsApp o Uber Eats.",
  alternates: { canonical: "/la-latica" },
  openGraph: {
    title: "La Latica — El nuevo antojo en lata de Kan M",
    description:
      "Postres en lata para comer con cuchara hasta el fondo. Producto estrella de Kan M Repostería y Catering.",
    url: "/la-latica",
  },
};

// El render (con idioma ES/EN) vive en LaLaticaClient; acá solo el SEO.
export default function LaLaticaPage() {
  return <LaLaticaClient />;
}
