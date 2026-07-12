"use client";
import { useEffect, useState } from "react";

// Flags públicos del sitio para componentes client (Navbar, Footer,
// catering, contacto, faq). Fail-open: por defecto todo habilitado —
// si un feature está apagado hay un parpadeo breve del link antes de
// ocultarse, preferible a ocultar y re-mostrar. Caché a nivel de módulo
// para hacer UN solo fetch por carga de página aunque haya varios
// consumidores.
export type PublicSiteSettings = { catalogEnabled: boolean; quotesEnabled: boolean };

const DEFAULTS: PublicSiteSettings = { catalogEnabled: true, quotesEnabled: true };

let cache: PublicSiteSettings | null = null;
let inflight: Promise<PublicSiteSettings> | null = null;

function load(): Promise<PublicSiteSettings> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/public/settings")
      .then((r) => (r.ok ? r.json() : DEFAULTS))
      .then((s: PublicSiteSettings) => (cache = s))
      .catch(() => {
        inflight = null;
        return DEFAULTS;
      });
  }
  return inflight;
}

export function useSiteSettings(): PublicSiteSettings {
  const [settings, setSettings] = useState<PublicSiteSettings>(cache ?? DEFAULTS);
  useEffect(() => {
    let on = true;
    load().then((s) => {
      if (on) setSettings(s);
    });
    return () => {
      on = false;
    };
  }, []);
  return settings;
}
