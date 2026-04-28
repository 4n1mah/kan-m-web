import Link from "next/link";
import { Phone, Mail, Instagram } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]/60 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-script text-3xl text-rose">Kan M</div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
            Repostería artesanal y catering boutique. Endulzamos los momentos
            que más importan, con amor y detalle.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest font-medium mb-4">Explorar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-rose">Inicio</Link></li>
            <li><Link href="/catalogo" className="hover:text-rose">Catálogo</Link></li>
            <li><Link href="/catering" className="hover:text-rose">Catering</Link></li>
            <li><Link href="/nosotros" className="hover:text-rose">Nosotros</Link></li>
            <li><Link href="/contacto" className="hover:text-rose">Contacto</Link></li>
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
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]/60">
        <p className="text-center text-xs text-muted-foreground py-5">
          © {new Date().getFullYear()} Kan M Repostería y Catering · WhatsApp +1 {WHATSAPP_NUMBER}
        </p>
      </div>
    </footer>
  );
}
