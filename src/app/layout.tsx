import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "700"] });
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-script", weight: ["400", "700"] });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Kan M — Repostería y Catering",
  description:
    "Repostería artesanal y catering boutique en República Dominicana. Pastels, postres y mesas dulces para tus momentos especiales.",
  openGraph: {
    title: "Kan M — Repostería y Catering",
    description: "Repostería artesanal y catering boutique.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${script.variable} ${sans.variable}`}>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}
