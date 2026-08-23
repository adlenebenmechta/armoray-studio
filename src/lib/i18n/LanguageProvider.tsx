"use client";

import React, { createContext, useContext, useCallback, useEffect, useSyncExternalStore } from "react";
import { getDict, type Dictionary, type Locale } from "./index";

const STORAGE_KEY = "armoray-locale";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Locale {
  if (typeof window === "undefined") return "ar";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ar" || saved === "en" || saved === "fr") return saved;
  return "ar";
}

function getServerSnapshot(): Locale {
  return "ar";
}

interface LanguageCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dict: Dictionary;
}

const Ctx = createContext<LanguageCtx>({
  locale: "ar",
  setLocale: () => {},
  dict: getDict("ar"),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    listeners.forEach((cb) => cb());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDict(locale).dir;
  }, [locale]);

  return <Ctx.Provider value={{ locale, setLocale, dict: getDict(locale) }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
