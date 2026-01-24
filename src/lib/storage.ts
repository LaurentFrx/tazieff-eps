const FAVORITES_KEY = "eps_favorites";
const THEME_KEY = "eps_field_theme";
const DEFAULT_THEME = 1;

export type ThemePreference = 1 | 2 | 3;

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function emit(eventName: string, detail: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

const FAVORITES_EVENT = "eps:favorites";
const THEME_EVENT = "eps:theme";

export function getFavorites(): string[] {
  const list = readJson<string[]>(FAVORITES_KEY, []);
  return Array.from(new Set(list));
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function addFavorite(slug: string) {
  const list = getFavorites();
  if (!list.includes(slug)) {
    list.push(slug);
    writeJson(FAVORITES_KEY, list);
    emit(FAVORITES_EVENT, list);
  }
}

export function removeFavorite(slug: string) {
  const list = getFavorites().filter((item) => item !== slug);
  writeJson(FAVORITES_KEY, list);
  emit(FAVORITES_EVENT, list);
}

export function toggleFavorite(slug: string) {
  if (isFavorite(slug)) {
    removeFavorite(slug);
  } else {
    addFavorite(slug);
  }
}

export function onFavoritesChange(handler: (list: string[]) => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<string[]>).detail ?? getFavorites());
  };

  window.addEventListener(FAVORITES_EVENT, listener);
  return () => window.removeEventListener(FAVORITES_EVENT, listener);
}

export function getTheme(): ThemePreference {
  if (!isBrowser()) {
    return DEFAULT_THEME;
  }

  const raw = window.localStorage.getItem(THEME_KEY);
  const value = Number(raw);
  if (value === 1 || value === 2 || value === 3) {
    return value as ThemePreference;
  }

  return DEFAULT_THEME;
}

export function setTheme(value: ThemePreference) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(THEME_KEY, String(value));
  emit(THEME_EVENT, value);
}

export function onThemeChange(handler: (value: ThemePreference) => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ThemePreference>).detail;
    handler(detail ?? getTheme());
  };

  window.addEventListener(THEME_EVENT, listener);
  return () => window.removeEventListener(THEME_EVENT, listener);
}
