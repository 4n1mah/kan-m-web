import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SiteBackdrop from "@/components/SiteBackdrop";
import { WipeProvider } from "@/components/BrandWipe";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import ScrollReveal from "@/components/ScrollReveal";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "700"] });
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-script", weight: ["400", "700"] });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500", "600", "700"] });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.kanmreposteriaycatering.com";

const DEFAULT_OG_IMAGE =
  "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777569347/Inicio3_b6dnzx.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kan M — Repostería y Catering en Zona Colonial, Santo Domingo",
    template: "%s · Kan M Repostería y Catering",
  },
  description:
    "Repostería artesanal y catering boutique en Santo Domingo. Pasteles personalizados, postres, mesas dulces y catering para bodas, cumpleaños y eventos. Recoge en Zona Colonial o pide a domicilio.",
  keywords: [
    "repostería Santo Domingo",
    "pasteles personalizados Santo Domingo",
    "catering bodas República Dominicana",
    "mesa de dulces Santo Domingo",
    "pastel de cumpleaños zona colonial",
    "brunch zona colonial",
    "postres delivery Santo Domingo",
    "Kan M repostería",
  ],
  authors: [{ name: "Kan M Repostería y Catering" }],
  creator: "Kan M Repostería y Catering",
  publisher: "Kan M Repostería y Catering",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: SITE_URL,
    siteName: "Kan M Repostería y Catering",
    title: "Kan M — Repostería y Catering en Zona Colonial",
    description:
      "Pasteles artesanales, postres exclusivos y mesas dulces personalizadas. Bodas, cumpleaños y eventos en Santo Domingo.",
    images: [
      { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Kan M Repostería y Catering" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kan M — Repostería y Catering",
    description:
      "Repostería artesanal y catering boutique en Zona Colonial, Santo Domingo.",
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Bakery", "LocalBusiness", "FoodEstablishment"],
  "@id": `${SITE_URL}#business`,
  name: "Kan M Repostería y Catering",
  alternateName: "Kan M",
  description:
    "Repostería artesanal y catering boutique en la Zona Colonial de Santo Domingo. Pasteles personalizados, postres, mesas dulces y catering para eventos.",
  url: SITE_URL,
  telephone: "+1-829-610-7064",
  email: "kanmreposteriaycatering@gmail.com",
  image: DEFAULT_OG_IMAGE,
  logo: `${SITE_URL}/logo-kanm.png`,
  priceRange: "$$",
  servesCuisine: ["Repostería", "Pastelería", "Catering", "Brunch"],
  paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
  currenciesAccepted: "DOP",
  areaServed: { "@type": "City", name: "Santo Domingo" },
  address: {
    "@type": "PostalAddress",
    streetAddress: "C. Espaillat 58",
    addressLocality: "Zona Colonial, Santo Domingo",
    addressRegion: "Distrito Nacional",
    addressCountry: "DO",
  },
  sameAs: [
    "https://www.instagram.com/kanm.reposteriacafe/",
    "https://maps.app.goo.gl/mU9uqEDyhnN4Zc7g9",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${script.variable} ${sans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body>
        <WipeProvider>
          <SiteBackdrop />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <WhatsAppFab />
          <ScrollReveal />
        </WipeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
