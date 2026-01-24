const STORAGE_KEY = "eps_favorites";
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedArr: string[] = EMPTY;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function getFavoritesSnapshot(): string[] {
  if (typeof window === "undefined") {
    return cachedArr;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  if (raw === cachedRaw) {
    return cachedArr;
  }

  cachedRaw = raw;

  try {
    const parsed = JSON.parse(raw);
    cachedArr = Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : EMPTY;
  } catch {
    cachedArr = EMPTY;
  }

  return cachedArr;
}

export function setFavorites(next: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(next);
  if (raw === cachedRaw) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedArr = next;
  emit();
}

export function toggleFavorite(id: string) {
  const current = getFavoritesSnapshot();
  const has = current.includes(id);
  const next = has ? current.filter((item) => item !== id) : [...current, id];
  setFavorites(next);
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) {
    return;
  }

  cachedRaw = null;
  getFavoritesSnapshot();
  emit();
}

export function subscribeFavorites(callback: () => void) {
  listeners.add(callback);

  if (typeof window !== "undefined" && listeners.size === 1) {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export const EMPTY_FAVORITES_SERVER_SNAPSHOT = EMPTY;
