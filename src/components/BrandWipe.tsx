"use client";
// ─────────────────────────────────────────────────────────────
//  BrandWipe — transición de marca entre Kan M y Empanadoteca.
//
//  useWipe().navigateWithWipe(href, brand, {x,y}) despliega un
//  círculo con el gradiente de la marca DESTINO desde el punto del
//  click, navega a mitad de la expansión y desvanece el overlay al
//  llegar. Con prefers-reduced-motion navega directo sin efecto.
// ─────────────────────────────────────────────────────────────
import {
  createContext, useCallback, useContext, useRef, useState,
} from "react";
import { useRouter } from "next/navigation";

type Brand = "kanm" | "empanadoteca";

const BRAND_GRADIENT: Record<Brand, string> = {
  kanm: "var(--gradient-rose, linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%))",
  empanadoteca: "linear-gradient(135deg, #b3282d 0%, #8f1f24 60%, #22314a 100%)",
};

type WipeCtx = {
  navigateWithWipe: (href: string, brand: Brand, origin?: { x: number; y: number }) => void;
};

const Ctx = createContext<WipeCtx | null>(null);

export function useWipe(): WipeCtx {
  const ctx = useContext(Ctx);
  // Fallback sin provider (p. ej. en tests): navegación normal.
  const router = useRouter();
  if (!ctx) {
    return { navigateWithWipe: (href) => router.push(href) };
  }
  return ctx;
}

export function WipeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const navigateWithWipe = useCallback(
    (href: string, brand: Brand, origin?: { x: number; y: number }) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = overlayRef.current;
      if (reduced || !el || busy) {
        router.push(href);
        return;
      }
      setBusy(true);
      // Kan M usa el gradiente LITERAL (no la var) para que el círculo de
      // regreso sea rosa aunque el tema Empanadoteca siga activo.
      el.style.background =
        brand === "kanm"
          ? "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)"
          : BRAND_GRADIENT.empanadoteca;
      el.style.setProperty("--wipe-x", `${origin?.x ?? window.innerWidth / 2}px`);
      el.style.setProperty("--wipe-y", `${origin?.y ?? 80}px`);
      el.classList.remove("wipe-out");
      // reflow para reiniciar la transición desde circle(0%)
      void el.offsetWidth;
      el.classList.add("wipe-in");

      // Navegar cuando el círculo ya cubre la pantalla
      window.setTimeout(() => router.push(href), 420);
      // Desvanecer y limpiar
      window.setTimeout(() => {
        el.classList.add("wipe-out");
      }, 780);
      window.setTimeout(() => {
        el.classList.remove("wipe-in", "wipe-out");
        setBusy(false);
      }, 1400);
    },
    [router, busy]
  );

  return (
    <Ctx.Provider value={{ navigateWithWipe }}>
      {children}
      <div ref={overlayRef} aria-hidden className="brand-wipe" />
    </Ctx.Provider>
  );
}

/** Handler de click listo para usar en <Link>/<button> de cambio de marca. */
export function wipeClickHandler(
  navigateWithWipe: WipeCtx["navigateWithWipe"],
  href: string,
  brand: Brand
) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    navigateWithWipe(href, brand, { x: e.clientX, y: e.clientY });
  };
}
