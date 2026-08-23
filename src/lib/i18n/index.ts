import { en } from "./en";
import { ar } from "./ar";
import { fr } from "./fr";
import type { Dictionary } from "./types";

export type Locale = "en" | "ar" | "fr";

export const locales: Locale[] = ["ar", "en", "fr"];
export const dictionaries: Record<Locale, Dictionary> = { en, ar, fr };

export function getDict(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
};

export type { Dictionary };
