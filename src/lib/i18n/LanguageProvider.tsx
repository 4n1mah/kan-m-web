"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICT, type Dict, type Lang } from "./dictionary";

const STORAGE_KEY = "kanm_lang";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: Dict;
};

const LangContext = createContext<LangContextValue>({
  lang: "es",
  setLang: () => {},
  toggle: () => {},
  t: DICT.es,
});

function readStoredLang(): Lang | null {
  if (typeof document === "undefined") return null;
  // localStorage primero (persistencia por dispositivo), luego cookie.
  try {
    const ls = window.localStorage.getItem(STORAGE_KEY);
    if (ls === "es" || ls === "en") return ls;
  } catch {
    /* localStorage puede fallar en modo privado; seguimos con cookie */
  }
  const m = document.cookie.match(/(?:^|;\s*)kanm_lang=(es|en)/);
  return (m?.[1] as Lang) ?? null;
}

// Provider del idioma. El español es el valor por defecto para que el HTML
// que renderiza el servidor (SEO) siempre salga en español. Al montar, si el
// visitante ya eligió inglés antes, cambiamos al instante. El cambio se guarda
// en localStorage + cookie para que persista entre páginas y visitas.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = readStoredLang();
    if (stored && stored !== "es") {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignorar */
    }
    // Cookie a 1 año para futuras visitas.
    document.cookie = `${STORAGE_KEY}=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = l;
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "es" ? "en" : "es");
  }, [lang, setLang]);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, toggle, t: DICT[lang] }),
    [lang, setLang, toggle],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// Hook para consumir el idioma en cualquier componente cliente.
export function useLang() {
  return useContext(LangContext);
}
