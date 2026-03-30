import {
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite as toggleFavoriteInStore,
} from "@/lib/favoritesStore";

const THEME_KEY = "eps_field_theme";
const DEFAULT_THEME = 1;

export type ThemePreference = 1 | 2 | 3;

function isBrowser() {
  return typeof window !== "undefined";
}

function emit(eventName: string, detail: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

const THEME_EVENT = "eps:theme";

export function toggleFavorite(slug: string) {
  toggleFavoriteInStore(slug);
}

export function onFavoritesChange(handler: (list: string[]) => void) {
  return subscribeFavorites(() => handler(getFavoritesSnapshot()));
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

/* ── Anatomy animation preference ─────────────────────────────────── */

const ANAT_ANIM_KEY = "eps_anatomy_anim";
const ANAT_ANIM_EVENT = "eps:anatomy-anim";

export function getAnatomyAnim(): boolean {
  if (!isBrowser()) return true;
  const raw = window.localStorage.getItem(ANAT_ANIM_KEY);
  return raw !== "false"; // default true
}

export function setAnatomyAnim(value: boolean) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ANAT_ANIM_KEY, String(value));
  emit(ANAT_ANIM_EVENT, value);
}

export function onAnatomyAnimChange(handler: (value: boolean) => void) {
  if (!isBrowser()) return () => {};
  const listener = (event: Event) => {
    handler((event as CustomEvent<boolean>).detail ?? getAnatomyAnim());
  };
  window.addEventListener(ANAT_ANIM_EVENT, listener);
  return () => window.removeEventListener(ANAT_ANIM_EVENT, listener);
}
