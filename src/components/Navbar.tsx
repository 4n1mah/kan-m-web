"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catering", label: "Catering" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 h-24 border-b border-white/20 backdrop-blur-md" style={{ backgroundColor: "#f07097" }}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Logo only — blends into pink navbar */}
        <Link href="/" className="flex items-center leading-none">
          <div className="relative w-30 h-30 shrink-0">
            <Image
              src="/logo-kanm.png"
              alt="Kan M Repostería y Catering"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-white/90 hover:text-white font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* WhatsApp button */}
        <a
          href={waLink(WA_MESSAGES.general)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex px-5 py-2.5 rounded-full bg-white text-[#f07097] text-sm font-semibold shadow-soft hover:bg-white/90 transition"
        >
          WhatsApp
        </a>

        {/* Mobile hamburger */}
        <button
          aria-label="Menú"
          className="md:hidden p-2 text-white"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/20 backdrop-blur-md" style={{ backgroundColor: "#f07097" }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-white/90 hover:text-white font-medium"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={waLink(WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center px-5 py-2.5 rounded-full bg-white text-[#f07097] text-sm font-semibold shadow-soft"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
