import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSiteSettings } from "@/lib/settings";

// ISR 60s + revalidatePath("/cotizar") desde el switch del admin.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cotizar pastel personalizado o catering para evento",
  description:
    "Cotiza tu pastel personalizado, mesa dulce o catering para boda, cumpleaños o evento corporativo en Santo Domingo. Te respondemos en menos de 24 horas.",
  alternates: { canonical: "/cotizar" },
  openGraph: {
    title: "Cotiza tu evento — Kan M Repostería y Catering",
    description:
      "Pasteles personalizados, mesas dulces y catering para bodas y cumpleaños. Mínimo 3 días de antelación.",
    url: "/cotizar",
  },
};

export default async function CotizarLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  // Cotizaciones apagadas: el formulario (client) nunca monta.
  if (!settings.quotesEnabled) return <ComingSoon variant="quotes" />;
  return children;
}
