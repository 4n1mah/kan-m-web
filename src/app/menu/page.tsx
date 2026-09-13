import type { Metadata } from "next";
import MenuClient from "./MenuClient";

export const metadata: Metadata = {
  title: "Menú — Brunch, bebidas y postres | Kan M Café",
  description:
    "Menú de KANm Café en la Zona Colonial: brunch los fines de semana, cafés, jugos, smoothies, tragos, La Latica, pedazos y galletones. Precios con ITBIS incluido.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menú de KANm Café — Brunch, bebidas y postres",
    description:
      "Brunch los fines de semana, bebidas frías y calientes, tragos y postres artesanales en la Zona Colonial.",
    url: "/menu",
  },
};

// El render (con idioma ES/EN) vive en MenuClient; acá solo el SEO.
export default function MenuPage() {
  return <MenuClient />;
}
