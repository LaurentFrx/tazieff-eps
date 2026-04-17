import { describe, it, expect, beforeEach, vi } from "vitest";

type StoreModule = typeof import("./favoritesStore");

const STORAGE_KEY = "eps_favorites";
let store: StoreModule;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  store = await import("./favoritesStore");
});

describe("getFavoritesSnapshot", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(store.getFavoritesSnapshot()).toEqual([]);
  });

  it("returns parsed array when localStorage contains a valid JSON array", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["a", "b"]));
    expect(store.getFavoritesSnapshot()).toEqual(["a", "b"]);
  });

  it("returns empty array on corrupted JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(store.getFavoritesSnapshot()).toEqual([]);
  });

  it("returns empty array when stored value is not an array", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    expect(store.getFavoritesSnapshot()).toEqual([]);
  });

  it("filters out non-string items in the stored array", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["valid", 123, null, "ok", false]),
    );
    expect(store.getFavoritesSnapshot()).toEqual(["valid", "ok"]);
  });

  it("caches the result and returns the same reference across calls", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["a"]));
    const first = store.getFavoritesSnapshot();
    const second = store.getFavoritesSnapshot();
    expect(second).toBe(first);
  });
});

describe("setFavorites", () => {
  it("persists the new array to localStorage", () => {
    store.setFavorites(["x", "y"]);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw ?? "null")).toEqual(["x", "y"]);
  });

  it("notifies subscribed listeners", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribeFavorites(listener);
    store.setFavorites(["a"]);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("does not emit when the new value is identical to the current one", () => {
    store.setFavorites(["a"]);
    const listener = vi.fn();
    const unsubscribe = store.subscribeFavorites(listener);
    store.setFavorites(["a"]);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("toggleFavorite", () => {
  it("adds the slug when it is absent", () => {
    store.toggleFavorite("pompes");
    expect(store.getFavoritesSnapshot()).toContain("pompes");
  });

  it("removes the slug when it is present", () => {
    store.setFavorites(["a", "b"]);
    store.toggleFavorite("a");
    expect(store.getFavoritesSnapshot()).toEqual(["b"]);
  });

  it("is idempotent after two successive toggles", () => {
    store.toggleFavorite("x");
    store.toggleFavorite("x");
    expect(store.getFavoritesSnapshot()).not.toContain("x");
  });
});

describe("subscribeFavorites", () => {
  it("stops receiving callbacks after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribeFavorites(listener);
    store.setFavorites(["a"]);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.setFavorites(["b"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reacts to cross-tab storage events on its own key", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribeFavorites(listener);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["external"]));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(["external"]),
      }),
    );
    expect(listener).toHaveBeenCalled();
    expect(store.getFavoritesSnapshot()).toEqual(["external"]);
    unsubscribe();
  });

  it("ignores storage events on unrelated keys", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribeFavorites(listener);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "other-key", newValue: "whatever" }),
    );
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("EMPTY_FAVORITES_SERVER_SNAPSHOT", () => {
  it("is a stable empty array usable as SSR snapshot", () => {
    expect(store.EMPTY_FAVORITES_SERVER_SNAPSHOT).toEqual([]);
  });
});
