"use client";
// ─────────────────────────────────────────────────────────────
//  BrandWipe — transición de marca entre Kan M y Empanadoteca.
//
//  Coreografía (v2):
//   1. La página actual se aleja sutilmente (zoom-out) mientras un
//      halo difuminado + círculo con el gradiente de la marca DESTINO
//      se expanden desde el punto del click.
//   2. Con la pantalla cubierta aparece el brandmark (logo) de la
//      marca destino y se navega por debajo.
//   3. El overlay se desvanece revelando la página nueva ya montada.
//  Con prefers-reduced-motion navega directo sin efecto.
// ─────────────────────────────────────────────────────────────
import {
  createContext, useCallback, useContext, useRef, useState,
} from "react";
import { useRouter } from "next/navigation";

type Brand = "kanm" | "empanadoteca";

// Línea de tiempo del wipe (ms)
const T_PUSH = 500;     // navegar cuando el círculo ya cubre la pantalla
const T_FADE = 1000;    // empezar a desvanecer el overlay
const T_CLEANUP = 1650; // overlay fuera, listo para otro wipe

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
  const [brand, setBrand] = useState<Brand>("empanadoteca");

  const navigateWithWipe = useCallback(
    (href: string, brand: Brand, origin?: { x: number; y: number }) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = overlayRef.current;
      if (reduced || !el || busy) {
        router.push(href);
        return;
      }
      setBusy(true);
      setBrand(brand);
      // data-brand imperativo además del estado: el gradiente debe ser
      // correcto desde el primer frame, antes del re-render de React.
      el.dataset.brand = brand;
      const html = document.documentElement;
      html.style.setProperty("--wipe-x", `${origin?.x ?? window.innerWidth / 2}px`);
      html.style.setProperty("--wipe-y", `${origin?.y ?? 80}px`);
      el.classList.remove("wipe-out");
      // reflow para reiniciar la transición desde circle(0%)
      void el.offsetWidth;
      el.classList.add("wipe-in");
      html.classList.add("wipe-zoom");

      // Navegar bajo el overlay; quitar el zoom para que la página
      // nueva monte sin transform (snap invisible: está cubierta).
      window.setTimeout(() => {
        router.push(href);
        html.classList.remove("wipe-zoom");
      }, T_PUSH);
      window.setTimeout(() => {
        el.classList.add("wipe-out");
      }, T_FADE);
      window.setTimeout(() => {
        el.classList.remove("wipe-in", "wipe-out");
        setBusy(false);
      }, T_CLEANUP);
    },
    [router, busy]
  );

  return (
    <Ctx.Provider value={{ navigateWithWipe }}>
      {children}
      <div ref={overlayRef} aria-hidden className="brand-wipe" data-brand={brand}>
        <div className="wipe-halo" />
        <div className="wipe-fill" />
        <div className="wipe-brandmark">
          {brand === "kanm" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo-kanm.png"
              alt=""
              className="h-24 w-auto object-contain drop-shadow-lg"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-empanadoteca.png"
                alt=""
                className="h-24 w-24 rounded-full shadow-2xl"
              />
              <span className="font-display font-bold text-white text-xl tracking-[0.3em] pl-[0.3em]">
                EMPANADOTECA
              </span>
            </>
          )}
        </div>
      </div>
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
