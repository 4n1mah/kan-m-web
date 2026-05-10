import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catering boutique para bodas, cumpleaños y eventos",
  description:
    "Catering personalizado para bodas, cumpleaños temáticos, baby showers, eventos corporativos y mesas dulces en Santo Domingo. Diseñamos cada detalle para tu evento.",
  alternates: { canonical: "/catering" },
  openGraph: {
    title: "Catering Kan M — Bodas, cumpleaños y eventos en Santo Domingo",
    description:
      "Mesas dulces, postres, picaderas y pasteles para bodas y eventos. Servicio boutique en RD.",
    url: "/catering",
  },
};

export default function CateringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
