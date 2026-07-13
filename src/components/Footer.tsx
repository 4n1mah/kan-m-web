"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, Instagram } from "lucide-react";
import { WHATSAPP_NUMBER, waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { BUSINESS } from "@/lib/bizInfo";
import { useSiteSettings } from "@/components/useSiteSettings";

export default function Footer() {
  const pathname = usePathname();
  const settings = useSiteSettings();
  // Ocultar el footer público en rutas de admin
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer className="relative mt-24 border-t border-[var(--border)]/60 bg-secondary/40 bg-mesh bg-grain overflow-hidden">
      {/* Marca de agua decorativa */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-10 right-0 font-script text-[11rem] leading-none text-rose opacity-[0.05]"
      >
        Kan M
      </div>
      <div className="relative max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-script text-3xl text-rose">Kan M</div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
            Repostería artesanal y catering boutique. Endulzamos los momentos
            que más importan, con amor y detalle.
          </p>
          {/* Redes sociales — botones circulares */}
          <div className="flex items-center gap-2.5 mt-5">
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Kan M"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-card border border-[var(--border)] text-rose hover:text-white hover:bg-rose hover:border-rose hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200 shadow-sm"
            >
              <Instagram size={16} />
            </a>
            <a
              href={BUSINESS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok de Kan M"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-card border border-[var(--border)] text-rose hover:text-white hover:bg-rose hover:border-rose hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005.1 20.14a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.14-.14z" />
              </svg>
            </a>
            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de Kan M"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-card border border-[var(--border)] text-rose hover:text-white hover:bg-rose hover:border-rose hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest font-medium mb-4">Explorar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/" className="inline-block hover:text-rose hover:translate-x-1 transition-all duration-200">Inicio</Link></li>
            {settings.catalogEnabled && <li><Link href="/catalogo" className="inline-block hover:text-rose hover:translate-x-1 transition-all duration-200">Catálogo</Link></li>}
            <li><Link href="/catering" className="inline-block hover:text-rose hover:translate-x-1 transition-all duration-200">Catering</Link></li>
            <li><Link href="/picaderas" className="inline-block hover:text-rose hover:translate-x-1 transition-all duration-200">Picaderas</Link></li>
            <li><Link href="/nosotros" className="inline-block hover:text-rose hover:translate-x-1 transition-all duration-200">Nosotros</Link></li>
            <li><Link href="/contacto" className="inline-block hover:text-rose hover:translate-x-1 transition-all duration-200">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest font-medium mb-4">Contacto</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone size={14} className="text-rose" /> 829-610-7064</li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-rose" />
              <a href="mailto:kanmreposteriaycatering@gmail.com" className="hover:text-rose transition-colors">kanmreposteriaycatering@gmail.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram size={14} className="text-rose" />
              <a href="https://www.instagram.com/kanm.reposteriacafe/" target="_blank" rel="noopener noreferrer" className="hover:text-rose transition-colors">@kanm.reposteriacafe</a>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-rose mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <a href="https://maps.app.goo.gl/mU9uqEDyhnN4Zc7g9" target="_blank" rel="noopener noreferrer" className="hover:text-rose transition-colors leading-snug">C. Espaillat 58, Zona Colonial, Santo Domingo</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-[var(--border)]/60">
        <p className="text-center text-xs text-muted-foreground py-5">
          © {new Date().getFullYear()} Kan M Repostería y Catering · WhatsApp +1 {WHATSAPP_NUMBER}
        </p>
      </div>
    </footer>
  );
}
