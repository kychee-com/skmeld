import brand from "../custom/brand.json";

const LANG_KEY = "skmeld.language";

let localeStrings: Record<string, string> = {};
let fallbackStrings: Record<string, string> = {};

export function t(key: string, vars: Record<string, string | number> = {}): string {
  if (key === "_meta") return key;

  let lookupKey = key;
  if (vars.count !== undefined && vars.count === 1) {
    lookupKey = key + "_one";
  }

  const str =
    localeStrings[lookupKey] ??
    localeStrings[key] ??
    fallbackStrings[lookupKey] ??
    fallbackStrings[key] ??
    key;

  const merged: Record<string, string | number> = { app_name: brand.name, ...vars };
  return str.replace(/\{(\w+)\}/g, (_, k: string) => {
    const val = merged[k];
    return val !== undefined ? String(val) : `{${k}}`;
  });
}

async function loadLocale(locale: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`/custom/strings/${locale}.json`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function initI18n(): Promise<void> {
  const saved = localStorage.getItem(LANG_KEY);
  const available = brand.languages || ["en"];
  const locale = saved && available.includes(saved) ? saved : brand.defaultLanguage || "en";
  localStorage.setItem(LANG_KEY, locale);

  localeStrings = await loadLocale(locale);
  if (locale !== "en") {
    fallbackStrings = await loadLocale("en");
  } else {
    fallbackStrings = localeStrings;
  }
}

export async function setLanguage(locale: string): Promise<void> {
  localStorage.setItem(LANG_KEY, locale);
  localeStrings = await loadLocale(locale);
  if (locale !== "en") {
    fallbackStrings = await loadLocale("en");
  } else {
    fallbackStrings = localeStrings;
  }
  window.location.reload();
}

export function currentLanguage(): string {
  return localStorage.getItem(LANG_KEY) || brand.defaultLanguage || "en";
}

export { brand };
