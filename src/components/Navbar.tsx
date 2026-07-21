"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { useSiteSettings } from "@/components/useSiteSettings";
import { useWipe, wipeClickHandler } from "@/components/BrandWipe";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catering", label: "Catering" },
  { href: "/la-latica", label: "La Latica" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const settings = useSiteSettings();
  const { navigateWithWipe } = useWipe();
  const visibleLinks = links.filter(l => l.href !== "/catalogo" || settings.catalogEnabled);

  // Modo Empanadoteca: el navbar cambia de mundo en /empanadoteca
  const isEmpanadoteca = pathname?.startsWith("/empanadoteca") ?? false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ocultar el navbar público en rutas de admin (tienen su propio header)
  if (pathname?.startsWith("/admin")) return null;

  const navBg = isEmpanadoteca
    ? scrolled ? "rgba(179,40,45,0.9)" : "#b3282d"
    : scrolled ? "rgba(240,112,151,0.9)" : "#f07097";
  const navShadow = isEmpanadoteca
    ? "0 2px 24px rgba(179,40,45,0.4)"
    : "0 2px 24px rgba(240,112,151,0.4)";

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-700 hairline-b"
      style={{
        backgroundColor: navBg,
        backdropFilter: scrolled ? "blur(12px) saturate(160%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px) saturate(160%)" : "none",
        boxShadow: scrolled ? navShadow : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 h-22 flex items-center justify-between gap-4" style={{ height: "5rem" }}>

        {/* Logo — crossfade entre Kan M y Empanadoteca según la sección */}
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative" style={{ width: "8.5rem", height: "4.5rem" }}>
            <Image
              src="/logo-kanm.png"
              alt="Kan M Repostería y Catering"
              fill
              className={`object-contain object-left transition-opacity duration-700 ${isEmpanadoteca ? "opacity-0" : "opacity-100"}`}
              priority
            />
            <div className={`absolute inset-y-0 left-0 w-max flex items-center gap-2.5 transition-opacity duration-700 ${isEmpanadoteca ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-empanadoteca.png"
                alt="Empanadoteca"
                className="h-12 w-12 rounded-full shadow-md shrink-0"
              />
              <span className="font-display font-bold text-white text-[15px] leading-none tracking-wide whitespace-nowrap">
                EMPANADOTECA
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* En modo Empanadoteca ocultamos los links de Kan M: son secciones de
              la repostería, no del portal de picaderas. Solo queda el botón "Kan M". */}
          {!isEmpanadoteca && visibleLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                data-active={active || undefined}
                className={`nav-link px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "text-white bg-white/15"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {/* Portal al otro negocio: Picaderas (Empanadoteca) ⇄ Kan M */}
          {isEmpanadoteca ? (
            <a
              href="/"
              onClick={wipeClickHandler(navigateWithWipe, "/", "kanm")}
              className="kanm-link ml-1 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-rose text-white text-sm font-semibold shadow-sm"
              style={{ background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)" }}
            >
              <span className="font-script text-base leading-none">Kan M</span>
            </a>
          ) : (
            <a
              href="/empanadoteca"
              onClick={wipeClickHandler(navigateWithWipe, "/empanadoteca", "empanadoteca")}
              className="empanadoteca-link ml-1 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm font-semibold"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-empanadoteca.png" alt="" aria-hidden className="emp-mini-logo h-5 rounded-full" />
              Empanadoteca
            </a>
          )}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <a
            href={waLink(WA_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/20 border border-white/35 text-white text-sm font-medium hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          {settings.quotesEnabled && !isEmpanadoteca && (
            <Link
              href="/cotizar"
              className="btn-shine flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#f07097] text-sm font-semibold hover:bg-white/90 transition-all shadow-sm"
            >
              Cotizar
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Menú"
          className="lg:hidden p-2 rounded-lg text-white hover:bg-white/15 transition"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 backdrop-blur-md ${open ? "max-h-[560px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{
          borderTop: "1px solid rgba(255,255,255,0.15)",
          backgroundColor: isEmpanadoteca ? "rgba(179,40,45,0.94)" : "rgba(240,112,151,0.94)",
        }}
      >
        <div className={`max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1 ${open ? "stagger-fade" : ""}`}>
          {!isEmpanadoteca && visibleLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                  active
                    ? "text-white bg-white/20"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {/* Portal móvil al otro negocio */}
          {isEmpanadoteca ? (
            <a
              href="/"
              onClick={(e) => { setOpen(false); wipeClickHandler(navigateWithWipe, "/", "kanm")(e); }}
              className="px-3 py-2.5 rounded-lg text-base font-semibold text-white bg-white/20 flex items-center gap-2"
            >
              <span className="font-script text-lg leading-none">Kan M</span> · Volver a la repostería
            </a>
          ) : (
            <a
              href="/empanadoteca"
              onClick={(e) => { setOpen(false); wipeClickHandler(navigateWithWipe, "/empanadoteca", "empanadoteca")(e); }}
              className="empanadoteca-link px-3 py-2.5 rounded-lg text-base font-semibold text-white bg-white/10 flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-empanadoteca.png" alt="" aria-hidden className="h-6 w-6 rounded-full" />
              Empanadoteca
            </a>
          )}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/15 mt-2">
            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium"
            >
              WhatsApp
            </a>
            {settings.quotesEnabled && !isEmpanadoteca && (
              <Link
                href="/cotizar"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center px-5 py-2.5 rounded-full bg-white text-[#f07097] text-sm font-semibold shadow-sm"
              >
                Cotizar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
